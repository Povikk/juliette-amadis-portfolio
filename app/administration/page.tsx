"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { shopCategories, shopProducts, type ShopProduct } from "../boutique/products";
import { localizeWorkDescription, portfolioWorks, sourceDescriptionFor } from "../portfolio-data";
import "./administration.css";

const CREDENTIALS_KEY = "juliette-alt-admin-credentials";
const SESSION_COOKIE = "juliette-admin-session";
const SHOP_KEY = "juliette-shop-overrides";
const WORKS_KEY = "juliette-alt-admin-works";
const HIDDEN_WORKS_KEY = "juliette-alt-hidden-works";
const WORK_OVERRIDES_KEY = "juliette-alt-work-overrides";
const WORK_ORDER_KEY = "juliette-alt-work-order";
const portfolioThumb = (source: string) => source.startsWith("data:") ? source : `https://static.wixstatic.com/media/${source}/v1/fill/w_420,h_520,q_78/file.webp`;

const bytesToHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
const derivePassword = async (password: string, salt: Uint8Array) => {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 210_000 }, material, 256);
  return bytesToHex(new Uint8Array(bits));
};
const hasAdminSession = () => document.cookie.split(";").some((cookie) => cookie.trim() === `${SESSION_COOKIE}=active`);
const rememberAdminSession = () => { document.cookie = `${SESSION_COOKIE}=active; Path=/; Max-Age=604800; SameSite=Strict`; };
const clearAdminSession = () => { document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Strict`; };

const prepareImage = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(reader.error);
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error("invalid-image"));
    image.onload = () => {
      const ratio = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("canvas"));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/webp", .86));
    };
    image.src = String(reader.result);
  };
  reader.readAsDataURL(file);
});

type Tab = "overview" | "site" | "portfolio" | "shop" | "backup";
type Overrides = Record<string, Partial<ShopProduct>>;
type WorkOverride = { title?: string; detailsFr?: string; detailsEn?: string };
type WorkOverrides = Record<string, WorkOverride>;
type DescriptionSections = { intro: string; dedication: string; presentation: string; features: string; shipping: string };
type ProductPreview = { id: string; name: string; category: string; price: number; compareAtPrice?: number; badge?: string; sections: DescriptionSections };

const splitDescription = (description = ""): DescriptionSections => {
  const sections: DescriptionSections = { intro: "", dedication: "", presentation: "", features: "", shipping: "" };
  let current: keyof DescriptionSections = "intro";
  const normalized = description
    .replace(/\s*(?<!\*)\*([^*\n]{2,120})\*(?!\*)\s*/g, "\n\n## $1\n\n")
    .replace(/\s+(Présentation|Caractéristiques(?: produit)?|Option Dédicace|Expédition|Livraison)\s*:\s*/gi, "\n\n## $1\n\n");
  normalized.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean).forEach((part) => {
    if (part.startsWith("## ")) {
      const heading = part.slice(3).toLocaleLowerCase("fr");
      current = heading.includes("dédicace") ? "dedication" : heading.includes("présentation") ? "presentation" : heading.includes("caractér") ? "features" : heading.includes("livraison") || heading.includes("expédition") ? "shipping" : current;
    } else sections[current] += `${sections[current] ? "\n\n" : ""}${part}`;
  });
  return sections;
};

const joinDescription = (data: FormData) => [
  String(data.get("descriptionIntro") || "").trim(),
  String(data.get("descriptionDedication") || "").trim() && `## Option dédicace\n\n${String(data.get("descriptionDedication") || "").trim()}`,
  String(data.get("descriptionPresentation") || "").trim() && `## Présentation\n\n${String(data.get("descriptionPresentation") || "").trim()}`,
  String(data.get("descriptionFeatures") || "").trim() && `## Caractéristiques\n\n${String(data.get("descriptionFeatures") || "").trim()}`,
  String(data.get("descriptionShipping") || "").trim() && `## Expédition\n\n${String(data.get("descriptionShipping") || "").trim()}`,
].filter(Boolean).join("\n\n");

