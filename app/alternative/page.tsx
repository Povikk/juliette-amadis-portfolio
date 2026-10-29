"use client";

import { startTransition, useEffect, useRef, useState, type FormEvent } from "react";
import "./alternative.css";
import "./identity.css";
import { localizeWorkDescription, portfolioWorks as completePortfolioWorks, sourceDescriptionFor } from "../portfolio-data";

const wixImage = (id: string, width = 1800, height = 2200) =>
  `https://static.wixstatic.com/media/${id}/v1/fit/w_${width},h_${height},q_92/file.webp`;

const portfolioImage = (source: string, width = 1800, height = 2200) =>
  source.startsWith("data:") || source.startsWith("blob:") ? source : wixImage(source, width, height);

const preparePortfolioImage = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(reader.error);
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error("invalid-image"));
    image.onload = () => {
      const maximum = 1600;
      const ratio = Math.min(1, maximum / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("canvas-unavailable"));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/webp", .86));
    };
    image.src = String(reader.result);
  };
  reader.readAsDataURL(file);
});

const heroImages = completePortfolioWorks.map((work) => work[0]);

const animatedLetters = (text: string) => Array.from(text).map((character, index) => (
  <span
    className="alt-hero-letter"
    aria-hidden="true"
    key={`${character}-${index}`}
    style={{ animationDelay: `${index * 8}ms` }}
  >
    {character === " " ? "\u00a0" : character}
  </span>
));

const sections = [
  ["01", "alternative-top"],
  ["02", "alternative-portfolio"],
  ["03", "alternative-about"],
  ["04", "alternative-festivals"],
  ["05", "alternative-contact"],
];

const navigationLabels = {
  fr: ["Accueil", "Portfolio", "À propos", "Festivals", "Contact"],
  en: ["Home", "Portfolio", "About", "Events", "Contact"],
};

const ADMIN_CREDENTIALS_KEY = "juliette-alt-admin-credentials";
const WORK_OVERRIDES_KEY = "juliette-alt-work-overrides";
const WORK_ORDER_KEY = "juliette-alt-work-order";

const bytesToHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

const deriveAdminPassword = async (password: string, salt: Uint8Array) => {
  const material = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await window.crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 210_000 },
    material,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
};

const portfolioItems = [
  ["a56a50_c341faa20aff4da18e39a737ee5c406a~mv2.jpg", "Les fileuses de temps : l’accord", "Couverture · autoédition"],
  ["a56a50_128c96078e40477390479b1080a322c6~mv2.jpg", "La guide d’Outremonde", "Couverture · Héron d’Argent"],
  ["a56a50_9d95679ede23418ca7192ac9bccfaf0c~mv2.jpg", "Filles des sables", "Couverture · 2026"],
  ["a56a50_1fd6d536aaf54ea291cc92d4833244d2~mv2.jpg", "Un amour de démon", "Couverture · 2026"],
  ["a56a50_3e786bad12f94a42a6ad0ee20f425a5c~mv2.jpg", "Volva, fille de Freya", "Couverture · 2025"],
  ["a56a50_1dde9dd057e84c768803030d6f6b0804~mv2.jpg", "Le chant de la lionne et du dragon", "Couverture · 2025"],
  ["a56a50_9896ef4f25724264bffbea52effb2d09~mv2.jpg", "Eva", "Portrait · 2026"],
  ["a56a50_52ca4285a27e430681810802d47209c5~mv2.png", "Bathory", "Couverture · Octoquills"],
  ["a56a50_b56487b67a1a433cb8321de53ad705b8~mv2.jpg", "Lupus in Fabula", "Couverture · Chat Noir"],
  ["a56a50_e508b38408dd4fa5b291f9545d8cfc15~mv2.png", "Encyclopédie des rêves et des cauchemars", "Couverture · Héron d’Argent"],
  ["a56a50_c7bb9e5090b948e589692c36c8b31dac~mv2.webp", "Jane Eyre", "Livre de coloriage · Hachette Heroes"],
  ["a56a50_161ec6bfe17042039a02843eb448113c~mv2.jpg", "Eros / Thanatos Automaton", "Couverture · Chat Noir"],
  ["a56a50_123e84fbb5284ae292ad25d889ffc16f~mv2.png", "Apostasie", "Couverture · Chat Noir"],
  ["a56a50_4578dc7c536c47cfbbfda6e0fbc5db60~mv2.jpg", "Anatomy of the Halloween Pumpkin", "Travail personnel · 2023"],
  ["a56a50_ea8ac1c5f43949d5a9afa119e0363ee2~mv2.jpg", "American Wild Flowers", "Travail personnel · 2024"],
  ["a56a50_b3184f9b5a2242b2b3c013c268c0f46c~mv2.png", "Ange et démon", "Encyclopédie · Héron d’Argent"],
];

const previewIds = new Set(portfolioItems.map((work) => work[0]));
const additionalPortfolioItems = completePortfolioWorks
  .filter((work) => !previewIds.has(work[0]))
  .map((work) => [work[0], work[1], localizeWorkDescription(sourceDescriptionFor(work[0], false), false)]);

const festivalImages = [
  "a56a50_c05e7092910748c4a06a446bbfcc4458~mv2.jpg",
  "a56a50_e7e81af4e49a43f5a67b209823b616f2~mv2.jpg",
  "a56a50_df40c08a51154c9c92e2b45de45bc5a3~mv2.jpg",
];

