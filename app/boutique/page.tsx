"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { shopCategories, shopProducts, type ShopProduct } from "./products";
import "./boutique.css";

type CartLine = { id: string; lineId?: string; quantity: number; selections?: Record<string, string>; note?: string; unitPrice?: number };
type DescriptionBlock = { kind: "heading" | "body"; text: string };
const renderRichText = (text: string) => text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean).map((part, index) => part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : part.startsWith("_") && part.endsWith("_") ? <em key={index}>{part.slice(1, -1)}</em> : part);

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const normalizeProductMedia = (product: ShopProduct): ShopProduct => ({
  ...product,
  image: product.image.startsWith("/shop/product-") ? product.image.replace("/shop/", "/shop/thumbs/") : product.image,
  images: product.images.map((image) => image.startsWith("/shop/product-") ? image.replace("/shop/", "/shop/detail/") : image),
});

const highlightedProductIds = [
  "encyclopédie-des-rêves-et-des-cauchemars",
  "affiche-la-gorgone",
  "carte-postale-la-veuve-noire",
];

const formatDescription = (product: ShopProduct | null): DescriptionBlock[] => {
  if (!product) return [];
  const fallback = "Une création issue de l’univers de Juliette Amadis, imprimée ou façonnée pour rejoindre votre collection.";
  const normalized = (product.description || fallback)
    .replaceAll("&amp;amp;", "&")
    .replaceAll("&amp;quot;", "\"")
    .replaceAll("&amp;#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replace(/\s*(?<!\*)\*([^*\n]{2,120})\*(?!\*)\s*/g, "\n\n## $1\n\n")
    .replace(/\s+(Présentation|Caractéristiques(?: produit)?|Option Dédicace|Détails techniques|Impression|Formats? du print)\s*:\s*/gi, "\n\n## $1\n\n")
    .replace(/([.!?…])(?=[A-ZÀ-Ö])/g, "$1 ")
    .replace(/(\S)(?=(?:Parution|ISBN|Dimensions?|Nombre de pages|Format|Écriture|Illustration|Épaisseur|Matériaux?|Couleur|Poids|Taille)\s*:)/g, "$1\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph && paragraph.replace(/^##\s*/, "").toLocaleLowerCase("fr") !== product.name.toLocaleLowerCase("fr"));
  return normalized.map((paragraph) => paragraph.startsWith("## ")
    ? { kind: "heading", text: paragraph.slice(3).trim() }
    : { kind: "body", text: paragraph.replace(/[ \t]+/g, " ").replace(/\s*-\s+/g, "\n• ").trim() });
};

const ShopSocialLinks = ({ className = "" }: { className?: string }) => (
  <nav className={`shop-social-reminder ${className}`.trim()} aria-label="Suivre Juliette Amadis sur les réseaux sociaux">
    <a href="https://www.instagram.com/juliette_a_illustrations/" target="_blank" rel="noreferrer" aria-label="Instagram de Juliette Amadis">
      <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle className="shop-social-dot" cx="17.4" cy="6.7" r="1" /></svg>
    </a>
    <a href="https://www.facebook.com/julietteamadis/" target="_blank" rel="noreferrer" aria-label="Facebook de Juliette Amadis">
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M14.4 21v-8h2.8l.4-3h-3.2V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H8.2v3H11v8h3.4Z" /></svg>
    </a>
  </nav>
);

const ShopCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const points = Array.from({ length: 16 }, () => ({ x: 0, y: 0 }));
    const sparks: Array<{ x: number; y: number; vx: number; vy: number; life: number }> = [];
    let started = false;
    let inside = false;
    let interactive = false;
    let opacity = 0;
    let speed = 0;
    let lastX = 0;
    let lastY = 0;
    let frame = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const requestDraw = () => {
      if (!frame) frame = window.requestAnimationFrame(draw);
    };
    const move = (event: PointerEvent) => {
      if (!started) {
        points.forEach((point) => { point.x = event.clientX; point.y = event.clientY; });
        lastX = event.clientX;
        lastY = event.clientY;
        started = true;
      }
      speed += (Math.min(1, Math.hypot(event.clientX - lastX, event.clientY - lastY) / 18) - speed) * .45;
      points[0].x = event.clientX;
      points[0].y = event.clientY;
      lastX = event.clientX;
      lastY = event.clientY;
      const target = event.target instanceof Element ? event.target : null;
      interactive = Boolean(target?.closest("a,button,input,select,textarea,summary"));
      inside = true;
      requestDraw();
    };
    const press = (event: PointerEvent) => {
      if (event.button !== 0) return;
      for (let index = 0; index < 7; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const force = 1 + Math.random() * 2;
        sparks.push({ x: event.clientX, y: event.clientY, vx: Math.cos(angle) * force, vy: Math.sin(angle) * force, life: 1 });
      }
      requestDraw();
    };
    const leave = () => { inside = false; requestDraw(); };
    const draw = () => {
      frame = 0;
      opacity += ((inside && started ? 1 : 0) - opacity) * .17;
      speed *= .92;
      for (let index = 1; index < points.length; index += 1) {
        points[index].x += (points[index - 1].x - points[index].x) * .4;
        points[index].y += (points[index - 1].y - points[index].y) * .4;
      }
      context.clearRect(0, 0, width, height);
      context.lineCap = "round";
      for (let index = points.length - 1; index > 0; index -= 1) {
        const strength = (1 - index / points.length) * opacity * Math.min(1, speed * 5);
        context.beginPath();
        context.moveTo(points[index].x, points[index].y);
        context.lineTo(points[index - 1].x, points[index - 1].y);
        context.strokeStyle = `rgba(216,184,90,${strength * .58})`;
        context.lineWidth = .45 + strength * 1.5;
        context.stroke();
      }
      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index];
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.vx *= .9;
        spark.vy *= .9;
        spark.life -= .055;
        if (spark.life <= 0) { sparks.splice(index, 1); continue; }
        context.fillStyle = `rgba(216,184,90,${spark.life * .7})`;
        context.beginPath();
        context.arc(spark.x, spark.y, 1.3 * spark.life, 0, Math.PI * 2);
        context.fill();
      }
      if (started) {
        context.save();
        context.translate(points[0].x, points[0].y);
        context.rotate(.72);
        context.scale(1.52, 1.52);
        context.globalAlpha = opacity;
        context.beginPath();
        context.moveTo(-2.25, -7);
        context.lineTo(-3.35, -34);
        context.quadraticCurveTo(-3.35, -38, 0, -38.5);
        context.quadraticCurveTo(3.35, -38, 3.35, -34);
        context.lineTo(2.25, -7);
        context.closePath();
        context.fillStyle = "rgba(34,35,32,.98)";
        context.fill();
        context.strokeStyle = "rgba(239,235,225,.58)";
        context.lineWidth = .65;
        context.stroke();
        context.beginPath();
        context.moveTo(-2.25, -7);
        context.lineTo(0, 1.4);
        context.lineTo(2.25, -7);
        context.closePath();
        context.fillStyle = "rgba(34,35,32,.98)";
        context.fill();
        context.beginPath();
        context.moveTo(-2.5, -9.5);
        context.lineTo(2.5, -9.5);
        context.strokeStyle = "rgba(216,184,90,.9)";
        context.lineWidth = 1;
        context.stroke();
        if (interactive) {
          context.beginPath();
          context.moveTo(9, -3); context.lineTo(15, -3);
          context.moveTo(12, -6); context.lineTo(12, 0);
          context.strokeStyle = "rgba(239,235,225,.94)";
          context.lineWidth = .9;
          context.stroke();
        }
        context.restore();
      }
      const moving = points.some((point, index) => index > 0 && Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y) > .08);
      if (Math.abs(opacity - (inside ? 1 : 0)) > .004 || speed > .002 || sparks.length || moving) requestDraw();
    };

    resize();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", press);
    window.addEventListener("resize", resize);
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("resize", resize);
      document.documentElement.removeEventListener("mouseleave", leave);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas className="shop-cursor-canvas" ref={canvasRef} aria-hidden="true" />;
};

