import { readFile, writeFile } from "node:fs/promises";

const productFile = new URL("../app/boutique/products.ts", import.meta.url);
const source = await readFile(productFile, "utf8");
const lines = source.split(/\r?\n/);
const products = lines
  .filter((line) => line.trim().startsWith('{"id":'))
  .map((line) => JSON.parse(line.trim().replace(/,$/, "")));

const categoryNames = new Map([
  ["4634bd76-8ba7-24b9-a7a0-2702838d95b1", "Originaux et autres"],
  ["80282a93-4353-da18-4388-10508dec4b90", "Affiches"],
  ["065c118c-78fb-4a14-e9c6-d8286f510f04", "Magnets et carnets"],
  ["0c78d8c1-cd8a-1d60-8e7c-75356c30ef80", "Sacs en coton"],
  ["09d63e84-7835-bdd8-fd94-caa09402822b", "Stickers"],
  ["07c45023-7aad-6c07-dfe2-d813f9a2ff20", "Cartes postales"],
]);

function findProduct(value, slug) {
  if (!value || typeof value !== "object") return null;
  if (value.urlPart === slug && Array.isArray(value.categoryIds)) return value;
  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    const match = findProduct(child, slug);
    if (match) return match;
  }
  return null;
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

const synced = await pool(products, 6, async (product, index) => {
  try {
    const response = await fetch(`https://www.julietteamadis-art.com/product-page/${encodeURIComponent(product.id)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const warmup = html.match(/<script type="application\/json" id="wix-warmup-data">([\s\S]*?)<\/script>/)?.[1];
    const wixProduct = warmup ? findProduct(JSON.parse(warmup), product.id) : null;
    if (!wixProduct) throw new Error("métadonnées absentes");
    const categories = [...new Set(wixProduct.categoryIds.map((id) => categoryNames.get(id)).filter(Boolean))];
    const badge = String(wixProduct.ribbon || "").trim() || undefined;
    const compareAtPrice = Number(wixProduct.comparePrice) > Number(wixProduct.price)
      ? Number(wixProduct.comparePrice)
      : undefined;
    console.log(`${index + 1}/${products.length} ${product.name}: ${categories.join(", ") || product.category}`);
    return { ...product, category: categories[0] || product.category, categories: categories.length ? categories : [product.category], badge, compareAtPrice };
  } catch (error) {
    console.warn(`${index + 1}/${products.length} ${product.name}: ${error.message}`);
    return { ...product, categories: product.categories?.length ? product.categories : [product.category] };
  }
});

let productIndex = 0;
const output = lines.map((line) => {
  if (!line.trim().startsWith('{"id":')) return line;
  return `  ${JSON.stringify(synced[productIndex++])},`;
}).join("\n");

await writeFile(productFile, output);
for (const category of categoryNames.values()) {
  const count = synced.filter((product) => product.categories.includes(category)).length;
  console.log(`${category}: ${count}`);
}