const serializeOptions = (product: ShopProduct) => (product.options || []).map((option) => `${option.label} : ${option.choices.map((choice) => `${choice.label}${choice.priceDelta ? ` = +${choice.priceDelta}` : ""}`).join(" | ")}`).join("\n");
const optionId = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "option";
const parseOptions = (text: string): NonNullable<ShopProduct["options"]> => text.split("\n").map((line) => line.trim()).filter(Boolean).flatMap((line, lineIndex) => {
  const separator = line.indexOf(":"); if (separator < 0) return [];
  const label = line.slice(0, separator).trim(); const rawChoices = line.slice(separator + 1).split("|").map((item) => item.trim()).filter(Boolean);
  if (!label || !rawChoices.length) return [];
  return [{ id: `${optionId(label)}-${lineIndex}`, label, choices: rawChoices.map((rawChoice, choiceIndex) => {
    const match = rawChoice.match(/^(.*?)(?:\s*=\s*\+?\s*([0-9]+(?:[.,][0-9]+)?))?$/); const choiceLabel = (match?.[1] || rawChoice).trim(); const delta = match?.[2] ? Number(match[2].replace(",", ".")) : 0;
    return { id: `${optionId(choiceLabel)}-${choiceIndex}`, label: choiceLabel, priceDelta: delta || undefined };
  }) }];
});

const formatActiveDescription = (kind: "bold" | "italic" | "list") => {
  const textarea = document.activeElement;
  if (!(textarea instanceof HTMLTextAreaElement) || !textarea.closest(".admin-product")) return;
  const start = textarea.selectionStart; const end = textarea.selectionEnd; const selected = textarea.value.slice(start, end) || (kind === "list" ? "Élément de liste" : "texte");
  const replacement = kind === "bold" ? `**${selected}**` : kind === "italic" ? `_${selected}_` : selected.split("\n").map((line) => `• ${line.replace(/^•\s*/, "")}`).join("\n");
  textarea.setRangeText(replacement, start, end, "end"); textarea.dispatchEvent(new Event("input", { bubbles: true })); textarea.focus();
};

const renderRichText = (text: string) => text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean).map((part, index) => part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : part.startsWith("_") && part.endsWith("_") ? <em key={index}>{part.slice(1, -1)}</em> : part);