export default function AlternativePage() {
  const [language, setLanguage] = useState<"fr" | "en">("fr");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminPanelView, setAdminPanelView] = useState<"text" | "add" | "delete">("text");
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminSetup, setAdminSetup] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminWorks, setAdminWorks] = useState<string[][]>([]);
  const [hiddenWorkIds, setHiddenWorkIds] = useState<string[]>([]);
  const [workOverrides, setWorkOverrides] = useState<Record<string, { title?: string; detailsFr?: string; detailsEn?: string }>>({});
  const [workOrder, setWorkOrder] = useState<string[]>([]);
  const [selectedAdminWork, setSelectedAdminWork] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroReady, setHeroReady] = useState(false);
  const [previousHeroIndex, setPreviousHeroIndex] = useState(0);
  const [hasHeroTransition, setHasHeroTransition] = useState(false);
  const [heroMotion, setHeroMotion] = useState(0);
  const [previousHeroMotion, setPreviousHeroMotion] = useState(0);
  const [activeSection, setActiveSection] = useState("alternative-top");
  const [selectedWork, setSelectedWork] = useState<string[] | null>(null);
  const [lightboxImageReady, setLightboxImageReady] = useState(false);
  const preloadedLightboxImages = useRef(new Set<string>());
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [portfolioVisibleCount, setPortfolioVisibleCount] = useState(0);
  const [portfolioPreparing, setPortfolioPreparing] = useState(false);
  const [portfolioLoadingProgress, setPortfolioLoadingProgress] = useState(0);
  const [portfolioAssetsReady, setPortfolioAssetsReady] = useState(false);
  const cursorVariant = 1;
  const trailVariant = 8;
  const clickVariant = 7;
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ pointerX: number; pointerY: number; imageX: number; imageY: number } | null>(null);
  const cursorCanvas = useRef<HTMLCanvasElement>(null);
  const heroIndexRef = useRef(0);
  const heroMotionRef = useRef(0);
  const orderedPortfolioItems = [...portfolioItems, ...additionalPortfolioItems, ...adminWorks].sort((a, b) => {
      const aIndex = workOrder.indexOf(a[0]); const bIndex = workOrder.indexOf(b[0]);
      return (aIndex < 0 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex < 0 ? Number.MAX_SAFE_INTEGER : bIndex);
    });
  const basePortfolioItems = portfolioOpen ? orderedPortfolioItems.slice(0, portfolioItems.length + portfolioVisibleCount) : orderedPortfolioItems.slice(0, portfolioItems.length);
  const visiblePortfolioItems = basePortfolioItems.filter((work) => !hiddenWorkIds.includes(work[0]));
  const en = language === "en";
  const localizedPortfolioItems = visiblePortfolioItems.map((work) => [
    work[0],
    workOverrides[work[0]]?.title || work[1],
    en ? (workOverrides[work[0]]?.detailsEn || (work[0].startsWith("data:") ? work[3] || work[2] : localizeWorkDescription(sourceDescriptionFor(work[0], true), true))) : (workOverrides[work[0]]?.detailsFr || (work[0].startsWith("data:") ? work[2] : localizeWorkDescription(sourceDescriptionFor(work[0], false), false))),
  ]);
  const currentHeroWork = completePortfolioWorks.find((work) => work[0] === heroImages[heroIndex]);
  const currentHeroDetails = currentHeroWork
    ? localizeWorkDescription(sourceDescriptionFor(currentHeroWork[0], language === "en"), language === "en")
    : language === "en" ? "Digital illustration" : "Illustration digitale";

  const changeLanguage = (next: "fr" | "en") => {
    setLanguage(next);
    document.documentElement.lang = next;
    window.localStorage.setItem("juliette-language", next);
  };

  const openAdminLogin = () => {
    const hasCredentials = Boolean(window.localStorage.getItem(ADMIN_CREDENTIALS_KEY));
    setAdminSetup(!hasCredentials);
    setAdminError("");
    setAdminLoginOpen(true);
  };

  const submitAdminLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setAdminError("");
    const data = new FormData(form);
    const password = String(data.get("password") || "");
    if (adminSetup) {
      const confirmation = String(data.get("confirmation") || "");
      if (password.length < 10) return setAdminError(en ? "Use at least 10 characters." : "Utilisez au moins 10 caractères.");
      if (password !== confirmation) return setAdminError(en ? "The passwords do not match." : "Les mots de passe ne correspondent pas.");
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const hash = await deriveAdminPassword(password, salt);
      window.localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify({ salt: bytesToHex(salt), hash }));
    } else {
      try {
        const credentials = JSON.parse(window.localStorage.getItem(ADMIN_CREDENTIALS_KEY) || "{}");
        const saltPairs = String(credentials.salt || "").match(/.{1,2}/g) || [];
        const salt = new Uint8Array(saltPairs.map((pair) => Number.parseInt(pair, 16)));
        const hash = await deriveAdminPassword(password, salt);
        if (!credentials.hash || hash !== credentials.hash) return setAdminError(en ? "Incorrect password." : "Mot de passe incorrect.");
      } catch {
        return setAdminError(en ? "The administrator access must be reset." : "L’accès administrateur doit être réinitialisé.");
      }
    }
    setAdminMode(true);
    setAdminPanelOpen(false);
    setAdminLoginOpen(false);
    form.reset();
  };

  const addPortfolioWork = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("image") as File;
    const title = String(data.get("title") || "").trim();
    if (!file?.size || !title) return;
    try {
      const source = await preparePortfolioImage(file);
      const next = [
        ...adminWorks,
        [source, title, String(data.get("detailsFr") || "Illustration digitale").trim(), String(data.get("detailsEn") || "Digital illustration").trim(), window.crypto.randomUUID()],
      ];
      window.localStorage.setItem("juliette-alt-admin-works", JSON.stringify(next));
      setAdminWorks(next);
      form.reset();
    } catch {
      window.alert(en ? "The image could not be saved. Try a smaller file." : "L’image n’a pas pu être enregistrée. Essayez un fichier moins lourd.");
    }
  };

  const deletePortfolioWork = () => {
    if (!selectedAdminWork) return;
    const work = [...portfolioItems, ...additionalPortfolioItems, ...adminWorks].find((item) => (item[4] || item[0]) === selectedAdminWork);
    const title = work?.[1] || (en ? "this artwork" : "cette œuvre");
    if (!window.confirm(en ? `Remove “${title}” from the portfolio?` : `Retirer « ${title} » du portfolio ?`)) return;
    if (!window.confirm(en ? "Second confirmation: this artwork will no longer be visible. Continue?" : "Deuxième confirmation : cette œuvre ne sera plus visible. Continuer ?")) return;
    if (work?.[0].startsWith("data:")) {
      const next = adminWorks.filter((item) => (item[4] || item[0]) !== selectedAdminWork);
      window.localStorage.setItem("juliette-alt-admin-works", JSON.stringify(next));
      setAdminWorks(next);
    } else {
      const next = Array.from(new Set([...hiddenWorkIds, work?.[0] || selectedAdminWork]));
      window.localStorage.setItem("juliette-alt-hidden-works", JSON.stringify(next));
      setHiddenWorkIds(next);
    }
    setSelectedAdminWork("");
  };

  useEffect(() => {
    const saved = window.localStorage.getItem("juliette-language");
    if (saved === "en" || saved === "fr") {
      setLanguage(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  useEffect(() => {
    const embeddedEditor = new URLSearchParams(window.location.search).get("edit") === "1";
    const activeSession = document.cookie.split(";").some((cookie) => cookie.trim() === "juliette-admin-session=active");
    if (embeddedEditor && activeSession) setAdminMode(true);
  }, []);

  useEffect(() => {
    try {
      const savedWorks = window.localStorage.getItem("juliette-alt-admin-works");
      const savedHidden = window.localStorage.getItem("juliette-alt-hidden-works");
      const savedOverrides = window.localStorage.getItem(WORK_OVERRIDES_KEY);
      const savedOrder = window.localStorage.getItem(WORK_ORDER_KEY);
      if (savedWorks) setAdminWorks(JSON.parse(savedWorks));
      if (savedHidden) setHiddenWorkIds(JSON.parse(savedHidden));
      if (savedOverrides) setWorkOverrides(JSON.parse(savedOverrides));
      if (savedOrder) setWorkOrder(JSON.parse(savedOrder));
    } catch {
      // A damaged local preference must never prevent the public portfolio from loading.
    }
  }, []);

  useEffect(() => {
    const selector = [
      ".alt-hero-copy .alt-kicker", ".alt-hero-copy h1", ".alt-hero-copy>p:last-child", ".alt-scroll span",
      ".alt-section-head p", ".alt-section-head h2", ".alt-gallery-expand-copy small", ".alt-gallery-expand-copy strong", ".alt-gallery-close",
      ".alt-about-portrait figcaption", ".alt-section-label", ".alt-about-copy h2", ".alt-about-lead", ".alt-bio-story p", ".alt-about-copy blockquote",
      ".alt-festival-rules h3", ".alt-festival-rules p", ".alt-festival-copy p", ".alt-text-link", ".alt-contact h2", ".alt-contact-intro", ".alt-contact-offer h3", ".alt-contact-offer p", ".alt-contact-action>small", ".alt-mail-button span",
    ].join(",");
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    const cleanups: Array<() => void> = [];
    elements.forEach((element, index) => {
      const key = `juliette-alt-text-${language}-${index}`;
      const saved = window.localStorage.getItem(key);
      if (saved !== null) element.innerHTML = saved;
      if (element.matches(".alt-section-head>p, .alt-section-label")) {
        const cleanLabel = (element.textContent || "").replace(/^\s*(?:✦\s*)?0?[1-6]\s*[·.\-–—:]?\s*/i, "").trim();
        if (cleanLabel && cleanLabel !== element.textContent?.trim()) {
          element.textContent = cleanLabel;
          window.localStorage.setItem(key, cleanLabel);
        }
      }
      if (!adminMode) return;
      element.contentEditable = "true";
      element.classList.add("alt-inline-editable");
      const keepEditing = (event: Event) => { event.preventDefault(); event.stopPropagation(); };
      const save = () => window.localStorage.setItem(key, element.innerHTML);
      element.addEventListener("click", keepEditing);
      element.addEventListener("blur", save);
      cleanups.push(() => {
        element.removeAttribute("contenteditable");
        element.classList.remove("alt-inline-editable");
        element.removeEventListener("click", keepEditing);
        element.removeEventListener("blur", save);
      });
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [adminMode, language, portfolioOpen]);

  const showAdjacentWork = (direction: -1 | 1) => {
    if (!selectedWork || localizedPortfolioItems.length < 2) return;
    const currentIndex = localizedPortfolioItems.findIndex((work) => work[0] === selectedWork[0]);
    const nextIndex = (currentIndex + direction + localizedPortfolioItems.length) % localizedPortfolioItems.length;
    setLightboxImageReady(false);
    setSelectedWork(localizedPortfolioItems[nextIndex]);
  };

  const preloadLightboxImage = (work: string[]) => {
    const source = portfolioImage(work[0], 1800, 2200);
    if (preloadedLightboxImages.current.has(source)) return;
    preloadedLightboxImages.current.add(source);
    const image = new Image();
    image.src = source;
  };

  const openLightbox = (work: string[]) => {
    setLightboxImageReady(false);
    setSelectedWork(work);
  };

  const revealPortfolio = () => {
    if (portfolioPreparing) return;
    if (portfolioAssetsReady) {
      setPortfolioVisibleCount(additionalPortfolioItems.length);
      setPortfolioOpen(true);
      return;
    }
    setPortfolioPreparing(true);
    setPortfolioLoadingProgress(0);
    window.setTimeout(() => setPortfolioLoadingProgress(28), 45);
    window.setTimeout(() => setPortfolioLoadingProgress(64), 125);
    window.setTimeout(() => setPortfolioLoadingProgress(88), 205);
    window.setTimeout(() => setPortfolioLoadingProgress(100), 275);
    window.setTimeout(() => {
      startTransition(() => {
        setPortfolioAssetsReady(true);
        setPortfolioVisibleCount(additionalPortfolioItems.length);
        setPortfolioOpen(true);
        setPortfolioPreparing(false);
      });
    }, 320);
  };

  useEffect(() => {
    if (heroImages.length === 0) return;
    const previous = Number.parseInt(window.sessionStorage.getItem("juliette-alt-last-hero") ?? "-1", 10);
    let initial = Math.floor(Math.random() * heroImages.length);
    if (heroImages.length > 1) {
      while (initial === previous) initial = Math.floor(Math.random() * heroImages.length);
    }
    const initialMotion = Math.floor(Math.random() * 5);
    setHeroIndex(initial);
    setPreviousHeroIndex(initial);
    setHeroMotion(initialMotion);
    setPreviousHeroMotion(initialMotion);
    heroIndexRef.current = initial;
    heroMotionRef.current = initialMotion;
    window.sessionStorage.setItem("juliette-alt-last-hero", String(initial));
    setHeroReady(true);
  }, []);

  useEffect(() => {
    let timer = 0;
    let remaining = 10400;
    let scheduledAt = performance.now();
    const chooseAnotherImage = () => {
      const current = heroIndexRef.current;
      if (heroImages.length < 2) return;
      let next = current;
      while (next === current) next = Math.floor(Math.random() * heroImages.length);
      setPreviousHeroIndex(current);
      setPreviousHeroMotion(heroMotionRef.current);
      setHasHeroTransition(true);
      setHeroIndex(next);
      heroIndexRef.current = next;
      const nextMotion = Math.floor(Math.random() * 5);
      setHeroMotion(nextMotion);
      heroMotionRef.current = nextMotion;
    };
    const scheduleNextImage = (delay = remaining) => {
      window.clearTimeout(timer);
      if (document.hidden) return;
      remaining = delay;
      scheduledAt = performance.now();
      timer = window.setTimeout(() => {
        if (document.hidden) return;
        chooseAnotherImage();
        remaining = 10400;
        scheduleNextImage(remaining);
      }, delay);
    };
    const handleVisibility = () => {
      window.clearTimeout(timer);
      if (document.hidden) {
        remaining = Math.max(120, remaining - (performance.now() - scheduledAt));
        return;
      }
      scheduleNextImage(remaining);
    };
    scheduleNextImage();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const canvas = cursorCanvas.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const points = Array.from({ length: 18 }, () => ({ x: 0, y: 0 }));
    const droplets: Array<{ x: number; y: number; vx: number; vy: number; life: number; size: number }> = [];
    let started = false;
    let inside = false;
    let overArtwork = false;
    let opacity = 0;
    let speed = 0;
    let lastX = 0;
    let lastY = 0;
    let lastMoveAt = performance.now();
    let frame = 0;
    let running = true;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    const cursorColours = ["216,184,90", "243,238,225", "156,160,74", "100,63,43", "204,174,83", "216,184,90", "145,139,65", "178,151,69", "216,184,90", "164,150,72"];
    const identity = getComputedStyle(document.querySelector(".alt-site")!);
    const cursorColour = identity.getPropertyValue("--trail-rgb").trim() || "174,165,145";
    const clickColour = identity.getPropertyValue("--click-rgb").trim() || "193,191,182";

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      canvas.width = Math.round(viewportWidth * ratio);
      canvas.height = Math.round(viewportHeight * ratio);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const requestDraw = () => {
      if (running && frame === 0) frame = window.requestAnimationFrame(draw);
    };
    const move = (event: PointerEvent) => {
      const now = performance.now();
      if (!started) {
        points.forEach((point) => { point.x = event.clientX; point.y = event.clientY; });
        lastX = event.clientX;
        lastY = event.clientY;
        started = true;
      }
      const distance = Math.hypot(event.clientX - lastX, event.clientY - lastY);
      const elapsed = Math.max(8, now - lastMoveAt);
      const instantaneousSpeed = Math.min(1, distance / elapsed / 1.25);
      speed += (instantaneousSpeed - speed) * .48;
      points[0].x = event.clientX;
      points[0].y = event.clientY;
      lastX = event.clientX;
      lastY = event.clientY;
      lastMoveAt = now;
      const target = event.target instanceof Element ? event.target : null;
      overArtwork = Boolean(target?.closest(".alt-work, .alt-lightbox-stage"));
      inside = true;
      requestDraw();
    };
    const press = (event: PointerEvent) => {
      if (!inside || event.button !== 0) return;
      for (let index = 0; index < 7; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const force = 1.1 + Math.random() * 2.4;
        droplets.push({
          x: event.clientX,
          y: event.clientY,
          vx: Math.cos(angle) * force,
          vy: Math.sin(angle) * force,
          life: 1,
          size: .8 + Math.random() * 1.6,
        });
      }
      requestDraw();
    };
    const leave = () => { inside = false; requestDraw(); };
    const draw = () => {
      opacity += ((inside && started ? 1 : 0) - opacity) * .16;
      speed *= .94;
      for (let index = 1; index < points.length; index += 1) {
        points[index].x += (points[index - 1].x - points[index].x) * .42;
        points[index].y += (points[index - 1].y - points[index].y) * .42;
      }
      context.clearRect(0, 0, viewportWidth, viewportHeight);
      context.lineCap = "round";
      context.lineJoin = "round";
      const trailMotion = Math.min(1, speed * 7);
      if (trailVariant === 8 && trailMotion > .012) {
        const lastPoint = points.length - 1;
        const drawSmoothTrail = (offsetX: number, offsetY: number, colour: string, width: number, alpha: number) => {
          const gradient = context.createLinearGradient(points[lastPoint].x, points[lastPoint].y, points[0].x, points[0].y);
          gradient.addColorStop(0, `rgba(${colour},0)`);
          gradient.addColorStop(.35, `rgba(${colour},${alpha * .18})`);
          gradient.addColorStop(1, `rgba(${colour},${alpha})`);
          context.beginPath();
          context.moveTo(points[lastPoint].x + offsetX, points[lastPoint].y + offsetY);
          for (let index = lastPoint - 1; index > 0; index -= 1) {
            const middleX = (points[index].x + points[index - 1].x) / 2 + offsetX;
            const middleY = (points[index].y + points[index - 1].y) / 2 + offsetY;
            context.quadraticCurveTo(points[index].x + offsetX, points[index].y + offsetY, middleX, middleY);
          }
          context.lineTo(points[0].x + offsetX, points[0].y + offsetY);
          context.strokeStyle = gradient;
          context.lineWidth = width;
          context.stroke();
        };
        drawSmoothTrail(0, 0, cursorColour, 1.35, opacity * trailMotion * .82);
        drawSmoothTrail(3, 2, "239,235,225", .58, opacity * trailMotion * .46);
      }
      for (let index = points.length - 1; index > 0; index -= 1) {
        if (trailVariant === 8) continue;
        const strength = (1 - index / points.length) * opacity * trailMotion;
        if (trailVariant === 4) {
          if (index % 4 !== 0) continue;
          context.beginPath();
          context.arc(points[index].x, points[index].y, 2.5 + strength * 4.5, 0, Math.PI * 2);
          context.strokeStyle = `rgba(${cursorColour},${strength * .34})`;
          context.lineWidth = .65;
          context.stroke();
          continue;
        }
        if (trailVariant === 9) {
          context.save();
          context.beginPath();
          context.moveTo(points[index].x, points[index].y);
          context.lineTo(points[index - 1].x, points[index - 1].y);
          context.strokeStyle = `rgba(${cursorColour},${strength * .22})`;
          context.lineWidth = 3.5 + strength * 4;
          context.shadowColor = `rgba(${cursorColour},${strength * .6})`;
          context.shadowBlur = 9;
          context.stroke();
          context.restore();
          continue;
        }
        if (trailVariant === 2 || trailVariant === 7) {
          if (index % (trailVariant === 2 ? 3 : 2) !== 0) continue;
          context.fillStyle = `rgba(${cursorColour},${strength * .65})`;
          if (trailVariant === 2) {
            context.beginPath();
            context.arc(points[index].x, points[index].y, .6 + strength, 0, Math.PI * 2);
            context.fill();
          } else {
            context.fillRect(points[index].x - 1, points[index].y - 1, 2 + strength, 2 + strength);
          }
          continue;
        }
        context.beginPath();
        context.moveTo(points[index].x, points[index].y);
        context.lineTo(points[index - 1].x, points[index - 1].y);
        context.strokeStyle = `rgba(${cursorColour},${strength * (.3 + speed * .48)})`;
        context.lineWidth = trailVariant === 3 ? 1.4 + strength * 3.2 : .45 + strength * (trailVariant === 8 ? 1.8 : 1.2 + speed * 1.5);
        context.stroke();
        if (trailVariant === 8) {
          context.beginPath();
          context.moveTo(points[index].x + 3, points[index].y + 2);
          context.lineTo(points[index - 1].x + 3, points[index - 1].y + 2);
          context.strokeStyle = `rgba(239,235,225,${strength * .3})`;
          context.lineWidth = .6;
          context.stroke();
        }
        if (trailVariant === 6 && index % 4 === 0) {
          context.save();
          context.translate(points[index].x, points[index].y);
          context.rotate(index * .28);
          context.fillStyle = `rgba(${cursorColour},${strength * .5})`;
          for (let petal = 0; petal < 4; petal += 1) {
            context.rotate(Math.PI / 2);
            context.beginPath();
            context.ellipse(0, -2.4, 1.15, 2.4, 0, 0, Math.PI * 2);
            context.fill();
          }
          context.fillStyle = `rgba(174,165,145,${strength * .65})`;
          context.beginPath(); context.arc(0, 0, .8, 0, Math.PI * 2); context.fill();
          context.restore();
        }
      }
      for (let index = droplets.length - 1; index >= 0; index -= 1) {
        const droplet = droplets[index];
        droplet.x += droplet.vx;
        droplet.y += droplet.vy;
        droplet.vx *= .91;
        droplet.vy = droplet.vy * .91 + .025;
        droplet.life -= .045;
        if (droplet.life <= 0) {
          droplets.splice(index, 1);
          continue;
        }
        context.strokeStyle = `rgba(${clickColour},${droplet.life * .64})`;
        context.fillStyle = `rgba(${clickColour},${droplet.life * .58})`;
        context.lineWidth = .8;
        context.beginPath();
        if (clickVariant === 4 || clickVariant === 9) {
          context.arc(droplet.x, droplet.y, (1 - droplet.life) * (clickVariant === 9 ? 24 : 16) + 2, 0, Math.PI * 2);
          context.stroke();
        } else if (clickVariant === 1) {
          const size = 2 + droplet.size * droplet.life * 1.8;
          context.save(); context.translate(droplet.x, droplet.y); context.rotate(Math.PI / 4);
          context.strokeRect(-size / 2, -size / 2, size, size);
          context.restore();
        } else if (clickVariant === 5) {
          const ray = droplet.size * 2.4 * droplet.life;
          context.moveTo(droplet.x - ray, droplet.y); context.lineTo(droplet.x + ray, droplet.y);
          context.moveTo(droplet.x, droplet.y - ray); context.lineTo(droplet.x, droplet.y + ray);
          context.stroke();
        } else if (clickVariant === 3) {
          context.moveTo(droplet.x - droplet.size * 2, droplet.y + droplet.size);
          context.lineTo(droplet.x + droplet.size * 2, droplet.y - droplet.size);
          context.stroke();
        } else if (clickVariant === 6) {
          context.save(); context.translate(droplet.x, droplet.y);
          for (let petal = 0; petal < 4; petal += 1) { context.rotate(Math.PI / 2); context.beginPath(); context.ellipse(0, -droplet.size * 1.5, droplet.size * .7, droplet.size * 1.5, 0, 0, Math.PI * 2); context.fill(); }
          context.restore();
        } else if (clickVariant === 8) {
          const size = 2 + droplet.size * droplet.life * 2.2;
          context.beginPath();
          context.moveTo(droplet.x, droplet.y - size);
          context.lineTo(droplet.x + size * .7, droplet.y + size * .65);
          context.lineTo(droplet.x - size * .7, droplet.y + size * .65);
          context.closePath();
          context.fill();
        } else if (clickVariant === 2 || clickVariant === 7) {
          const size = droplet.size * droplet.life * 1.5;
          context.fillRect(droplet.x - size / 2, droplet.y - size / 2, size, size);
        } else {
          context.arc(droplet.x, droplet.y, droplet.size * droplet.life, 0, Math.PI * 2);
          context.fill();
        }
      }
      if (started) {
        context.save();
        context.translate(points[0].x, points[0].y);
        context.rotate(.72 + speed * .12);
        context.scale(1.52, 1.52);
        context.globalAlpha = opacity;
        if (cursorVariant === 0) {
        const stylusBody = context.createLinearGradient(-3.4, 0, 3.4, 0);
        stylusBody.addColorStop(0, "rgba(34,35,32,.98)");
        stylusBody.addColorStop(.48, "rgba(34,35,32,.98)");
        stylusBody.addColorStop(1, "rgba(34,35,32,.98)");
        context.beginPath();
        context.moveTo(-2.25, -7);
        context.lineTo(-3.35, -34);
        context.quadraticCurveTo(-3.35, -38, 0, -38.5);
        context.quadraticCurveTo(3.35, -38, 3.35, -34);
        context.lineTo(2.25, -7);
        context.closePath();
        context.fillStyle = stylusBody;
        context.fill();
        context.strokeStyle = "rgba(239,235,225,.58)";
        context.lineWidth = .65;
        context.stroke();
        context.beginPath();
        context.moveTo(-2.25, -7);
        context.lineTo(-1.05, -2.2);
        context.lineTo(0, 1.4);
        context.lineTo(1.05, -2.2);
        context.lineTo(2.25, -7);
        context.closePath();
        context.fillStyle = "rgba(34,35,32,.98)";
        context.fill();
        context.beginPath();
        context.moveTo(-2.5, -9.5);
        context.lineTo(2.5, -9.5);
        context.strokeStyle = "rgba(174,165,145,.9)";
        context.lineWidth = 1;
        context.stroke();
        context.fillStyle = "rgba(174,165,145,.9)";
        context.beginPath();
        context.roundRect(2.75, -27, 1.45, 7.5, .7);
        context.fill();
        context.beginPath();
        context.arc(0, -35.2, .8, 0, Math.PI * 2);
        context.fillStyle = "rgba(174,165,145,.7)";
        context.fill();
        } else if (cursorVariant === 1) {
          context.beginPath();
          context.moveTo(0, 1); context.lineTo(-4, -13); context.lineTo(0, -19); context.lineTo(4, -13); context.closePath();
          context.fillStyle = "rgba(34,35,32,.96)"; context.fill();
          context.strokeStyle = "rgba(239,235,225,.9)"; context.lineWidth = .8; context.stroke();
          context.beginPath(); context.moveTo(0, -17); context.lineTo(0, -3); context.stroke();
        } else if (cursorVariant === 2) {
          context.fillStyle = "rgba(174,165,145,.96)"; context.fillRect(-3, -25, 6, 22);
          context.fillStyle = "rgba(34,35,32,.96)"; context.beginPath(); context.moveTo(-3, -3); context.lineTo(0, 2); context.lineTo(3, -3); context.fill();
          context.fillStyle = "rgba(34,35,32,.9)"; context.fillRect(-3, -28, 6, 3);
        } else if (cursorVariant === 3) {
          context.strokeStyle = "rgba(174,165,145,.9)"; context.lineWidth = 5; context.beginPath(); context.moveTo(0, -27); context.lineTo(0, -7); context.stroke();
          context.fillStyle = "rgba(34,35,32,.94)"; context.beginPath(); context.moveTo(-4, -7); context.quadraticCurveTo(0, 2, 4, -7); context.fill();
        } else if (cursorVariant === 4) {
          context.rotate(-.72);
          context.strokeStyle = "rgba(174,165,145,.9)"; context.lineWidth = .8;
          context.beginPath(); context.arc(0, 0, 8, 0, Math.PI * 2); context.stroke();
          context.beginPath(); context.moveTo(-12, 0); context.lineTo(-4, 0); context.moveTo(4, 0); context.lineTo(12, 0); context.moveTo(0, -12); context.lineTo(0, -4); context.moveTo(0, 4); context.lineTo(0, 12); context.stroke();
        } else if (cursorVariant === 5) {
          context.rotate(-.72);
          context.strokeStyle = "rgba(174,165,145,.95)"; context.lineWidth = 1;
          context.beginPath(); context.moveTo(-8, 0); context.lineTo(8, 0); context.moveTo(0, -8); context.lineTo(0, 8); context.moveTo(-4, -4); context.lineTo(4, 4); context.moveTo(4, -4); context.lineTo(-4, 4); context.stroke();
          context.fillStyle = "rgba(239,235,225,.95)"; context.beginPath(); context.arc(0, 0, 1.8, 0, Math.PI * 2); context.fill();
        } else if (cursorVariant === 6) {
          context.strokeStyle = "rgba(174,165,145,.92)"; context.lineWidth = 1.1;
          context.beginPath(); context.moveTo(0, 1); context.bezierCurveTo(-7, -9, 7, -16, 0, -27); context.stroke();
          context.fillStyle = "rgba(174,165,145,.72)";
          context.beginPath(); context.ellipse(-3.4, -9, 4, 1.8, -.5, 0, Math.PI * 2); context.ellipse(3.5, -17, 4, 1.8, .5, 0, Math.PI * 2); context.fill();
        } else if (cursorVariant === 7) {
          context.rotate(-.72); context.strokeStyle = "rgba(174,165,145,.96)"; context.lineWidth = 1.4;
          context.beginPath(); context.moveTo(-8, -3); context.lineTo(-8, -8); context.lineTo(-3, -8); context.moveTo(3, -8); context.lineTo(8, -8); context.lineTo(8, -3); context.moveTo(8, 3); context.lineTo(8, 8); context.lineTo(3, 8); context.moveTo(-3, 8); context.lineTo(-8, 8); context.lineTo(-8, 3); context.stroke();
          context.fillStyle = "rgba(174,165,145,.9)"; context.fillRect(-1, -1, 2, 2);
        } else if (cursorVariant === 8) {
          context.rotate(-.72); context.strokeStyle = "rgba(174,165,145,.9)"; context.lineWidth = .9;
          context.beginPath(); context.arc(0, 0, 7, 0, Math.PI * 2); context.stroke();
          context.beginPath(); context.arc(0, 0, 2, 0, Math.PI * 2); context.fillStyle = "rgba(174,165,145,.92)"; context.fill();
          context.beginPath(); context.moveTo(-11, 7); context.lineTo(11, -7); context.stroke();
        } else {
          context.rotate(-.72); context.fillStyle = "rgba(174,165,145,.95)"; context.beginPath(); context.arc(0, 0, 3, 0, Math.PI * 2); context.fill();
          context.strokeStyle = "rgba(174,165,145,.7)"; context.lineWidth = .8; context.beginPath(); context.arc(0, 0, 9 + speed * 5, 0, Math.PI * 2); context.stroke();
        }
        if (overArtwork) {
          context.beginPath();
          context.moveTo(9, -3);
          context.lineTo(15, -3);
          context.moveTo(12, -6);
          context.lineTo(12, 0);
          context.strokeStyle = "rgba(239,235,225,.92)";
          context.lineWidth = .9;
          context.stroke();
        }
        context.restore();
      }
      const targetOpacity = inside && started ? 1 : 0;
      const pointsMoving = points.some((point, index) => index > 0 && Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y) > .08);
      const stillAnimating = Math.abs(opacity - targetOpacity) > .004 || speed > .002 || droplets.length > 0 || pointsMoving;
      frame = running && stillAnimating ? window.requestAnimationFrame(draw) : 0;
    };
    const handleVisibility = () => {
      if (document.hidden) {
        running = false;
        inside = false;
        speed = 0;
        droplets.length = 0;
        window.cancelAnimationFrame(frame);
        frame = 0;
        context.clearRect(0, 0, viewportWidth, viewportHeight);
        return;
      }
      if (running) return;
      running = true;
      started = false;
      opacity = 0;
      lastMoveAt = performance.now();
    };
    resize();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", press);
    window.addEventListener("resize", resize);
    document.documentElement.addEventListener("mouseleave", leave);
    document.addEventListener("visibilitychange", handleVisibility);
    frame = window.requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("resize", resize);
      document.documentElement.removeEventListener("mouseleave", leave);
      document.removeEventListener("visibilitychange", handleVisibility);
      running = false;
      window.cancelAnimationFrame(frame);
    };
  }, [cursorVariant, trailVariant, clickVariant]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-revealed", entry.isIntersecting);
      });
    }, { rootMargin: "-42% 0px -48% 0px" });

    let scrollFrame = 0;
    const updateActiveSection = () => {
      if (window.scrollY <= 24) {
        setActiveSection("alternative-top");
        return;
      }

      const marker = window.innerHeight * .47;
      let currentSection = sections[0][1];
      sections.forEach(([, id]) => {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= marker) currentSection = id;
      });
      setActiveSection(currentSection);
    };
    const handleScroll = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        updateActiveSection();
      });
    };

    sections.forEach(([, id]) => {
      const section = document.getElementById(id);
      if (section) {
        section.classList.add("is-observed");
        observer.observe(section);
      }
    });
    updateActiveSection();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    };
  }, []);

  useEffect(() => {
    if (!portfolioOpen) {
      setPortfolioVisibleCount(0);
    }
  }, [portfolioOpen]);

  useEffect(() => {
    const grid = document.querySelector<HTMLElement>(".alt-work-grid");
    if (!grid) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-card-visible", entry.isIntersecting));
    }, { rootMargin: "-4% 0px -8% 0px", threshold: .12 });
    const observeCard = (card: HTMLElement) => {
      const bounds = card.getBoundingClientRect();
      card.classList.add("card-observed");
      card.classList.toggle("is-card-visible", bounds.top < window.innerHeight * .92 && bounds.bottom > window.innerHeight * .04);
      observer.observe(card);
    };
    grid.querySelectorAll<HTMLElement>(".alt-work").forEach(observeCard);
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(".alt-work")) observeCard(node);
          node.querySelectorAll<HTMLElement>(".alt-work").forEach(observeCard);
        });
        record.removedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(".alt-work")) observer.unobserve(node);
          node.querySelectorAll<HTMLElement>(".alt-work").forEach((card) => observer.unobserve(card));
        });
      });
    });
    mutations.observe(grid, { childList: true });
    return () => { mutations.disconnect(); observer.disconnect(); };
  }, []);

  useEffect(() => {
    if (!selectedWork) return;
    setLightboxImageReady(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    dragStart.current = null;
    const currentIndex = localizedPortfolioItems.findIndex((work) => work[0] === selectedWork[0]);
    if (currentIndex >= 0 && localizedPortfolioItems.length > 1) {
      [-1, 1].forEach((offset) => {
        const adjacentIndex = (currentIndex + offset + localizedPortfolioItems.length) % localizedPortfolioItems.length;
        const preload = new Image();
        preload.src = portfolioImage(localizedPortfolioItems[adjacentIndex][0], 1800, 2200);
      });
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedWork(null);
      if (event.key === "ArrowLeft") showAdjacentWork(-1);
      if (event.key === "ArrowRight") showAdjacentWork(1);
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedWork, portfolioOpen, portfolioVisibleCount]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeMenu = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeMenu);
    return () => window.removeEventListener("keydown", closeMenu);
  }, [mobileMenuOpen]);

  return (
    <main
      className="alt-site"
      id="alternative-top"
      onContextMenu={(event) => {
        if ((event.target as HTMLElement).closest("img, .alt-work, .alt-background")) event.preventDefault();
      }}
      onDragStart={(event) => {
        if ((event.target as HTMLElement).closest("img")) event.preventDefault();
      }}
    >
      <a className="site-skip-link" href="#alternative-portfolio">{en ? "Skip to content" : "Aller au contenu"}</a>
      <canvas className="alt-cursor-canvas" ref={cursorCanvas} aria-hidden="true" />
      <div className={`alt-background${heroReady ? " ready" : ""}`} aria-hidden="true">
        {hasHeroTransition && <img key={`cover-previous-${previousHeroIndex}-${heroIndex}`} className={`cover previous motion-${previousHeroMotion}`} src={wixImage(heroImages[previousHeroIndex], 1400, 1000)} alt="" />}
        <img key={`cover-${heroImages[heroIndex]}`} className={`cover active motion-${heroMotion}`} src={wixImage(heroImages[heroIndex], 1400, 1000)} alt="" />
        <div className="alt-background-shade" />
      </div>

      {!selectedWork && <header className="alt-topbar">
        <a className="alt-topbar-brand" href="#alternative-top" aria-label={en ? "Back to the top" : "Retour en haut"}>
          <i className="alt-topbar-gear" aria-hidden="true" /><strong>Juliette Amadis</strong>
        </a>
        <button className="alt-mobile-menu-toggle" type="button" aria-expanded={mobileMenuOpen} aria-controls="alt-main-navigation" onClick={() => setMobileMenuOpen((open) => !open)}>
          <span aria-hidden="true"><i /><i /><i /></span><strong>Menu</strong>
        </button>
        <nav id="alt-main-navigation" className={mobileMenuOpen ? "is-open" : ""} aria-label={en ? "Main navigation" : "Navigation principale"}>
          {sections.map(([, id], index) => (
            <a key={id} className={activeSection === id ? "active" : ""} href={`#${id}`} aria-current={activeSection === id ? "location" : undefined} onClick={() => setMobileMenuOpen(false)}>
              <strong>{navigationLabels[language][index]}</strong>
            </a>
          ))}
          <a href="/boutique" onClick={() => setMobileMenuOpen(false)}><strong>{en ? "Shop" : "Boutique"}</strong></a>
        </nav>
        <div className="alt-topbar-tools">
          <div className="alt-topbar-languages" aria-label={en ? "Choose language" : "Choisir la langue"}>
            <button className={!en ? "active" : ""} type="button" onClick={() => changeLanguage("fr")} aria-label="Afficher le site en français" title="Français"><span className="flag flag-fr" /></button>
            <button className={en ? "active" : ""} type="button" onClick={() => changeLanguage("en")} aria-label="Display the website in English" title="English"><span className="flag flag-us" /></button>
          </div>
          <a className="alt-topbar-admin" href="/administration" aria-label={en ? "Open administrator area" : "Ouvrir l’espace administrateur"}><span className="alt-lock-icon" aria-hidden="true" /></a>
        </div>
      </header>}

      <section className="alt-hero">
        <img className="alt-logo" src="/juliette-amadis-logo.webp" alt="Juliette Amadis, artiste illustratrice" />
        <div className="alt-hero-copy">
          <p className="alt-kicker">Fantasy · Art nouveau · Western · Steampunk</p>
          <h1>{en ? <>Giving a face<br />to <em>imagination.</em></> : <>Donner un visage<br />à <em>l’imaginaire.</em></>}</h1>
          <p>{en ? "Sensitive illustrations, free-spirited heroines and worlds steeped in legend." : "Illustrations sensibles, héroïnes libres et mondes traversés de légendes."}</p>
        </div>
        <a className="alt-scroll" href="#alternative-portfolio">
          <span>{en ? "Discover" : "Découvrir"}</span><i>↓</i>
        </a>
        <div className="alt-slide-count"><span>0{heroIndex + 1}</span><i /><small>0{heroImages.length}</small></div>
        {currentHeroWork && <aside className="alt-hero-work" key={currentHeroWork[0]} aria-live="polite">
          <small>Œuvre en arrière-plan</small>
          <strong aria-label={currentHeroWork[1]}>{animatedLetters(currentHeroWork[1])}</strong>
          <span aria-label={currentHeroDetails}>{animatedLetters(currentHeroDetails)}</span>
        </aside>}
      </section>

      <section className="alt-portfolio alt-panel" id="alternative-portfolio">
        <div className="alt-section-head">
          <p>{en ? "Selected portfolio" : "Portfolio sélectionné"}</p>
          <h2>{en ? <>A few worlds<br /><em>to explore.</em></> : <>Quelques mondes<br /><em>à parcourir.</em></>}</h2>
        </div>
        <div className={`alt-work-grid${portfolioOpen ? " expanded" : ""}`}>
          {localizedPortfolioItems.map((work, index) => (
            <button className={`alt-work alt-work-${index + 1}`} key={work[0]} onContextMenu={(event) => event.preventDefault()} onPointerEnter={() => preloadLightboxImage(work)} onFocus={() => preloadLightboxImage(work)} onClick={() => openLightbox(work)}>
              <span className="alt-work-image"><img loading="lazy" draggable={false} onContextMenu={(event) => event.preventDefault()} src={portfolioImage(work[0], 720, 960)} alt={work[1]} /></span>
              <span className="alt-work-meta"><strong>{work[1]}</strong><i>{work[2]}</i></span>
            </button>
          ))}
        </div>
        {portfolioPreparing && <div className="alt-gallery-loading" role="status" aria-live="polite"><i /><span>{en ? "Loading artworks" : "Chargement des œuvres"}</span><b>{portfolioLoadingProgress}%</b><em><u style={{ width: `${portfolioLoadingProgress}%` }} /></em></div>}
        {!portfolioOpen && <button className="alt-gallery-expand" type="button" aria-expanded="false" disabled={portfolioPreparing} onClick={revealPortfolio}>
          <span className="alt-gallery-expand-copy"><small>{en ? "The complete collection" : "La collection complète"}</small><strong>{portfolioPreparing ? (en ? "Preparing the gallery…" : "Préparation de la galerie…") : (en ? "Discover more artworks" : "Découvrir davantage d’œuvres")}</strong></span>
          <span className="alt-gallery-expand-count"><b>{portfolioPreparing ? `${portfolioLoadingProgress}%` : `+${additionalPortfolioItems.length}`}</b><i>{portfolioPreparing ? "·" : "↓"}</i></span>
        </button>}
        {portfolioOpen && <button className="alt-gallery-close" type="button" aria-expanded="true" onClick={() => setPortfolioOpen(false)}>{en ? "Collapse gallery" : "Réduire la galerie"} <span>↑</span></button>}
        <aside className="alt-shop-bridge" aria-label={en ? "Online shop" : "Boutique en ligne"}>
          <div><small>{en ? "Studio editions" : "Éditions de l’atelier"}</small><strong>{en ? "Take a piece of these worlds home." : "Emporter un fragment de ces univers."}</strong></div>
          <a href="/boutique">{en ? "Explore the shop" : "Découvrir la boutique"} <span>↗</span></a>
        </aside>
      </section>

      <section className="alt-about alt-panel" id="alternative-about">
        <div className="alt-about-portraits">
          <figure className="alt-about-portrait alt-about-portrait-first"><img loading="lazy" src="https://static.wixstatic.com/media/a56a50_fdb0a041c1264414b33cdf305f3a2443~mv2.jpg/v1/fit/w_1000,h_1350,q_90/file.webp" alt={en ? "Juliette Amadis at an event" : "Juliette Amadis en festival"} /><figcaption>{en ? "Events · encounters" : "Festivals · rencontres"}</figcaption></figure>
          <figure className="alt-about-portrait alt-about-portrait-second"><img loading="lazy" src="https://static.wixstatic.com/media/a56a50_17639bb273d34a91a0d9c200e220e228~mv2.jpg/v1/fill/w_800,h_1100,al_c,q_90/file.webp" alt={en ? "Juliette Amadis, illustrator" : "Juliette Amadis, illustratrice"} /><figcaption>{en ? <>Freelance illustrator<br />Orchies · France</> : <>Illustratrice freelance<br />Orchies · France</>}</figcaption></figure>
        </div>
        <div className="alt-about-copy">
          <p className="alt-section-label">{en ? "About" : "À propos"}</p>
          <h2>{en ? <>Creating worlds,<br /><em>for as long as I remember.</em></> : <>Créer des mondes,<br /><em>depuis toujours.</em></>}</h2>
          <p className="alt-about-lead">{en ? "An illustrator in her thirties, I have drawn for as long as I can remember and have worked professionally as a freelance illustrator since July 2019." : "Illustratrice trentenaire, je dessine depuis toujours et exerce professionnellement en freelance dans le milieu de l’illustration depuis juillet 2019."}</p>
          <div className="alt-bio-story">
            <p>{en ? "After a year at the Tournai Academy of Fine Arts, I stepped away from art to attend business school in Lille. Following my degree, travels and experiences abroad, a serious illness forced me to put my studies on hold for more than a year." : "Après avoir étudié un an aux Beaux-Arts de Tournai à la suite de mon bac en 2008, j’ai quitté le milieu artistique pendant quelque temps pour intégrer une école de commerce à Lille. Après ma licence, de nombreux voyages et plusieurs expériences à l’étranger, j’ai dû interrompre mes études pendant plus d’un an à cause d’une grave maladie."}</p>
            <p>{en ? "I emerged stronger from that difficult experience and later worked for Eurostar for several years. In January 2019, the desire to return to my roots came back more powerfully than ever. The unexpected success of my first events convinced me to leave salaried work and devote myself fully to illustration." : "Je suis ressortie plus forte de cette expérience difficile, avant de travailler plusieurs années pour l’entreprise internationale Eurostar. En janvier 2019, le désir d’un retour aux sources est réapparu, plus fort que jamais. Le succès inattendu de mes premières participations à des événements m’a décidée à quitter mon emploi salarié pour vivre pleinement de l’illustration."}</p>
          </div>
          <blockquote><small>{en ? "A conviction" : "Une conviction"}</small>{en ? "“It is never too late to do what you love and live your passion.”" : "« Il n’y a pas d’âge pour faire ce que l’on aime et vivre de sa passion. »"}</blockquote>
          <div className="alt-bio-story alt-bio-story-lower">
            <p>{en ? "I collaborate with companies, private clients and publishing houses, including Éditions du Chat Noir and Éditions du Héron d’Argent. These projects push me beyond my comfort zone, which I believe is essential to creativity." : "Je collabore avec des entreprises, des particuliers et des maisons d’édition, parmi lesquelles les Éditions du Chat Noir et les Éditions du Héron d’Argent. Ces projets me permettent de sortir de ma zone de confort, ce qui est essentiel à mes yeux pour nourrir la créativité."}</p>
            <p>{en ? "Deeply influenced by fantasy, I have a particular fondness for female portraits. I am also fascinated by the Wild West, Victorian London, steampunk, books, films and popular culture." : "Fortement influencée par le fantastique et la fantasy, j’ai un penchant marqué pour les portraits féminins. Je suis aussi passionnée par la conquête de l’Ouest, l’époque victorienne londonienne, le steampunk, les séries, les livres et les films de la culture populaire."}</p>
            <p>{en ? "I work mainly in Photoshop on a Wacom MobileStudio Pro. My digital process remains close to traditional drawing: every image is built from scratch, from the first sketch to the final rendering. I also return regularly to charcoal and pencil." : "Je travaille principalement en dessin digital sur Photoshop avec une tablette graphique Wacom MobileStudio Pro. Mon approche reste celle du dessin traditionnel : chaque image est construite de A à Z, du brouillon au rendu final, sans raccourci. Je reviens également au fusain et au crayon à papier."}</p>
            <p>{en ? "Today I create from my studio in Orchies, near Lille, and remain constantly open to new projects. I am also working on an illustrated art book devoted to the women of the Wild West." : "Aujourd’hui, je crée depuis mon atelier à Orchies, près de la métropole lilloise, et reste constamment à la recherche de nouveaux projets. Je travaille notamment à un art-book illustré consacré aux femmes de l’Ouest sauvage."}</p>
          </div>
        </div>
      </section>

      <section className="alt-festivals alt-panel" id="alternative-festivals">
        <div className="alt-section-head alt-section-head-light">
          <p>{en ? "Events & conventions" : "Festivals & conventions"}</p>
          <h2>{en ? <>Invite Juliette<br /><em>to your event.</em></> : <>Inviter Juliette<br /><em>à votre événement.</em></>}</h2>
        </div>
        <div className="alt-festival-rules">
          <article><h3>{en ? "Travel area" : "Zone de déplacement"}</h3><p>{en ? "I mainly travel across Nord–Pas-de-Calais, southern Belgium and Luxembourg. For events outside these areas, travel and accommodation costs are covered by the organiser." : "Je suis mobile principalement dans le Nord–Pas-de-Calais, le sud de la Belgique et le Luxembourg. Pour les événements situés hors des Hauts-de-France ou du sud de la Belgique, les frais de déplacement et d’hébergement sont à la charge de l’organisateur."}</p></article>
          <article><h3>{en ? "Accepted themes" : "Univers acceptés"}</h3><p>{en ? "Fantasy, wonder, steampunk, fairy tales, gothic, comics, literature, vintage, creator markets and book fairs. I no longer attend events focused on Asia, cosplay, pop culture or video games." : "Fantastique, merveilleux, steampunk, féeries, gothique, bande dessinée, lecture, vintage, marchés de créateurs et salons du livre. Je ne participe plus aux événements centrés sur l’Asie, le cosplay, la pop culture ou le jeu vidéo."}</p></article>
          <article><h3>{en ? "The stand" : "Le stand"}</h3><p>{en ? "My richly decorated stand requires at least three linear metres and two display grids. It features illustrations and derivative creations including magnets, bookmarks, tote bags, key rings and pins." : "Mon stand est décoré au maximum et nécessite au minimum trois mètres linéaires ainsi que deux grilles. J’y présente de nombreuses illustrations et des créations dérivées : magnets, marque-pages, tote bags, porte-clés et pin’s."}</p></article>
          <article><h3>{en ? "Indoor events" : "En intérieur"}</h3><p>{en ? "I only attend events held in properly enclosed and insulated indoor venues, not in cabins or tents." : "Je participe uniquement aux événements organisés dans de véritables salles fermées et bien isolées, et non dans des chalets ou sous des tentes."}</p></article>
        </div>
        <div className="alt-festival-layout">
          <div className="alt-festival-copy">
            <p>{en ? "A richly decorated stand, designed as a small window into her many worlds." : "Un stand richement décoré, pensé comme une petite fenêtre ouverte sur ses univers."}</p>
            <a className="alt-text-link" href="mailto:juliette.amadis@gmail.com">{en ? "Suggest an event" : "Proposer un événement"} <span>↗</span></a>
          </div>
          <div className="alt-festival-images">
            {festivalImages.map((image, index) => <img key={image} loading="lazy" src={wixImage(image, 1200, 900)} alt={en ? `Juliette Amadis's stand, view ${index + 1}` : `Stand de Juliette Amadis, vue ${index + 1}`} />)}
          </div>
        </div>
      </section>

      <section className="alt-contact alt-panel" id="alternative-contact">
        <div className="alt-contact-art" aria-hidden="true">
          <img loading="lazy" src={wixImage("a56a50_fd72600ed85d4c608ec7b7f28abd18ef~mv2.jpg", 1900, 1200)} alt="" />
        </div>
        <div className="alt-contact-shell">
          <header className="alt-contact-heading">
            <p className="alt-section-label">Contact</p>
            <small>{en ? "A new story begins here" : "Une nouvelle histoire commence ici"}</small>
            <h2>{en ? <>Let’s create<br /><em>something memorable.</em></> : <>Créons ensemble<br /><em>quelque chose d’inoubliable.</em></>}</h2>
            <p className="alt-contact-intro">{en ? "Tell me about your world, your characters and the emotion you want the image to convey." : "Parlez-moi de votre univers, de vos personnages et de l’émotion que vous souhaitez transmettre par l’image."}</p>
          </header>
          <div className="alt-contact-offers">
            <article className="alt-contact-offer"><div><h3>{en ? "Publishing" : "Édition"}</h3><p>{en ? "Book covers, illustrated projects and visual worlds." : "Couvertures, projets illustrés et univers visuels."}</p></div></article>
            <article className="alt-contact-offer"><div><h3>{en ? "Commission" : "Commande"}</h3><p>{en ? "A unique portrait or a bespoke personal creation." : "Un portrait unique ou une création personnelle sur mesure."}</p></div></article>
            <article className="alt-contact-offer"><div><h3>{en ? "Events" : "Événements"}</h3><p>{en ? "Festivals, conventions and artistic collaborations." : "Festivals, conventions et collaborations artistiques."}</p></div></article>
          </div>
          <div className="alt-contact-action">
            <small>{en ? "Your project deserves its own face" : "Votre projet mérite son propre visage"}</small>
            <a className="alt-mail-button" href="mailto:juliette.amadis@gmail.com"><span>{en ? "Write to me" : "Écrivez-moi"}</span><i>↗</i></a>
          </div>
        </div>
        <footer className="alt-contact-foot">
          <span>{en ? "Follow the studio" : "Suivre l’atelier"}</span>
          <div className="alt-socials" aria-label="Réseaux sociaux">
            <a href="https://www.instagram.com/juliette_a_illustrations/" target="_blank" rel="noreferrer" aria-label="Instagram de Juliette Amadis">
              <img src="https://static.wixstatic.com/media/01c3aff52f2a4dffa526d7a9843d46ea.png/v1/fill/w_76,h_76,q_90/file.webp" alt="" />
            </a>
            <a href="https://www.facebook.com/julietteamadis/" target="_blank" rel="noreferrer" aria-label="Facebook de Juliette Amadis">
              <img src="https://static.wixstatic.com/media/0fdef751204647a3bbd7eaa2827ed4f9.png/v1/fill/w_76,h_76,q_90/file.webp" alt="" />
            </a>
          </div>
          <a className="alt-contact-shop-link" href="/boutique">{en ? "Shop" : "Boutique"} <span>↗</span></a>
          <small>Juliette Amadis · Orchies, France</small>
          <nav className="alt-legal-links" aria-label={en ? "Legal information" : "Informations légales"}>
            <a href="/informations-legales#cgv">CGV</a>
            <a href="/informations-legales#livraison">{en ? "Delivery" : "Livraison"}</a>
            <a href="/informations-legales#retours">{en ? "Returns" : "Retours"}</a>
            <a href="/informations-legales#mentions-legales">{en ? "Legal notice" : "Mentions légales"}</a>
            <a href="/informations-legales#confidentialite">{en ? "Privacy" : "Confidentialité"}</a>
          </nav>
        </footer>
      </section>

      {adminLoginOpen && <div className="alt-admin-overlay" role="dialog" aria-modal="true" aria-label={en ? "Administrator login" : "Connexion administrateur"} onClick={() => setAdminLoginOpen(false)}>
        <form className="alt-admin-login" onSubmit={submitAdminLogin} onClick={(event) => event.stopPropagation()}>
          <button className="alt-admin-close" type="button" onClick={() => setAdminLoginOpen(false)}>×</button>
          <small>ESPACE J·A</small>
          <h2>{adminSetup ? (en ? "Create the editing password" : "Créer le mot de passe d’édition") : (en ? "Unlock editing" : "Déverrouiller les modifications")}</h2>
          <p>{adminSetup ? (en ? "This first password is created only on this device." : "Ce premier mot de passe sera créé uniquement sur cet appareil.") : (en ? "Enter your administrator password." : "Saisissez votre mot de passe administrateur.")}</p>
          <label><span>{en ? "Password" : "Mot de passe"}</span><input name="password" type="password" autoComplete={adminSetup ? "new-password" : "current-password"} autoFocus required /></label>
          {adminSetup && <label><span>{en ? "Confirm password" : "Confirmer le mot de passe"}</span><input name="confirmation" type="password" autoComplete="new-password" required /></label>}
          {adminError && <strong role="alert">{adminError}</strong>}
          <button className="alt-admin-submit" type="submit">{adminSetup ? (en ? "Create access" : "Créer l’accès") : (en ? "Enter" : "Entrer")}</button>
          {!adminSetup && <button className="alt-admin-forgot" type="button" onClick={() => { if (!window.confirm(en ? "Reset the local editing password on this device?" : "Réinitialiser le mot de passe d’édition sur cet appareil ?")) return; if (!window.confirm(en ? "Second confirmation: a new password will need to be created." : "Deuxième confirmation : il faudra créer un nouveau mot de passe.")) return; window.localStorage.removeItem(ADMIN_CREDENTIALS_KEY); setAdminSetup(true); setAdminError(""); }}>{en ? "Forgot password?" : "Mot de passe oublié ?"}</button>}
        </form>
      </div>}

      {adminMode && adminPanelOpen && <aside className="alt-admin-panel" aria-label={en ? "Editing panel" : "Panneau d’édition"}>
        <header><div><small>{language.toUpperCase()}</small><h2>{adminPanelView === "add" ? (en ? "Add an artwork" : "Ajouter une œuvre") : adminPanelView === "delete" ? (en ? "Remove an artwork" : "Supprimer une œuvre") : (en ? "Edit texts" : "Modifier les textes")}</h2></div><button type="button" onClick={() => setAdminPanelOpen(false)}>×</button></header>
        {adminPanelView === "text" && <section className="alt-admin-text-help"><p>{en ? "Click a text outlined in copper, type directly, then click elsewhere to save. French and English are edited separately with the flags." : "Cliquez sur un texte entouré en cuivre, écrivez directement, puis cliquez ailleurs pour enregistrer. Le français et l’anglais se modifient séparément avec les drapeaux."}</p><button type="button" onClick={() => setAdminPanelOpen(false)}>{en ? "Edit the page" : "Modifier la page"}</button></section>}
        {adminPanelView === "text" && <section className="alt-admin-text-help"><a className="alt-admin-dashboard-link" href="/administration">{en ? "Open full dashboard" : "Ouvrir le tableau de bord complet"}</a></section>}
        {adminPanelView === "add" && <section className="alt-admin-portfolio">
          <form onSubmit={addPortfolioWork}>
            <label><span>{en ? "Image" : "Image"}</span><input name="image" type="file" accept="image/*" required /></label>
            <label><span>{en ? "Title" : "Titre"}</span><input name="title" type="text" required /></label>
            <label><span>{en ? "French details" : "Détails français"}</span><textarea name="detailsFr" rows={3} placeholder="Travail personnel · 2026" /></label>
            <label><span>{en ? "English details" : "Détails anglais"}</span><textarea name="detailsEn" rows={3} placeholder="Personal work · 2026" /></label>
            <button type="submit">{en ? "Add to portfolio" : "Ajouter au portfolio"}</button>
          </form>
        </section>}
        {adminPanelView === "delete" && <section className="alt-admin-portfolio alt-admin-delete">
          <p>{en ? "Official artworks can be restored; locally added artworks are permanently removed from this browser." : "Les œuvres officielles peuvent être restaurées ; les ajouts locaux sont supprimés définitivement de ce navigateur."}</p>
          <select value={selectedAdminWork} onChange={(event) => setSelectedAdminWork(event.target.value)}>
            <option value="">{en ? "Choose an artwork…" : "Choisir une œuvre…"}</option>
            {[...portfolioItems, ...additionalPortfolioItems, ...adminWorks].filter((work) => !hiddenWorkIds.includes(work[0])).map((work) => <option key={work[4] || work[0]} value={work[4] || work[0]}>{work[1]}</option>)}
          </select>
          <button type="button" disabled={!selectedAdminWork} onClick={deletePortfolioWork}>{en ? "Remove with double confirmation" : "Supprimer avec double confirmation"}</button>
          {hiddenWorkIds.length > 0 && <button className="alt-admin-restore" type="button" onClick={() => { window.localStorage.removeItem("juliette-alt-hidden-works"); setHiddenWorkIds([]); }}>{en ? `Restore ${hiddenWorkIds.length} hidden artwork(s)` : `Restaurer ${hiddenWorkIds.length} œuvre(s) masquée(s)`}</button>}
        </section>}
      </aside>}

      {selectedWork && <div className={`alt-lightbox ${lightboxImageReady ? "is-ready" : "is-loading"}`} role="dialog" aria-modal="true" aria-label={en ? "Enlarged artwork" : "Vue agrandie"} onClick={() => setSelectedWork(null)}>
        <button className="alt-lightbox-close" aria-label={en ? "Close" : "Fermer"} title={en ? "Close" : "Fermer"} onClick={() => setSelectedWork(null)}>×</button>
        <button className="alt-lightbox-nav alt-lightbox-prev" aria-label={en ? "Previous artwork" : "Œuvre précédente"} onClick={(event) => { event.stopPropagation(); showAdjacentWork(-1); }}>‹</button>
        <button className="alt-lightbox-nav alt-lightbox-next" aria-label={en ? "Next artwork" : "Œuvre suivante"} onClick={(event) => { event.stopPropagation(); showAdjacentWork(1); }}>›</button>
        {!lightboxImageReady && <div className="alt-lightbox-loader" role="status" aria-live="polite"><i aria-hidden="true" /><span>{en ? "Loading the artwork" : "Chargement de l’œuvre"}</span></div>}
        <div className="alt-lightbox-stage" style={{ backgroundImage: lightboxImageReady ? undefined : `linear-gradient(rgba(20,13,9,.58),rgba(20,13,9,.58)),url("${portfolioImage(selectedWork[0], 720, 960)}")` }} onContextMenu={(event) => event.preventDefault()} onClick={() => setSelectedWork(null)}>
          <img
            className={dragStart.current ? "dragging" : ""}
            style={{ transform: `translate3d(${pan.x}px,${pan.y}px,0) scale(${zoom})` }}
            src={portfolioImage(selectedWork[0], 1800, 2200)}
            alt={selectedWork[1]}
            onLoad={() => setLightboxImageReady(true)}
            onError={() => setLightboxImageReady(true)}
            draggable={false}
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => {
              event.stopPropagation();
              setZoom((value) => {
                if (value > 1) {
                  setPan({ x: 0, y: 0 });
                  return 1;
                }
                return 2;
              });
            }}
            onWheel={(event) => { event.preventDefault(); event.stopPropagation(); setZoom((value) => Math.max(1, Math.min(3, value + (event.deltaY < 0 ? .2 : -.2)))); }}
            onPointerDown={(event) => { event.stopPropagation(); if (zoom <= 1) return; event.currentTarget.setPointerCapture(event.pointerId); dragStart.current = { pointerX: event.clientX, pointerY: event.clientY, imageX: pan.x, imageY: pan.y }; }}
            onPointerMove={(event) => { if (!dragStart.current) return; event.stopPropagation(); setPan({ x: dragStart.current.imageX + event.clientX - dragStart.current.pointerX, y: dragStart.current.imageY + event.clientY - dragStart.current.pointerY }); }}
            onPointerUp={(event) => { event.stopPropagation(); dragStart.current = null; }}
            onPointerCancel={() => { dragStart.current = null; }}
          />
        </div>
        <div className="alt-lightbox-meta"><strong>{selectedWork[1]}</strong><span>{selectedWork[0].startsWith("data:") ? selectedWork[2] : localizeWorkDescription(sourceDescriptionFor(selectedWork[0], en), en)}</span><small>{en ? "Mouse wheel or double-click to zoom · Drag to move" : "Molette ou double-clic pour zoomer · Glisser pour déplacer"}</small></div>
      </div>}
    </main>
  );
}