export default function BoutiquePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [managedProducts, setManagedProducts] = useState<ShopProduct[]>(shopProducts);
  const [category, setCategory] = useState<(typeof shopCategories)[number]>("Tout");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(30);
  const [selected, setSelected] = useState<ShopProduct | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  const [optionNote, setOptionNote] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const cartTriggerRef = useRef<HTMLButtonElement>(null);
  const resultsRef = useRef<HTMLParagraphElement>(null);
  const cartHydratedRef = useRef(false);

  useEffect(() => {
    let savedCart: CartLine[] | null = null;
    try {
      const saved = window.localStorage.getItem("juliette-shop-cart");
      if (saved) savedCart = JSON.parse(saved);
    } catch { /* Un panier illisible repart simplement vide. */ }
    const frame = window.requestAnimationFrame(() => {
      if (savedCart) setCart(savedCart);
      cartHydratedRef.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let savedProducts = shopProducts;
    try {
      const overrides = JSON.parse(window.localStorage.getItem("juliette-shop-overrides") || "{}");
      savedProducts = shopProducts.map((product) => normalizeProductMedia({ ...product, ...(overrides[product.id] || {}) })).filter((product) => product.published !== false);
    } catch { /* Le catalogue public reste disponible si les réglages locaux sont illisibles. */ }
    const frame = window.requestAnimationFrame(() => setManagedProducts(savedProducts));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!cartHydratedRef.current) return;
    window.localStorage.setItem("juliette-shop-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const hasOverlay = Boolean(selected || cartOpen || checkoutOpen);
    if (!hasOverlay) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSelected(null);
      setCartOpen(false);
      setCheckoutOpen(false);
      cartTriggerRef.current?.focus();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selected, cartOpen, checkoutOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeMenu = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeMenu);
    return () => window.removeEventListener("keydown", closeMenu);
  }, [mobileMenuOpen]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    return managedProducts.filter((product) =>
      (category === "Tout" || (product.categories || [product.category]).includes(category)) &&
      (!query || product.name.toLocaleLowerCase("fr").includes(query)),
    );
  }, [category, search, managedProducts]);

  const highlightedProducts = useMemo(() => highlightedProductIds
    .map((id) => managedProducts.find((product) => product.id === id))
    .filter((product): product is ShopProduct => Boolean(product)), [managedProducts]);

  const selectedDescription = useMemo(() => formatDescription(selected), [selected]);
  const selectedPrice = selected ? selected.price + (selected.options || []).reduce((sum, option) => {
    const choice = option.choices.find((item) => item.id === selectedChoices[option.id]);
    return sum + (choice?.priceDelta || 0);
  }, 0) : 0;
  const relatedProducts = useMemo(() => selected
    ? managedProducts.filter((product) => product.id !== selected.id && product.category === selected.category).slice(0, 3)
    : [], [selected, managedProducts]);

  const cartDetails = cart.flatMap((line) => {
    const product = managedProducts.find((item) => item.id === line.id);
    return product ? [{ ...line, product }] : [];
  });
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cartDetails.reduce((sum, line) => sum + (line.unitPrice ?? line.product.price) * line.quantity, 0);

  const animateToCart = (source: HTMLElement) => {
    const target = cartTriggerRef.current;
    const media = source.closest(".shop-card-media");
    const images = Array.from(media?.querySelectorAll<HTMLImageElement>("img") || []);
    const sourceImage = images.find((image) => Number.parseFloat(window.getComputedStyle(image).opacity) > 0.5) || images[0];
    if (!target || !sourceImage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const start = sourceImage.getBoundingClientRect();
    const destination = target.getBoundingClientRect();
    const flyingImage = sourceImage.cloneNode(true) as HTMLImageElement;
    Object.assign(flyingImage.style, {
      position: "fixed",
      zIndex: "180",
      pointerEvents: "none",
      left: `${start.left}px`,
      top: `${start.top}px`,
      width: `${start.width}px`,
      height: `${start.height}px`,
      objectFit: "cover",
      margin: "0",
      filter: "saturate(.95)",
      transformOrigin: "center",
      boxShadow: "0 18px 46px rgba(24,16,11,.28)",
    });
    document.body.appendChild(flyingImage);
    const translateX = destination.left + destination.width / 2 - (start.left + start.width / 2);
    const translateY = destination.top + destination.height / 2 - (start.top + start.height / 2);
    const flight = flyingImage.animate([
      { transform: "translate3d(0,0,0) scale(1)", opacity: .9, borderRadius: "0" },
      { offset: .55, transform: `translate3d(${translateX * .62}px,${translateY * .54 - 34}px,0) scale(.38) rotate(4deg)`, opacity: .78, borderRadius: "8px" },
      { transform: `translate3d(${translateX}px,${translateY}px,0) scale(.055) rotate(12deg)`, opacity: .16, borderRadius: "50%" },
    ], { duration: 720, easing: "cubic-bezier(.2,.72,.25,1)", fill: "forwards" });
    window.setTimeout(() => target.animate([
      { transform: "scale(1)" },
      { transform: "scale(1.14)" },
      { transform: "scale(1)" },
    ], { duration: 360, easing: "ease-out" }), 520);
    flight.finished.finally(() => flyingImage.remove());
  };

  const addToCart = (product: ShopProduct, source?: HTMLElement) => {
    if (!product.available) return;
    if (source) animateToCart(source);
    const selections = (product.options || []).reduce<Record<string, string>>((result, option) => {
      const choiceId = selectedChoices[option.id] || option.choices[0]?.id;
      if (choiceId) result[option.id] = choiceId;
      return result;
    }, {});
    const unitPrice = product.price + (product.options || []).reduce((sum, option) => sum + (option.choices.find((choice) => choice.id === selections[option.id])?.priceDelta || 0), 0);
    const note = optionNote.trim();
    const lineId = [
      product.id,
      ...Object.entries(selections)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${value}`),
      ...(note ? [note] : []),
    ].join("|");
    setCart((current) => {
      const existing = current.find((line) => (line.lineId || line.id) === lineId);
      return existing
        ? current.map((line) => (line.lineId || line.id) === lineId ? { ...line, quantity: line.quantity + 1 } : line)
        : [...current, { id: product.id, lineId, quantity: 1, selections, note: note || undefined, unitPrice }];
    });
    setSelected(null);
    if (!source) setCartOpen(true);
  };

  const openProduct = (product: ShopProduct) => {
    setSelected(product);
    setGalleryIndex(0);
    setSelectedChoices((product.options || []).reduce<Record<string, string>>((result, option) => {
      if (option.choices[0]) result[option.id] = option.choices[0].id;
      return result;
    }, {}));
    setOptionNote("");
  };

  const selectCategory = (nextCategory: (typeof shopCategories)[number]) => {
    setCategory(nextCategory);
    setVisibleCount(30);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resultsRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    })));
  };

  const changeQuantity = (lineId: string, delta: number) => {
    setCart((current) => current
      .map((line) => (line.lineId || line.id) === lineId ? { ...line, quantity: line.quantity + delta } : line)
      .filter((line) => line.quantity > 0));
  };

  const submitDemoOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCart([]);
    setOrderComplete(true);
  };

  return <main className="shop-site" id="boutique-top">
    <ShopCursor />
    <a className="site-skip-link" href="#catalogue">Aller au catalogue</a>
    <header className="shop-topbar">
      <a className="shop-brand" href="/alternative#alternative-top" aria-label="Retour au portfolio de Juliette Amadis"><i className="shop-topbar-gear" aria-hidden="true" /><strong>Juliette Amadis</strong></a>
      <button className="shop-mobile-menu-toggle" type="button" aria-expanded={mobileMenuOpen} aria-controls="shop-main-navigation" onClick={() => setMobileMenuOpen((open) => !open)}>
        <span aria-hidden="true"><i /><i /><i /></span><strong>Menu</strong>
      </button>
      <nav id="shop-main-navigation" className={mobileMenuOpen ? "is-open" : ""} aria-label="Navigation principale">
        <a href="/alternative#alternative-top" onClick={() => setMobileMenuOpen(false)}><strong>Accueil</strong></a>
        <a href="/alternative#alternative-portfolio" onClick={() => setMobileMenuOpen(false)}><strong>Portfolio</strong></a>
        <a href="/alternative#alternative-about" onClick={() => setMobileMenuOpen(false)}><strong>À propos</strong></a>
        <a href="/alternative#alternative-festivals" onClick={() => setMobileMenuOpen(false)}><strong>Festivals</strong></a>
        <a href="/alternative#alternative-contact" onClick={() => setMobileMenuOpen(false)}><strong>Contact</strong></a>
        <a className="active" aria-current="page" href="#catalogue" onClick={() => setMobileMenuOpen(false)}><strong>Boutique</strong></a>
      </nav>
      <button ref={cartTriggerRef} className="shop-cart-trigger" type="button" onClick={() => setCartOpen(true)} aria-label={`Ouvrir le panier, ${cartCount} article${cartCount > 1 ? "s" : ""}`}>
        <span className="shop-cart-label">Panier</span>
        <span className="shop-cart-symbol" aria-hidden="true"><svg viewBox="0 0 28 28"><path d="M6.5 10.5h15l-1.1 11H7.6z" /><path d="M10 11V8.2a4 4 0 0 1 8 0V11" /></svg>{cartCount > 0 && <b>{cartCount > 99 ? "99+" : cartCount}</b>}</span>
      </button>
    </header>

    <section className="shop-masthead">
      <div className="shop-masthead-brand">
        <img src="/juliette-amadis-logo.webp" alt="Juliette Amadis, artiste illustratrice" />
        <div><small>BOUTIQUE OFFICIELLE</small><h1>La boutique<br /><em>de l’atelier.</em></h1><p>Affiches, éditions et curiosités illustrées.</p></div>
      </div>
    </section>

    <section className="shop-highlights" aria-labelledby="shop-highlights-title">
      <header><small>EN CE MOMENT</small><h2 id="shop-highlights-title">La sélection<br /><em>de Juliette.</em></h2><p>Trois pièces choisies dans la collection, entre édition, affiche et papeterie.</p></header>
      <div>{highlightedProducts.map((product) => <button type="button" key={product.id} onClick={() => openProduct(product)}>
        <span className="shop-highlight-image"><img src={product.image} alt="" />{product.badge && <b>{product.badge}</b>}</span>
        <span className="shop-highlight-copy"><small>{product.category}</small><strong>{product.name}</strong><em>{product.from && "À partir de "}{euro.format(product.price)}</em></span>
      </button>)}</div>
    </section>

    <section className="shop-catalogue" id="catalogue">
      <header className="shop-catalogue-head">
        <div><small>LA COLLECTION</small><h2>Toutes les<br /><em>créations.</em></h2></div>
        <label className="shop-search"><span>Rechercher une création</span><input value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(30); }} type="search" placeholder="Nom, univers…" /></label>
      </header>

      <div className="shop-category-bar" aria-label="Catégories">
        {shopCategories.map((item) => <button key={item} className={category === item ? "active" : ""} type="button" onClick={() => selectCategory(item)}>{item}</button>)}
      </div>
      <details className="shop-category-menu">
        <summary><span>Explorer par catégorie</span><strong>{category}</strong><i aria-hidden="true">⌄</i></summary>
        <div aria-label="Catégories">{shopCategories.map((item) => <button key={item} className={category === item ? "active" : ""} type="button" onClick={(event) => { selectCategory(item); event.currentTarget.closest("details")?.removeAttribute("open"); }}>{item}</button>)}</div>
      </details>

      <p ref={resultsRef} className="shop-results"><strong>{category === "Tout" ? "Toute la collection" : category}</strong><span>{filteredProducts.length} création{filteredProducts.length > 1 ? "s" : ""}</span></p>
      <div className="shop-grid">
        {filteredProducts.slice(0, visibleCount).map((product, index) => <article className="shop-card" key={product.id}>
          <div className="shop-card-media">
            <button className="shop-card-image" type="button" onClick={() => openProduct(product)} aria-label={`Voir ${product.name}`}>
              <img className="shop-card-image-primary" loading={index < 8 ? "eager" : "lazy"} src={product.images[0] || product.image} alt={product.name} />
              {product.images[1] && <img className="shop-card-image-secondary" loading="lazy" src={product.images[1]} alt="" aria-hidden="true" />}
              {product.badge && <b className="shop-product-badge">{product.badge}</b>}
            </button>
            <button className="shop-quick-add" type="button" disabled={!product.available} onClick={(event) => product.options?.length ? openProduct(product) : addToCart(product, event.currentTarget)}>{product.available ? product.options?.length ? "Choisir les options +" : "Ajouter au panier +" : "Bientôt disponible"}</button>
          </div>
          <div className="shop-card-copy"><button type="button" onClick={() => openProduct(product)}><small>{product.category}</small><strong>{product.name}</strong></button><p className="shop-card-price">{product.available ? <>{product.compareAtPrice && <del>{euro.format(product.compareAtPrice)}</del>}<span>{product.from && <small>À partir de</small>}<b>{euro.format(product.price)}</b></span></> : <b>Prix à confirmer</b>}</p></div>
        </article>)}
      </div>
      {visibleCount < filteredProducts.length && <button className="shop-more" type="button" onClick={() => setVisibleCount((count) => count + 30)}><span>Voir davantage de créations</span><b>+{Math.min(30, filteredProducts.length - visibleCount)}</b></button>}
      {filteredProducts.length === 0 && <div className="shop-empty"><span>✦</span><h3>Aucune création trouvée</h3><button type="button" onClick={() => { setSearch(""); setCategory("Tout"); setVisibleCount(30); }}>Réinitialiser les filtres</button></div>}
      <ShopSocialLinks className="shop-catalogue-socials" />
    </section>

    <section className="shop-promise">
      <small>L’ATELIER</small><h2>Imaginé à Orchies,<br /><em>préparé avec soin.</em></h2>
      <div><p>Chaque commande réunit les créations de Juliette dans un écrin sobre, pensé comme une extension de son univers.</p><ul><li>Expédition suivie</li><li>Emballage soigné</li><li>Paiement SumUp à venir</li></ul></div>
    </section>

    <footer className="shop-footer"><img src="/juliette-amadis-logo.webp" alt="Juliette Amadis, artiste illustratrice" width="640" height="240" /><p>Juliette Amadis · Illustratrice<br />Orchies, France</p><a href="mailto:juliette.amadis@gmail.com">Une question sur une création ? ↗</a><nav className="shop-legal-links" aria-label="Informations légales"><a href="/informations-legales#cgv">CGV</a><a href="/informations-legales#livraison">Livraison</a><a href="/informations-legales#retours">Retours</a><a href="/informations-legales#mentions-legales">Mentions légales</a><a href="/informations-legales#confidentialite">Confidentialité</a></nav></footer>

    {selected && <div className="shop-modal" role="dialog" aria-modal="true" aria-label={selected.name}>
      <article className="shop-product">
        <button className="shop-close" type="button" onClick={() => setSelected(null)} aria-label="Fermer">×</button>
        <div className="shop-product-gallery"><div className="shop-product-image"><img src={selected.images[galleryIndex] || selected.image} alt={`${selected.name} — vue ${galleryIndex + 1}`} />{selected.images.length > 1 && <><button className="shop-gallery-arrow prev" type="button" onClick={() => setGalleryIndex((current) => (current - 1 + selected.images.length) % selected.images.length)} aria-label="Image précédente">←</button><button className="shop-gallery-arrow next" type="button" onClick={() => setGalleryIndex((current) => (current + 1) % selected.images.length)} aria-label="Image suivante">→</button></>}</div>{selected.images.length > 1 && <div className="shop-product-thumbs">{selected.images.map((image, index) => <button key={image} className={index === galleryIndex ? "active" : ""} type="button" onClick={() => setGalleryIndex(index)} aria-label={`Afficher la vue ${index + 1}`}><img src={image} alt="" /></button>)}</div>}</div>
        <div className="shop-product-copy">
          <small>{selected.category}</small>
          {selected.badge && <b className="shop-detail-badge">{selected.badge}</b>}
          <h2>{selected.name}</h2>
          <p className="shop-product-price">{selected.available ? <>{selected.compareAtPrice && <del>{euro.format(selected.compareAtPrice)}</del>}<span className="shop-product-price-current">{selected.from && !(selected.options?.length) && <small>À partir de</small>}<strong>{euro.format(selectedPrice)}</strong></span></> : <strong>Prix à confirmer</strong>}</p>
          {selected.options?.length ? <section className="shop-product-options" aria-label="Options du produit">{selected.options.map((option) => <label key={option.id}><span>{option.label}</span><select value={selectedChoices[option.id] || ""} onChange={(event) => setSelectedChoices((current) => ({ ...current, [option.id]: event.target.value }))}>{option.choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.label}{choice.priceDelta ? ` (+${euro.format(choice.priceDelta)})` : ""}</option>)}</select></label>)}{selected.customTextField && <label><span>{selected.customTextField.label}</span><textarea value={optionNote} maxLength={selected.customTextField.maxLength || 500} placeholder={selected.customTextField.placeholder} onChange={(event) => setOptionNote(event.target.value)} rows={3} /></label>}</section> : null}
          <div className="shop-product-description">{selectedDescription.map((block, index) => block.kind === "heading" ? <h3 key={`${selected.id}-${index}`}>{block.text}</h3> : <p key={`${selected.id}-${index}`}>{renderRichText(block.text)}</p>)}</div>
          {selected.options?.length ? <p className="shop-variant-note">Le tarif se met à jour selon vos choix et l’option sélectionnée reste attachée à l’article dans le panier.</p> : null}
          <button type="button" disabled={!selected.available} onClick={() => addToCart(selected)}>{selected.available ? "Ajouter au panier" : "Me prévenir de sa disponibilité"}<span>↗</span></button>
          <ShopSocialLinks className="shop-product-socials" />
          {relatedProducts.length > 0 && <section className="shop-related"><h3>Articles similaires</h3><div>{relatedProducts.map((product) => <button type="button" key={product.id} onClick={() => openProduct(product)}><img src={product.image} alt="" /><span><strong>{product.name}</strong><small>{product.from && "À partir de "}{euro.format(product.price)}</small></span></button>)}</div></section>}
        </div>
      </article>
    </div>}

    {cartOpen && <div className="shop-drawer-layer">
      <aside className="shop-cart" role="dialog" aria-modal="true" aria-label="Panier">
        <header><div><small>VOTRE SÉLECTION</small><h2>Panier</h2><p>{cartCount} article{cartCount > 1 ? "s" : ""}</p></div><button type="button" onClick={() => setCartOpen(false)} aria-label="Fermer">×</button></header>
        <div className="shop-cart-lines">{cartDetails.length ? cartDetails.map((line) => {
          const { product, quantity } = line;
          const lineKey = line.lineId || line.id;
          const optionLabels = (product.options || []).map((option) => option.choices.find((choice) => choice.id === line.selections?.[option.id])?.label).filter(Boolean);
          return <article key={lineKey}>
            <img src={product.image} alt="" />
            <div className="shop-cart-line-copy">
              <strong>{product.name}</strong>
              {optionLabels.length > 0 && <span className="shop-cart-options">{optionLabels.join(" · ")}</span>}
              {line.note && <span className="shop-cart-note">« {line.note} »</span>}
              <small>{euro.format(line.unitPrice ?? product.price)}</small>
              <p className="shop-cart-quantity" aria-label={`Quantité pour ${product.name}`}><button type="button" onClick={() => changeQuantity(lineKey, -1)} aria-label="Diminuer la quantité">−</button><span>{quantity}</span><button type="button" onClick={() => changeQuantity(lineKey, 1)} aria-label="Augmenter la quantité">+</button></p>
            </div>
            <button className="shop-remove" type="button" onClick={() => setCart((current) => current.filter((item) => (item.lineId || item.id) !== lineKey))} aria-label={`Retirer ${product.name}`}>×</button>
          </article>;
        }) : <div className="shop-cart-empty"><span>✦</span><p>Votre sélection est encore vide.</p><button type="button" onClick={() => setCartOpen(false)}>Découvrir les créations</button></div>}</div>
        {cartDetails.length > 0 && <footer><p><span>Sous-total</span><strong>{euro.format(subtotal)}</strong></p><small>Les frais de livraison seront calculés à l’étape suivante.</small><button type="button" onClick={() => { setCartOpen(false); setOrderComplete(false); setCheckoutOpen(true); }}>Continuer vers le paiement <span>↗</span></button></footer>}
      </aside>
    </div>}

    {checkoutOpen && <div className="shop-modal shop-checkout-layer" role="dialog" aria-modal="true" aria-label="Commande de démonstration">
      <section className="shop-checkout">
        <button className="shop-close" type="button" onClick={() => setCheckoutOpen(false)} aria-label="Fermer">×</button>
        {!orderComplete ? <><header><span>MODE DÉMONSTRATION</span><small>SUMUP SERA CONNECTÉ ICI</small><h2>Finaliser la commande</h2><p>Aucun paiement réel ne sera demandé ni enregistré pendant cette phase locale.</p></header><form onSubmit={submitDemoOrder}><div className="shop-checkout-fields"><label>Prénom et nom<input name="name" autoComplete="name" required /></label><label>Adresse e-mail<input name="email" type="email" autoComplete="email" required /></label><label className="wide">Adresse<input name="address" autoComplete="street-address" required /></label><label>Code postal<input name="postal" inputMode="numeric" autoComplete="postal-code" required /></label><label>Ville<input name="city" autoComplete="address-level2" required /></label><label className="wide">Mode de livraison<select name="shipping"><option>Colissimo suivi · tarif à connecter</option><option>Retrait à l’atelier · Orchies</option></select></label><label className="wide shop-legal-consent"><input name="terms" type="checkbox" required /> <span>J’ai lu et j’accepte les <a href="/informations-legales#cgv" target="_blank" rel="noreferrer">conditions générales de vente</a>, la politique de livraison et de retour.</span></label></div><div className="shop-checkout-summary"><p><span>{cartCount} article{cartCount > 1 ? "s" : ""}</span><strong>{euro.format(subtotal)}</strong></p><button type="submit">Simuler la commande <span>→</span></button></div></form></> : <div className="shop-order-success"><span>✦</span><small>COMMANDE DE DÉMONSTRATION</small><h2>La structure est prête.</h2><p>Le futur branchement SumUp remplacera cette confirmation par une session de paiement sécurisée et une validation côté serveur.</p><button type="button" onClick={() => setCheckoutOpen(false)}>Retourner à la boutique</button></div>}
      </section>
    </div>}
  </main>;
}
