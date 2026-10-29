import { readFile, writeFile, mkdir } from "node:fs/promises";

const productFile = new URL("../app/boutique/products.ts", import.meta.url);
const shopDir = new URL("../public/shop/", import.meta.url);
const source = await readFile(productFile, "utf8");
const products = source.split(/\r?\n/).filter((line) => line.trim().startsWith('{"id":')).map((line) => JSON.parse(line.trim().replace(/,$/, "")));
await mkdir(shopDir, { recursive: true });

function findProductSchema(html) {
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const value = JSON.parse(match[1]);
      const candidates = Array.isArray(value) ? value : [value, ...(value?.["@graph"] || [])];
      const product = candidates.find((candidate) => candidate?.["@type"] === "Product");
      if (product) return product;
    } catch {}
  }
  return null;
}

function mediaId(value) {
  const url = typeof value === "string" ? value : value?.contentUrl || value?.url;
  return url?.match(/\/media\/([^/]+)/)?.[1] || null;
}

async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: limit }, run));
  return results;
}

const enriched = await pool(products, 7, async (product, index) => {
  const pageUrl = `https://www.julietteamadis-art.com/product-page/${encodeURIComponent(product.id)}`;
  try {
    const response = await fetch(pageUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const schema = findProductSchema(await response.text());
    const ids = [...new Set((schema?.image || []).map(mediaId).filter(Boolean))].slice(0, 6);
    const images = [product.image];
    for (let galleryIndex = 1; galleryIndex < ids.length; galleryIndex += 1) {
      const filename = `product-${String(index + 1).padStart(3, "0")}-${String(galleryIndex + 1).padStart(2, "0")}.webp`;
      const imageUrl = `https://static.wixstatic.com/media/${ids[galleryIndex]}/v1/fit/w_1000,h_1300,q_86/file.webp`;
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) continue;
      await writeFile(new URL(filename, shopDir), Buffer.from(await imageResponse.arrayBuffer()));
      images.push(`/shop/${filename}`);
    }
    console.log(`${index + 1}/${products.length} ${product.name}: ${images.length} image(s)`);
    return { ...product, images, description: String(schema?.description || "").trim() };
  } catch (error) {
    console.warn(`${index + 1}/${products.length} ${product.name}: ${error.message}`);
    return { ...product, images: [product.image], description: "" };
  }
});

const prefix = source.slice(0, source.indexOf("export const shopProducts"));
const typeBlock = prefix.replace("  image: string;\n", "  image: string;\n  images: string[];\n  description: string;\n");
const output = `${typeBlock}export const shopProducts: ShopProduct[] = [\n${enriched.map((product) => `  ${JSON.stringify(product)},`).join("\n")}\n];\n`;
await writeFile(productFile, output);
const withGallery = enriched.filter((product) => product.images.length > 1).length;
const imageCount = enriched.reduce((sum, product) => sum + product.images.length, 0);
console.log(`Done: ${withGallery} products with galleries, ${imageCount} local images total.`);