export default function AdministrationPage() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [setup, setSetup] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [overrides, setOverrides] = useState<Overrides>({});
  const [works, setWorks] = useState<string[][]>([]);
  const [hiddenWorks, setHiddenWorks] = useState<string[]>([]);
  const [workOverrides, setWorkOverrides] = useState<WorkOverrides>({});
  const [editingWorkSource, setEditingWorkSource] = useState<string | null>(null);
  const [workOrder, setWorkOrder] = useState<string[]>([]);
  const [draggedWork, setDraggedWork] = useState<string | null>(null);
  const [portfolioQuery, setPortfolioQuery] = useState("");
  const [portfolioFilter, setPortfolioFilter] = useState<"all" | "visible" | "hidden">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(shopProducts[0]?.id || "");
  const [productPreview, setProductPreview] = useState<ProductPreview | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const hasCredentials = Boolean(localStorage.getItem(CREDENTIALS_KEY));
    setSetup(!hasCredentials);
    setAuthenticated(hasCredentials && hasAdminSession());
    try {
      setOverrides(JSON.parse(localStorage.getItem(SHOP_KEY) || "{}"));
      setWorks(JSON.parse(localStorage.getItem(WORKS_KEY) || "[]"));
      setHiddenWorks(JSON.parse(localStorage.getItem(HIDDEN_WORKS_KEY) || "[]"));
      setWorkOverrides(JSON.parse(localStorage.getItem(WORK_OVERRIDES_KEY) || "{}"));
      setWorkOrder(JSON.parse(localStorage.getItem(WORK_ORDER_KEY) || "[]"));
    } catch { setError("Certaines données locales sont illisibles. Une sauvegarde peut être restaurée."); }
    setReady(true);
  }, []);

  useEffect(() => {
    const syncPortfolio = () => {
      try {
        setWorks(JSON.parse(localStorage.getItem(WORKS_KEY) || "[]"));
        setHiddenWorks(JSON.parse(localStorage.getItem(HIDDEN_WORKS_KEY) || "[]"));
        setWorkOverrides(JSON.parse(localStorage.getItem(WORK_OVERRIDES_KEY) || "{}"));
        setWorkOrder(JSON.parse(localStorage.getItem(WORK_ORDER_KEY) || "[]"));
      } catch { /* Les dernières données valides restent affichées. */ }
    };
    window.addEventListener("focus", syncPortfolio);
    window.addEventListener("storage", syncPortfolio);
    document.addEventListener("visibilitychange", syncPortfolio);
    return () => { window.removeEventListener("focus", syncPortfolio); window.removeEventListener("storage", syncPortfolio); document.removeEventListener("visibilitychange", syncPortfolio); };
  }, []);

  const products = useMemo(() => shopProducts.map((product) => ({ ...product, ...(overrides[product.id] || {}) })), [overrides]);
  const selected = products.find((product) => product.id === selectedId) || products[0];
  const descriptionSections = useMemo(() => splitDescription(selected?.description), [selected]);
  const livePreview: ProductPreview | null = selected ? (productPreview?.id === selected.id ? productPreview : {
    id: selected.id, name: selected.name, category: selected.category, price: selected.price,
    compareAtPrice: selected.compareAtPrice, badge: selected.badge, sections: descriptionSections,
  }) : null;
  const filtered = products.filter((product) => `${product.name} ${product.category}`.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")));
  const lowStock = products.filter((product) => typeof product.stock === "number" && product.stock > 0 && product.stock < 10).length;
  const promotions = products.filter((product) => product.compareAtPrice && product.compareAtPrice > product.price).length;
  const hidden = products.filter((product) => product.published === false).length;
  const portfolioLibrary = useMemo(() => {
    const originals = portfolioWorks.map((work) => { const raw=sourceDescriptionFor(work[0], false); const customFr=workOverrides[work[0]]?.detailsFr; return { source: work[0], title: workOverrides[work[0]]?.title || work[1], details: customFr && customFr !== raw ? customFr : localizeWorkDescription(raw, false), detailsEn: workOverrides[work[0]]?.detailsEn || localizeWorkDescription(sourceDescriptionFor(work[0], true), true), local: false, key: work[0] }; });
    const additions = works.map((work, index) => ({ source: work[0], title: workOverrides[work[0]]?.title || work[1], details: workOverrides[work[0]]?.detailsFr || work[2], detailsEn: workOverrides[work[0]]?.detailsEn || work[3], local: true, key: work[4] || `local-${index}` }));
    const knownSources = new Set([...originals, ...additions].map((work) => work.source));
    const recoverable = hiddenWorks.filter((source) => typeof source === "string" && !knownSources.has(source)).map((source) => ({ source, title: workOverrides[source]?.title || "Œuvre masquée", details: workOverrides[source]?.detailsFr || "Cette œuvre peut être restaurée.", detailsEn: workOverrides[source]?.detailsEn || "This artwork can be restored.", local: source.startsWith("data:"), key: source }));
    const complete = [...originals, ...additions, ...recoverable];
    const normalizedOrder = [...workOrder.filter((source) => complete.some((work) => work.source === source)), ...complete.map((work) => work.source).filter((source) => !workOrder.includes(source))];
    return complete.sort((a, b) => normalizedOrder.indexOf(a.source) - normalizedOrder.indexOf(b.source)).filter((work) => {
      const isHidden = hiddenWorks.includes(work.source);
      const matchesFilter = portfolioFilter === "all" || (portfolioFilter === "hidden" ? isHidden : !isHidden);
      return matchesFilter && `${work.title} ${work.details}`.toLocaleLowerCase("fr").includes(portfolioQuery.toLocaleLowerCase("fr"));
    });
  }, [works, hiddenWorks, workOverrides, workOrder, portfolioFilter, portfolioQuery]);
  const editingWork = editingWorkSource ? portfolioLibrary.find((work) => work.source === editingWorkSource) || (() => {
    const original = portfolioWorks.find((work) => work[0] === editingWorkSource); const local = works.find((work) => work[0] === editingWorkSource);
    if (original) { const raw=sourceDescriptionFor(original[0], false); const customFr=workOverrides[original[0]]?.detailsFr; return { source: original[0], title: workOverrides[original[0]]?.title || original[1], details: customFr && customFr !== raw ? customFr : localizeWorkDescription(raw, false), detailsEn: workOverrides[original[0]]?.detailsEn || localizeWorkDescription(sourceDescriptionFor(original[0], true), true), local: false, key: original[0] }; } return local ? { source: local[0], title: workOverrides[local[0]]?.title || local[1], details: workOverrides[local[0]]?.detailsFr || local[2], detailsEn: workOverrides[local[0]]?.detailsEn || local[3], local: true, key: local[4] || local[0] } : null;
  })() : null;

  const flash = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2600); };
  const storeOverrides = (next: Overrides) => { setOverrides(next); localStorage.setItem(SHOP_KEY, JSON.stringify(next)); };
  const toggleWork = (source: string) => {
    const next = hiddenWorks.includes(source) ? hiddenWorks.filter((item) => item !== source) : [...hiddenWorks, source];
    setHiddenWorks(next); localStorage.setItem(HIDDEN_WORKS_KEY, JSON.stringify(next)); flash(next.includes(source) ? "Œuvre masquée" : "Œuvre publiée");
  };
  const moveWork = (source: string, target: string) => {
    if (source === target) return;
    const allSources = [...portfolioWorks.map((work) => work[0]), ...works.map((work) => work[0]), ...hiddenWorks].filter((source, index, list) => typeof source === "string" && list.indexOf(source) === index);
    const next = [...workOrder.filter((item) => allSources.includes(item)), ...allSources.filter((item) => !workOrder.includes(item))];
    const from = next.indexOf(source); const to = next.indexOf(target); if (from < 0 || to < 0) return;
    next.splice(from, 1); next.splice(to, 0, source); setWorkOrder(next); localStorage.setItem(WORK_ORDER_KEY, JSON.stringify(next)); setDraggedWork(null); flash("Ordre du portfolio enregistré");
  };
  const workNumber = (source: string) => {
    const allSources = [...portfolioWorks.map((work) => work[0]), ...works.map((work) => work[0]), ...hiddenWorks].filter((item, index, list) => typeof item === "string" && list.indexOf(item) === index);
    const ordered = [...workOrder.filter((item) => allSources.includes(item)), ...allSources.filter((item) => !workOrder.includes(item))];
    return String(Math.max(0, ordered.indexOf(source)) + 1).padStart(2, "0");
  };
  const saveWork = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!editingWork) return; const data = new FormData(event.currentTarget);
    const nextOverrides = { ...workOverrides, [editingWork.source]: { title: String(data.get("title") || editingWork.title).trim(), detailsFr: String(data.get("detailsFr") || "").trim(), detailsEn: String(data.get("detailsEn") || "").trim() } };
    setWorkOverrides(nextOverrides); localStorage.setItem(WORK_OVERRIDES_KEY, JSON.stringify(nextOverrides));
    const shouldBeVisible = data.get("visible") === "on"; const isHidden = hiddenWorks.includes(editingWork.source);
    if (shouldBeVisible === isHidden) { const nextHidden = shouldBeVisible ? hiddenWorks.filter((source) => source !== editingWork.source) : [...hiddenWorks, editingWork.source]; setHiddenWorks(nextHidden); localStorage.setItem(HIDDEN_WORKS_KEY, JSON.stringify(nextHidden)); }
    setEditingWorkSource(null); flash("Œuvre enregistrée");
  };
  const restoreAllWorks = () => { setHiddenWorks([]); localStorage.setItem(HIDDEN_WORKS_KEY, "[]"); setPortfolioQuery(""); flash("Toutes les œuvres sont de nouveau visibles"); };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    const form = event.currentTarget; const data = new FormData(form); const password = String(data.get("password") || "");
    if (setup) {
      if (password.length < 10) return setError("Utilisez au moins 10 caractères.");
      if (password !== String(data.get("confirmation") || "")) return setError("Les mots de passe ne correspondent pas.");
      const salt = crypto.getRandomValues(new Uint8Array(16));
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ salt: bytesToHex(salt), hash: await derivePassword(password, salt) }));
      rememberAdminSession(); setSetup(false); setAuthenticated(true); form.reset(); return;
    }
    try {
      const credentials = JSON.parse(localStorage.getItem(CREDENTIALS_KEY) || "{}");
      const salt = new Uint8Array((String(credentials.salt).match(/.{1,2}/g) || []).map((pair) => Number.parseInt(pair, 16)));
      if (await derivePassword(password, salt) !== credentials.hash) return setError("Mot de passe incorrect.");
      rememberAdminSession(); setAuthenticated(true); form.reset();
    } catch { setError("L’accès local doit être réinitialisé."); }
  };

  const resetPassword = () => {
    if (!confirm("Réinitialiser le mot de passe local de cet appareil ?")) return;
    if (!confirm("Deuxième confirmation : il faudra créer un nouvel accès.")) return;
    localStorage.removeItem(CREDENTIALS_KEY); clearAdminSession(); setSetup(true); setAuthenticated(false); setError("");
  };

  const saveProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selected) return;
    const data = new FormData(event.currentTarget);
    const price = Number(data.get("price")); const oldPrice = Number(data.get("compareAtPrice")); const stockText = String(data.get("stock") || "");
    const next: Partial<ShopProduct> = {
      name: String(data.get("name") || selected.name).trim(), category: String(data.get("category") || selected.category),
      categories: [String(data.get("category") || selected.category)], price, compareAtPrice: oldPrice > price ? oldPrice : undefined,
      badge: String(data.get("badge") || "").trim() || undefined, description: joinDescription(data),
      stock: stockText === "" ? undefined : Math.max(0, Number(stockText)), available: data.get("available") === "on", published: data.get("published") === "on",
      options: parseOptions(String(data.get("options") || "")), customTextField: String(data.get("customTextLabel") || "").trim() ? { label: String(data.get("customTextLabel") || "").trim(), placeholder: String(data.get("customTextPlaceholder") || "").trim() || undefined, maxLength: 500 } : undefined,
    };
    storeOverrides({ ...overrides, [selected.id]: next }); flash("Produit enregistré");
  };

  const updateProductPreview = (form: HTMLFormElement) => {
    if (!selected) return;
    const data = new FormData(form); const price = Number(data.get("price")); const oldPrice = Number(data.get("compareAtPrice"));
    setProductPreview({
      id: selected.id, name: String(data.get("name") || selected.name), category: String(data.get("category") || selected.category),
      price: Number.isFinite(price) ? price : 0, compareAtPrice: oldPrice > price ? oldPrice : undefined,
      badge: String(data.get("badge") || "").trim() || undefined,
      sections: {
        intro: String(data.get("descriptionIntro") || ""), dedication: String(data.get("descriptionDedication") || ""),
        presentation: String(data.get("descriptionPresentation") || ""), features: String(data.get("descriptionFeatures") || ""),
        shipping: String(data.get("descriptionShipping") || ""),
      },
    });
  };

  useEffect(() => {
    if (tab !== "shop") return;
    const frame = window.requestAnimationFrame(() => {
      const form = document.querySelector<HTMLFormElement>(".admin-product");
      if (!form) return;
      const update = () => updateProductPreview(form);
      form.addEventListener("input", update);
      form.addEventListener("change", update);
      update();
      (form as HTMLFormElement & { __previewCleanup?: () => void }).__previewCleanup = () => { form.removeEventListener("input", update); form.removeEventListener("change", update); };
    });
    return () => {
      window.cancelAnimationFrame(frame);
      const form = document.querySelector<HTMLFormElement & { __previewCleanup?: () => void }>(".admin-product");
      form?.__previewCleanup?.();
    };
  }, [tab, selectedId]);

  const addWork = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const file = data.get("image") as File;
    if (!file?.size) return;
    try {
      const next = [...works, [await prepareImage(file), String(data.get("title") || "Sans titre"), String(data.get("detailsFr") || "Illustration digitale"), String(data.get("detailsEn") || "Digital illustration"), crypto.randomUUID()]];
      setWorks(next); localStorage.setItem(WORKS_KEY, JSON.stringify(next)); form.reset(); flash("Œuvre ajoutée");
    } catch { setError("L’image n’a pas pu être préparée. Essayez un fichier moins lourd."); }
  };

  const exportBackup = () => {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith("juliette-"));
    const data = Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)]));
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    link.download = `juliette-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href);
  };

  const importBackup = async (file: File) => {
    try { const data = JSON.parse(await file.text()); if (!confirm("Remplacer les réglages locaux par cette sauvegarde ?")) return; Object.entries(data).forEach(([key, value]) => { if (key.startsWith("juliette-") && typeof value === "string") localStorage.setItem(key, value); }); location.reload(); }
    catch { setError("Cette sauvegarde n’est pas valide."); }
  };

  if (!ready) return null;
  if (!authenticated) return <main className="admin-auth"><form onSubmit={submitLogin}><img src="/juliette-amadis-logo.webp" alt="Juliette Amadis" /><small>ESPACE DE MODÉRATION</small><h1>{setup ? "Créer votre accès" : "Bienvenue Juliette"}</h1><p>{setup ? "Choisissez un mot de passe pour cet appareil." : "Déverrouillez le tableau de bord."}</p><label>Mot de passe<input name="password" type="password" autoFocus required /></label>{setup && <label>Confirmation<input name="confirmation" type="password" required /></label>}{error && <strong role="alert">{error}</strong>}<button type="submit">{setup ? "Créer l’accès" : "Se connecter"}</button>{!setup && <button className="admin-link" type="button" onClick={resetPassword}>Mot de passe oublié ?</button>}<a href="/alternative">Retour au site</a></form></main>;

  return <main className="admin-app">
    <aside className="admin-sidebar"><a className="admin-logo" href="/alternative"><img src="/juliette-amadis-logo.webp" alt="" /></a><nav>{([['overview','Vue d’ensemble'],['site','Le site'],['portfolio','Portfolio'],['shop','Boutique'],['backup','Sauvegarde']] as [Tab,string][]).map(([id,label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}</nav><footer><a href="/alternative">Voir le site ↗</a><a href="/boutique">Voir la boutique ↗</a><button onClick={() => { clearAdminSession(); setAuthenticated(false); }}>Verrouiller</button></footer></aside>
    <section className="admin-workspace"><header className="admin-header"><div><small>ATELIER JULIETTE AMADIS</small><h1>{tab === 'overview' ? 'Vue d’ensemble' : tab === 'site' ? 'Modifier le site' : tab === 'portfolio' ? 'Gérer le portfolio' : tab === 'shop' ? 'Gérer la boutique' : 'Sauvegarde et accès'}</h1></div><span><i /> Modifications locales</span></header>{notice && <div className="admin-toast">{notice}</div>}{error && <div className="admin-error">{error}<button onClick={() => setError("")}>×</button></div>}

      {tab === "overview" && <div className="admin-overview"><div className="admin-stats"><article><small>CATALOGUE</small><strong>{products.length}</strong><span>produits</span></article><article><small>PROMOTIONS</small><strong>{promotions}</strong><span>actives</span></article><article><small>STOCK</small><strong>{lowStock}</strong><span>alertes faibles</span></article><article><small>VISIBILITÉ</small><strong>{hidden}</strong><span>masqués</span></article></div><section className="admin-welcome"><div><small>À FAIRE RAPIDEMENT</small><h2>Tout gérer au même endroit.</h2><p>Modifiez ici les produits, les œuvres et leurs réglages. Utilisez ensuite l’aperçu pour contrôler le résultat sur le site public.</p></div><div><button onClick={() => setTab("shop")}>Gérer les produits</button><a href="/alternative" target="_blank">Voir le site ↗</a></div></section></div>}

      {tab === "site" && <div className="admin-site-editor"><header><div><small>ÉDITION VISUELLE INTÉGRÉE</small><h2>Modifier les textes du site</h2><p>Cliquez directement sur un texte dans l’aperçu, modifiez-le puis cliquez ailleurs pour l’enregistrer.</p></div><div><a href="/alternative" target="_blank">Voir le site ↗</a><button className="admin-danger" onClick={() => { if (!confirm("Rétablir tous les textes d’origine ?")) return; Object.keys(localStorage).filter((key) => key.startsWith("juliette-alt-text-")).forEach((key) => localStorage.removeItem(key)); const frame=document.querySelector<HTMLIFrameElement>('.admin-site-frame');frame?.contentWindow?.location.reload();flash("Textes réinitialisés"); }}>Rétablir les textes</button></div></header><iframe className="admin-site-frame" src="/alternative?edit=1#alternative-top" title="Aperçu éditable du site" /></div>}

      {tab === "portfolio" && <div className="admin-portfolio-page admin-portfolio-library"><form className="admin-card admin-add-work" onSubmit={addWork}><small>NOUVELLE ŒUVRE</small><h2>Ajouter au portfolio</h2><label>Image<input name="image" type="file" accept="image/*" required /></label><label>Titre<input name="title" required /></label><div className="admin-two"><label>Détails français<input name="detailsFr" placeholder="Travail personnel · 2026" /></label><label>Détails anglais<input name="detailsEn" placeholder="Personal work · 2026" /></label></div><button className="admin-primary" type="submit">Ajouter l’œuvre</button></form><section className="admin-card admin-media"><header><div><small>MÉDIATHÈQUE DU PORTFOLIO</small><h2>{portfolioWorks.length + works.length} œuvres</h2><p>Glissez les cartes pour les classer. Leur numéro correspond à leur position sur le site.</p></div><a href="/alternative#alternative-portfolio" target="_blank">Voir le portfolio ↗</a></header><div className="admin-media-tools"><input value={portfolioQuery} onChange={(event) => setPortfolioQuery(event.target.value)} placeholder="Rechercher une œuvre…" /><div>{([['all','Toutes'],['visible','Visibles'],['hidden','Masquées']] as const).map(([id,label]) => <button type="button" key={id} className={portfolioFilter === id ? 'active' : ''} onClick={() => { setPortfolioFilter(id); setPortfolioQuery(''); }}>{label}{id === 'hidden' && hiddenWorks.length ? ` (${hiddenWorks.length})` : ''}</button>)}</div></div>{portfolioFilter === 'hidden' && hiddenWorks.length > 0 && <div className="admin-hidden-recovery"><span>{hiddenWorks.length} œuvre{hiddenWorks.length > 1 ? 's' : ''} masquée{hiddenWorks.length > 1 ? 's' : ''}</span><button type="button" onClick={restoreAllWorks}>Tout restaurer</button></div>}<div className="admin-media-grid">{portfolioLibrary.map((work) => { const isHidden=hiddenWorks.includes(work.source); return <article draggable className={`${isHidden ? 'hidden ' : ''}${draggedWork === work.source ? 'dragging' : ''}`} key={work.key} onDragStart={() => setDraggedWork(work.source)} onDragEnd={() => setDraggedWork(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => draggedWork && moveWork(draggedWork, work.source)}><div className="admin-media-image"><span className="admin-order-number">{workNumber(work.source)}</span><img loading="lazy" src={portfolioThumb(work.source)} alt={work.title} />{isHidden && <b>Masquée</b>}{work.local && <em>Ajout local</em>}</div><div className="admin-media-copy"><strong>{work.title}</strong><small>{work.details}</small><footer><button type="button" onClick={() => setEditingWorkSource(work.source)}>Modifier</button></footer></div></article>})}</div>{!portfolioLibrary.length && <div className="admin-empty"><p>Aucune œuvre ne correspond à ce filtre.</p>{hiddenWorks.length > 0 && <button className="admin-primary" type="button" onClick={restoreAllWorks}>Restaurer les œuvres masquées</button>}</div>}</section></div>}

      {tab === "portfolio" && editingWork && <div className="admin-work-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setEditingWorkSource(null); }}><form className="admin-work-editor" onSubmit={saveWork}><header><div><small>ŒUVRE Nº {workNumber(editingWork.source)}</small><h2>Modifier l’œuvre</h2></div><button type="button" onClick={() => setEditingWorkSource(null)} aria-label="Fermer">×</button></header><div className="admin-work-editor-body"><img src={portfolioThumb(editingWork.source)} alt="" /><div><label>Titre<input name="title" defaultValue={editingWork.title} required /></label><label>Détails français<textarea name="detailsFr" rows={4} defaultValue={editingWork.details} /></label><label>Détails anglais<textarea name="detailsEn" rows={4} defaultValue={editingWork.detailsEn} /></label><label className="admin-visible-check"><input name="visible" type="checkbox" defaultChecked={!hiddenWorks.includes(editingWork.source)} /> Visible dans le portfolio</label></div></div><footer><button className="admin-primary" type="submit">Enregistrer</button>{editingWork.local && <button className="admin-danger" type="button" onClick={() => { if (!confirm(`Supprimer définitivement « ${editingWork.title} » ?`)) return; const next=works.filter((item)=>item[0]!==editingWork.source);setWorks(next);localStorage.setItem(WORKS_KEY,JSON.stringify(next)); setEditingWorkSource(null);flash('Œuvre supprimée'); }}>Supprimer définitivement</button>}</footer></form></div>}

      {tab === "shop" && <div className="admin-formatbar" role="toolbar" aria-label="Mise en forme de la description"><span>Sélectionnez du texte dans un champ, puis :</span><button type="button" onMouseDown={(event) => { event.preventDefault(); formatActiveDescription('bold'); }}><strong>G</strong> Gras</button><button type="button" onMouseDown={(event) => { event.preventDefault(); formatActiveDescription('italic'); }}><em>I</em> Italique</button><button type="button" onMouseDown={(event) => { event.preventDefault(); formatActiveDescription('list'); }}>• Liste</button></div>}

      {tab === "shop" && <div className="admin-shop"><aside><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un produit…" /><span>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span><div>{filtered.map((product) => <button className={selected?.id === product.id ? "active" : ""} key={product.id} onClick={() => setSelectedId(product.id)}><img src={product.image} alt="" /><span><strong>{product.name}</strong><small>{product.category} · {product.price.toFixed(2)} €</small></span>{product.published === false && <b>Masqué</b>}</button>)}</div></aside>{selected && <form className="admin-product" key={selected.id} onSubmit={saveProduct}><header><img src={selected.image} alt="" /><div><small>FICHE PRODUIT</small><h2>{selected.name}</h2><a href="/boutique" target="_blank">Voir la boutique ↗</a></div></header><div className="admin-two"><label>Nom<input name="name" defaultValue={selected.name} /></label><label>Catégorie<select name="category" defaultValue={selected.category}>{shopCategories.filter((item) => item !== "Tout").map((item) => <option key={item}>{item}</option>)}</select></label><label>Prix actuel (€)<input name="price" type="number" min="0" step="0.01" defaultValue={selected.price} /></label><label>Ancien prix barré (€)<input name="compareAtPrice" type="number" min="0" step="0.01" defaultValue={selected.compareAtPrice || ""} placeholder="Aucune promotion" /></label><label>Ruban<input name="badge" defaultValue={selected.badge || ""} placeholder="Nouveauté, Retour en stock…" /></label><label>Stock<input name="stock" type="number" min="0" defaultValue={selected.stock ?? ""} placeholder="Non suivi" /></label></div><section className="admin-options-editor"><header><div><small>VARIANTES DU PRODUIT</small><h3>Formats et options</h3></div><p>Une ligne par option. Séparez les choix avec | et indiquez un supplément avec = +5.</p></header><label>Options<textarea name="options" rows={4} defaultValue={serializeOptions(selected)} placeholder={'Format : A4 | A3 = +6 | A4 encadré = +18\nFinition : Mate | Brillante = +2'} /></label><div className="admin-two"><label>Champ de précision facultatif<input name="customTextLabel" defaultValue={selected.customTextField?.label || ""} placeholder="Dédicace pour :" /></label><label>Texte indicatif<input name="customTextPlaceholder" defaultValue={selected.customTextField?.placeholder || ""} placeholder="Prénom ou message…" /></label></div></section><section className="admin-description-editor"><header><div><small>CONTENU DE LA FICHE</small><h3>Description mise en page</h3></div><p>Chaque bloc devient une section propre dans la fiche produit. Laissez un bloc vide pour ne pas l’afficher.</p></header><label><span>Introduction</span><textarea name="descriptionIntro" rows={4} defaultValue={descriptionSections.intro} placeholder="Présentez brièvement la création…" /></label><div className="admin-description-grid"><label><span>Option dédicace</span><textarea name="descriptionDedication" rows={5} defaultValue={descriptionSections.dedication} /></label><label><span>Présentation</span><textarea name="descriptionPresentation" rows={5} defaultValue={descriptionSections.presentation} /></label><label><span>Caractéristiques</span><textarea name="descriptionFeatures" rows={6} defaultValue={descriptionSections.features} placeholder={'Dimensions : 24 × 32 cm\nPapier : 310 g\n…'} /></label><label><span>Expédition</span><textarea name="descriptionShipping" rows={6} defaultValue={descriptionSections.shipping} placeholder="Emballage, suivi et délais…" /></label></div></section><div className="admin-checks"><label><input name="available" type="checkbox" defaultChecked={selected.available} /> Disponible à l’achat</label><label><input name="published" type="checkbox" defaultChecked={selected.published !== false} /> Visible dans la boutique</label></div><footer><button className="admin-primary" type="submit">Enregistrer les modifications</button><button type="button" onClick={() => { const next={...overrides};delete next[selected.id];storeOverrides(next);flash("Produit restauré"); }}>Restaurer la fiche Wix</button></footer></form>}</div>}

      {tab === "shop" && selected && livePreview && <aside className="admin-live-preview" aria-live="polite"><header><small>APERÇU EN DIRECT</small><strong>Fiche produit</strong><a href="/boutique" target="_blank">Ouvrir la boutique ↗</a></header><div className="admin-preview-image"><img src={selected.image} alt="" />{livePreview.badge && <b>{livePreview.badge}</b>}</div><article><small>{livePreview.category}</small><h2>{livePreview.name || "Sans titre"}</h2><p className="admin-preview-price">{livePreview.compareAtPrice && <del>{livePreview.compareAtPrice.toFixed(2).replace('.', ',')} €</del>}<strong>{livePreview.price.toFixed(2).replace('.', ',')} €</strong></p>{([['Introduction',livePreview.sections.intro],['Option dédicace',livePreview.sections.dedication],['Présentation',livePreview.sections.presentation],['Caractéristiques',livePreview.sections.features],['Expédition',livePreview.sections.shipping]] as const).filter(([,text]) => text.trim()).map(([title,text], index) => <section key={title}>{index > 0 && <h3>{title}</h3>}<p>{renderRichText(text)}</p></section>)}<button type="button">Ajouter au panier ↗</button></article></aside>}

      {tab === "backup" && <div className="admin-simple"><section><small>SAUVEGARDE</small><h2>Conserver les modifications</h2><p>Les réglages sont actuellement enregistrés uniquement dans ce navigateur. Exportez régulièrement une sauvegarde.</p><button className="admin-primary" onClick={exportBackup}>Télécharger une sauvegarde</button><label className="admin-import">Restaurer une sauvegarde<input type="file" accept="application/json" onChange={(event) => event.target.files?.[0] && importBackup(event.target.files[0])} /></label></section><section><small>ACCÈS</small><h2>Mot de passe local</h2><p>Cette protection convient au travail local, mais pas encore à une administration publique. Une vraie connexion sécurisée sera nécessaire avant la mise en ligne.</p><button className="admin-danger" onClick={resetPassword}>Réinitialiser le mot de passe</button></section></div>}
    </section>
  </main>;
}
