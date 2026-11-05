"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Product = {
  id: string;
  name: string;
  category: string;
  sku: string;
  unit: string;
  price: number;
  stock: number;
  lowStockAt: number;
  createdAt: string;
  updatedAt: string;
};

type TransactionType = "received" | "sold" | "damaged";
type Transaction = {
  id: string;
  productId: string;
  productName: string;
  type: TransactionType;
  quantity: number;
  unitPrice: number;
  note: string;
  createdAt: string;
};

type IconName =
  | "grid"
  | "box"
  | "clock"
  | "chart"
  | "mic"
  | "plus"
  | "search"
  | "arrow"
  | "receive"
  | "sale"
  | "damage"
  | "edit"
  | "trash"
  | "close"
  | "download"
  | "check"
  | "spark"
  | "menu"
  | "lock"
  | "help";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 8 9 5 9-5" /><path d="M3 8v9l9 5 9-5V8" /><path d="M12 13v9" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h17" /><path d="m7 15 4-4 3 2 5-6" /><path d="M19 7v4h-4" /></>,
    mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    receive: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M5 17v4h14v-4" /></>,
    sale: <><path d="M4 7h16l-1.5 13h-13L4 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /><path d="m9 13 6 4m0-4-6 4" /></>,
    damage: <><path d="m12 3 9 17H3L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
    edit: <><path d="m14 5 5 5" /><path d="M4 20h4l11-11a2.1 2.1 0 0 0-4-4L4 16v4Z" /></>,
    trash: <><path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2" /><path d="M10 11v5m4-5v5" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M4 19v2h16v-2" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 3.8 2.2c-.9.5-1.4 1.1-1.4 2.1" /><path d="M12 17h.01" /></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

const navigation: { id: string; label: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "inventory", label: "Products", icon: "box" },
  { id: "activity", label: "Stock history", icon: "clock" },
  { id: "reports", label: "Reports", icon: "chart" },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

function formatTime(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function typeLabel(type: TransactionType) {
  return type === "received" ? "Stock received" : type === "sold" ? "Sale" : "Damaged";
}

function transactionIcon(type: TransactionType): IconName {
  return type === "received" ? "receive" : type === "sold" ? "sale" : "damage";
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

type VoiceRecognition = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionConstructor = new () => VoiceRecognition;
type BrowserWithSpeech = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activePage, setActivePage] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [modal, setModal] = useState<"transaction" | "voice" | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>("sold");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    sku: "",
    unit: "pcs",
    price: "",
    stock: "",
    lowStockAt: "5",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [voiceMessage, setVoiceMessage] = useState("");
  const recognitionRef = useRef<VoiceRecognition | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminModal, setAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const [helpModal, setHelpModal] = useState(false);
  const [viewingProductId, setViewingProductId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadError("");
    try {
      const [productResponse, transactionResponse] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/transactions", { cache: "no-store" }),
      ]);
      if (!productResponse.ok || !transactionResponse.ok) {
        throw new Error("The stock records could not be loaded.");
      }
      const [productData, transactionData] = await Promise.all([
        productResponse.json() as Promise<Product[]>,
        transactionResponse.json() as Promise<Transaction[]>,
      ]);
      setProducts(productData);
      setTransactions(transactionData);
      setSelectedProductId((current) =>
        productData.some((product) => product.id === current) ? current : productData[0]?.id || "",
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "The stock records could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ authenticated?: boolean }>)
      .then((data) => {
        if (active) setIsAdmin(Boolean(data.authenticated));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () => ["All categories", ...Array.from(new Set(products.map((product) => product.category))).sort()],
    [products],
  );
  const lowStockProducts = products.filter((product) => product.stock <= product.lowStockAt);
  const totalUnits = products.reduce((sum, product) => sum + product.stock, 0);
  const stockValue = products.reduce((sum, product) => sum + product.stock * product.price, 0);
  const filteredProducts = products.filter((product) => {
    const matchesText = `${product.name} ${product.sku} ${product.category}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesCategory = categoryFilter === "All categories" || product.category === categoryFilter;
    return matchesText && matchesCategory;
  });
  const availableProducts = products.filter((product) => product.stock > 0);
  const viewingProduct = products.find((product) => product.id === viewingProductId) ?? null;
  const viewingProductMovements = viewingProduct
    ? transactions.filter((item) => item.productId === viewingProduct.id).slice(0, 4)
    : [];

  function showToast(message: string) {
    setToast(message);
  }

  function closeAdminModal() {
    setAdminModal(false);
    setAdminPassword("");
    setAdminError("");
    pendingActionRef.current = null;
  }

  function openAdminPanel() {
    setAdminPassword("");
    setAdminError("");
    pendingActionRef.current = null;
    setAdminModal(true);
  }

  function requestAdmin(action: () => void, message: string) {
    if (isAdmin) {
      action();
      return;
    }
    pendingActionRef.current = action;
    setAdminPassword("");
    setAdminError(message);
    setAdminModal(true);
  }

  async function unlockAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdminBusy(true);
    setAdminError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not unlock admin mode.");
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      setIsAdmin(true);
      setAdminModal(false);
      setAdminPassword("");
      showToast("Admin access unlocked. You can now manage the stock.");
      if (action) window.setTimeout(action, 0);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Could not unlock admin mode.");
    } finally {
      setAdminBusy(false);
    }
  }

  async function exitAdminMode() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      setIsAdmin(false);
      closeAdminModal();
      showToast("Admin mode ended. The shop is now view-only.");
    }
  }

  function handleUnauthorized() {
    setIsAdmin(false);
    setAdminPassword("");
    setAdminError("Your admin session expired. Enter the password to continue.");
    setAdminModal(true);
  }

  function handleProductRowKey(event: React.KeyboardEvent<HTMLTableRowElement>, productId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setViewingProductId(productId);
    }
  }

  function openTransactionNow(type: TransactionType, product?: Product) {
    setTransactionType(type);
    setSelectedProductId(product?.id ?? products[0]?.id ?? "");
    setQuantity("1");
    setNote("");
    setModal("transaction");
  }

  function openTransaction(type: TransactionType, product?: Product) {
    requestAdmin(
      () => openTransactionNow(type, product),
      "Enter the admin password to record stock changes.",
    );
  }

  function closeTransactionModal() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setVoiceActive(false);
    setModal(null);
  }

  function openVoiceEntryNow() {
    setVoiceText("");
    setVoiceMessage("");
    setModal("voice");
  }

  function openVoiceEntry() {
    requestAdmin(openVoiceEntryNow, "Enter the admin password to record stock changes.");
  }

  function openProductEditorNow(product?: Product) {
    setEditingProduct(product ?? null);
    setProductForm(
      product
        ? {
            name: product.name,
            category: product.category,
            sku: product.sku,
            unit: product.unit,
            price: String(product.price),
            stock: String(product.stock),
            lowStockAt: String(product.lowStockAt),
          }
        : { name: "", category: "", sku: "", unit: "pcs", price: "", stock: "", lowStockAt: "5" },
    );
    setProductModal(true);
  }

  function openProductEditor(product?: Product) {
    requestAdmin(
      () => openProductEditorNow(product),
      "Enter the admin password to add or edit products.",
    );
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(
        editingProduct ? `/api/products/${editingProduct.id}` : "/api/products",
        {
          method: editingProduct ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...productForm,
            price: Number(productForm.price),
            stock: Number(productForm.stock),
            lowStockAt: Number(productForm.lowStockAt),
          }),
        },
      );
      const result = await response.json();
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) throw new Error(result.error ?? "Could not save this product.");
      setProductModal(false);
      await refresh();
      showToast(editingProduct ? "Product details updated." : "Product added to your stock.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save this product.");
    } finally {
      setSaving(false);
    }
  }

  async function removeProductNow(product: Product) {
    if (!window.confirm(`Remove ${product.name} from your inventory?`)) return;
    try {
      const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const result = await response.json();
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) throw new Error(result.error ?? "Could not remove this product.");
      await refresh();
      showToast("Product removed.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not remove this product.");
    }
  }

  function removeProduct(product: Product) {
    requestAdmin(
      () => {
        void removeProductNow(product);
      },
      "Enter the admin password to remove products.",
    );
  }

  async function submitTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          type: transactionType,
          quantity: Number(quantity),
          note,
        }),
      });
      const result = await response.json();
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) throw new Error(result.error ?? "Could not save this stock change.");
      setModal(null);
      await refresh();
      showToast(
        transactionType === "received"
          ? "Stock received and inventory updated."
          : transactionType === "sold"
            ? "Sale recorded and inventory updated."
            : "Damaged stock recorded and inventory updated.",
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save this stock change.");
    } finally {
      setSaving(false);
    }
  }

  function parseVoiceCommand(text: string) {
    const action = text.match(/\b(received?|restock(?:ed)?|add(?:ed)?|sold?|sell|damage(?:d)?|waste|wasted)\b/i);
    const amount = text.match(/\b(\d+(?:\.\d+)?)\b/);
    const normalized = text.toLowerCase();
    const product = products.find((item) => normalized.includes(item.name.toLowerCase()));
    const nextType: TransactionType | null = action
      ? /^(receive|restock|add)/i.test(action[1])
        ? "received"
        : /^(damage|waste)/i.test(action[1])
          ? "damaged"
          : "sold"
      : null;

    if (!action || !amount) {
      setVoiceMessage("Say an action and quantity, such as “sold 3 milk”.");
      return;
    }
    if (!product) {
      setVoiceMessage("I heard the action, but couldn’t match a product. Choose one below before continuing.");
    } else {
      setVoiceMessage("Check the details below. Nothing changes until you confirm.");
    }
    setTransactionType(nextType ?? "sold");
    setQuantity(amount[1]);
    setSelectedProductId(product?.id ?? products[0]?.id ?? "");
  }

  function startListening() {
    const browser = window as BrowserWithSpeech;
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceMessage("Voice input isn’t available in this browser. Type a command below instead.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      setVoiceText(transcript);
      setVoiceActive(false);
      if (transcript) parseVoiceCommand(transcript);
    };
    recognition.onerror = (event) => {
      setVoiceActive(false);
      setVoiceMessage(
        event.error === "not-allowed"
          ? "Microphone access was blocked. Allow microphone access or type a command."
          : "I couldn’t hear that clearly. Try again or type your command.",
      );
    };
    recognition.onend = () => setVoiceActive(false);
    recognitionRef.current = recognition;
    setVoiceMessage("Listening…");
    setVoiceActive(true);
    try {
      recognition.start();
    } catch (error) {
      setVoiceActive(false);
      setVoiceMessage(
        error instanceof Error ? `Microphone could not start: ${error.message}` : "Microphone could not start.",
      );
    }
  }

  function exportReport() {
    const rows = [
      ["Date", "Product", "Type", "Quantity", "Unit price", "Note"],
      ...transactions.map((item) => [
        new Date(item.createdAt).toISOString(),
        item.productName,
        typeLabel(item.type),
        item.quantity,
        item.unitPrice.toFixed(2),
        item.note,
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "stock-records-stock-history.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const pageTitle =
    navigation.find((item) => item.id === activePage)?.label ?? "Overview";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <a className="brand" href="/" onClick={() => setActivePage("overview")}>
          <span className="brand-mark"><Icon name="box" size={21} /></span>
          <span className="brand-name">Stock <span>Records</span><small>little shop. big control.</small></span>
        </a>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              className={`nav-link ${activePage === item.id ? "nav-link-active" : ""}`}
              key={item.id}
              onClick={() => {
                setActivePage(item.id);
                setSidebarOpen(false);
              }}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.id === "inventory" && <span className="nav-count" title={`${products.length} products on file`}>{products.length}</span>}
            </button>
          ))}
          <button
            className={`nav-link ${isAdmin ? "nav-link-admin-on" : ""}`}
            onClick={() => {
              setSidebarOpen(false);
              openAdminPanel();
            }}
          >
            <Icon name={isAdmin ? "check" : "lock"} size={19} />
            <span>{isAdmin ? "Admin mode" : "Admin"}</span>
          </button>
          <button
            className="nav-link"
            onClick={() => {
              setSidebarOpen(false);
              setHelpModal(true);
            }}
          >
            <Icon name="help" size={19} />
            <span>How it works</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="voice-promo">
            <span className="promo-icon"><Icon name="mic" size={18} /></span>
            <strong>Hands full?</strong>
            <p>Say it, check it, then save it.</p>
            <button onClick={openVoiceEntry}>
              Try voice entry <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="profile">
            <div className="avatar">{isAdmin ? "AD" : "SR"}</div>
            <div><strong>{isAdmin ? "Administrator" : "Customer view"}</strong><span>{isAdmin ? "Admin mode active" : "View only"}</span></div>
            <span className={`online-dot ${isAdmin ? "" : "online-dot-muted"}`} title={isAdmin ? "Admin session active" : "View only"} />
          </div>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Icon name="menu" />
          </button>
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{pageTitle}</strong></div>
          <div className="top-actions">
            <span className="today-label">{new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date())}</span>
            <button className="icon-button help-top-button" title="How to use Stock Records" aria-label="How to use Stock Records" onClick={() => setHelpModal(true)}>
              <Icon name="help" size={17} />
            </button>
            <button className={`button ${isAdmin ? "button-lime" : "button-outline"} admin-top-link`} onClick={openAdminPanel}>
              <Icon name={isAdmin ? "check" : "lock"} size={15} /> {isAdmin ? "Admin mode" : "Admin"}
            </button>
            <button className="button button-dark top-add" aria-label="Add product" onClick={() => openProductEditor()}>
              <Icon name="plus" size={16} /> <span className="top-add-label">Add product</span>
            </button>
          </div>
        </header>

        <div className="page-content">
          {loadError && (
            <div className="error-banner" role="alert">
              <span>{loadError}</span>
              <button onClick={() => void refresh()}>Try again</button>
            </div>
          )}

          {activePage === "overview" && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow"><span className="eyebrow-line" /> YOUR SHOP, AT A GLANCE</div>
                  <h1>A little more <em>in control.</em></h1>
                  <p className="welcome-copy">Here’s how things are looking on your shelves today.</p>
                </div>
                <button className="button button-outline" onClick={openVoiceEntry}>
                  <Icon name="mic" size={17} /> Speak a stock change
                </button>
              </section>

              {!isAdmin && (
                <div className="view-only-banner">
                  <span className="view-only-mark"><Icon name="lock" size={14} /></span>
                  <p>You’re viewing the shop. <strong>Click Admin</strong> to add or remove stock.</p>
                  <button className="button button-outline" onClick={openAdminPanel}>Unlock admin</button>
                </div>
              )}

              <section className="stat-grid" aria-label="Stock summary">
                <article className="stat-card">
                  <div className="stat-top"><span className="stat-icon mint"><Icon name="box" /></span><span className="stat-caption">ACROSS ALL PRODUCTS</span></div>
                  <div className="stat-value">{loading ? "—" : number.format(totalUnits)} <span>units</span></div>
                  <div className="stat-footer"><span className="stat-dot green" /> On hand right now</div>
                </article>
                <article className="stat-card">
                  <div className="stat-top"><span className="stat-icon butter"><Icon name="chart" /></span><span className="stat-caption">AT SELLING PRICE</span></div>
                  <div className="stat-value">{loading ? "—" : currency.format(stockValue)}</div>
                  <div className="stat-footer"><span className="stat-dot yellow" /> Estimated shelf value</div>
                </article>
                <article className={`stat-card ${lowStockProducts.length ? "stat-card-alert" : ""}`}>
                  <div className="stat-top"><span className="stat-icon blush"><Icon name="damage" /></span><span className="stat-caption">WORTH A SECOND LOOK</span></div>
                  <div className="stat-value">{loading ? "—" : lowStockProducts.length} <span>products</span></div>
                  <div className="stat-footer"><span className={`stat-dot ${lowStockProducts.length ? "red" : "green"}`} /> At or below their reorder level</div>
                </article>
                <article className="stat-card">
                  <div className="stat-top"><span className="stat-icon lavender"><Icon name="clock" /></span><span className="stat-caption">RECORDED SO FAR</span></div>
                  <div className="stat-value">{loading ? "—" : transactions.length} <span>changes</span></div>
                  <div className="stat-footer"><span className="stat-dot green" /> In your stock history</div>
                </article>
              </section>

              <div className="dashboard-grid">
                <section className="panel inventory-panel">
                  <div className="panel-heading">
                    <div><div className="eyebrow">KEEP AN EYE ON IT</div><h2>Stock on the shelf</h2></div>
                    <button className="text-button" onClick={() => setActivePage("inventory")}>See all <Icon name="arrow" size={15} /></button>
                  </div>
                  {loading ? <div className="loading-state">Getting your stock together…</div> : products.length === 0 ? (
                    <EmptyState title="A fresh shelf." detail="Add your first product and it’ll show up here." onClick={() => openProductEditor()} />
                  ) : (
                    <div className="table-scroll">
                      <table className="data-table responsive-table">
                        <thead><tr><th>PRODUCT</th><th>IN STOCK</th><th>SELLING PRICE</th><th>STATUS</th><th /></tr></thead>
                        <tbody>{products.slice(0, 6).map((product) => (
                          <tr
                            key={product.id}
                            className="clickable-row"
                            tabIndex={0}
                            title={`View ${product.name} availability`}
                            onClick={() => setViewingProductId(product.id)}
                            onKeyDown={(event) => handleProductRowKey(event, product.id)}
                          >
                            <td data-label="Product"><ProductCell product={product} /></td>
                            <td data-label="In stock"><strong className="stock-number">{number.format(product.stock)}</strong><span className="unit-label"> {product.unit}</span></td>
                            <td data-label="Selling price">{currency.format(product.price)}</td>
                            <td data-label="Status"><StockBadge product={product} /></td>
                            <td data-label="Quick action"><button className="row-action" title="Record stock received" aria-label={`Receive stock for ${product.name}`} onClick={(event) => { event.stopPropagation(); openTransaction("received", product); }}><Icon name="plus" size={17} /></button></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                  {products.length > 6 && <button className="table-more" onClick={() => setActivePage("inventory")}>Showing 6 of {products.length} products <Icon name="arrow" size={14} /></button>}
                </section>

                <section className="panel low-stock-panel">
                  <div className="panel-heading">
                    <div><div className="eyebrow">BEFORE IT RUNS OUT</div><h2>Needs a restock</h2></div>
                    <span className="small-count">{lowStockProducts.length}</span>
                  </div>
                  {lowStockProducts.length === 0 ? (
                    <div className="all-good"><span className="all-good-mark"><Icon name="check" size={19} /></span><div><strong>Looking good.</strong><p>Nothing is below its reorder level.</p></div></div>
                  ) : (
                    <div className="low-stock-list">{lowStockProducts.slice(0, 5).map((product) => (
                      <button type="button" className="low-stock-item" key={product.id} title={`View ${product.name} availability`} onClick={() => setViewingProductId(product.id)}>
                        <ProductAvatar product={product} />
                        <div className="low-item-copy"><strong>{product.name}</strong><span>Reorder at {number.format(product.lowStockAt)} {product.unit}</span></div>
                        <div className="low-item-right"><strong>{number.format(product.stock)}</strong><span>left</span></div>
                      </button>
                    ))}</div>
                  )}
                  {lowStockProducts.length > 0 && <button className="restock-button" onClick={() => openTransaction("received", lowStockProducts[0])}><Icon name="receive" size={16} /> Record a delivery</button>}
                </section>

                <section className="panel activity-panel">
                  <div className="panel-heading">
                    <div><div className="eyebrow">THE LATEST</div><h2>Recent stock activity</h2></div>
                    <button className="text-button" onClick={() => setActivePage("activity")}>Full history <Icon name="arrow" size={15} /></button>
                  </div>
                  <ActivityList transactions={transactions.slice(0, 5)} />
                </section>

                <section className="voice-card">
                  <div className="voice-card-art"><span className="sound-wave wave-one" /><span className="sound-wave wave-two" /><span className="sound-wave wave-three" /><span className="mic-disc"><Icon name="mic" size={24} /></span></div>
                  <div className="voice-card-copy"><div className="eyebrow">NO PEN, NO PROBLEM</div><h2>Got a delivery?<br />Just say so.</h2><p>“Received 12 tins of baked beans.” Check the details before anything changes.</p><button className="button button-lime" onClick={openVoiceEntry}>Try voice entry <Icon name="arrow" size={16} /></button></div>
                  <div className="voice-card-note"><Icon name="spark" size={15} /> Always asks before saving</div>
                </section>
              </div>
            </>
          )}

          {activePage === "inventory" && (
            <>
              <section className="page-heading-row">
                <div><div className="eyebrow"><span className="eyebrow-line" /> YOUR PRODUCTS</div><h1>On the <em>shelf.</em></h1><p className="welcome-copy">The everyday essentials, all in one place.</p></div>
                <button className="button button-dark" onClick={() => openProductEditor()}><Icon name="plus" size={16} /> Add a product</button>
              </section>
              <section className="inventory-summary" aria-label="Product availability">
                <div className="summary-item">
                  <span>PRODUCTS AVAILABLE</span>
                  <strong>{loading ? "—" : number.format(availableProducts.length)}</strong>
                  <small>of {number.format(products.length)} on file</small>
                </div>
                <div className="summary-item">
                  <span>UNITS ON HAND</span>
                  <strong>{loading ? "—" : number.format(totalUnits)}</strong>
                  <small>across every product</small>
                </div>
                <div className={`summary-item ${lowStockProducts.length ? "summary-item-alert" : ""}`}>
                  <span>NEED RESTOCKING</span>
                  <strong>{loading ? "—" : number.format(lowStockProducts.length)}</strong>
                  <small>{lowStockProducts.length ? "at or below reorder level" : "everything looks healthy"}</small>
                </div>
                <button className="summary-link" onClick={() => setActivePage("activity")}>View stock history <Icon name="arrow" size={14} /></button>
              </section>
              <section className="panel full-panel">
                <div className="inventory-tools">
                  <label className="search-field"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a product or SKU" aria-label="Search products" /></label>
                  <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter by category">{categories.map((category) => <option key={category}>{category}</option>)}</select>
                </div>
                {loading ? <div className="loading-state">Getting your stock together…</div> : filteredProducts.length === 0 ? (
                  <EmptyState title={products.length ? "Nothing found." : "A fresh shelf."} detail={products.length ? "Try another name, SKU or category." : "Add your first product and it’ll show up here."} onClick={products.length ? undefined : () => openProductEditor()} />
                ) : (
                  <div className="table-scroll">
                    <table className="data-table inventory-table responsive-table">
                      <thead><tr><th>PRODUCT</th><th>SKU</th><th>IN STOCK</th><th>SELLING PRICE</th><th>STATUS</th><th className="actions-heading">ACTIONS</th></tr></thead>
                      <tbody>{filteredProducts.map((product) => (
                        <tr
                          key={product.id}
                          className="clickable-row"
                          tabIndex={0}
                          title={`View ${product.name} availability`}
                          onClick={() => setViewingProductId(product.id)}
                          onKeyDown={(event) => handleProductRowKey(event, product.id)}
                        >
                          <td data-label="Product"><ProductCell product={product} /></td>
                          <td className="sku-cell" data-label="SKU">{product.sku}</td>
                          <td data-label="In stock"><strong className="stock-number">{number.format(product.stock)}</strong><span className="unit-label"> {product.unit}</span></td>
                          <td data-label="Selling price">{currency.format(product.price)}</td>
                          <td data-label="Status"><StockBadge product={product} /></td>
                          <td data-label="Actions"><div className="row-actions">
                            <button className="row-action" title="Receive stock" aria-label={`Receive stock for ${product.name}`} onClick={(event) => { event.stopPropagation(); openTransaction("received", product); }}><Icon name="receive" size={16} /></button>
                            <button className="row-action" title="Record a sale" aria-label={`Record sale for ${product.name}`} onClick={(event) => { event.stopPropagation(); openTransaction("sold", product); }}><Icon name="sale" size={16} /></button>
                            <button className="row-action" title="Edit product" aria-label={`Edit ${product.name}`} onClick={(event) => { event.stopPropagation(); openProductEditor(product); }}><Icon name="edit" size={16} /></button>
                            <button className="row-action row-action-danger" title="Remove product" aria-label={`Remove ${product.name}`} onClick={(event) => { event.stopPropagation(); void removeProduct(product); }}><Icon name="trash" size={16} /></button>
                          </div></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
                <div className="table-footnote">Showing {filteredProducts.length} of {products.length} products <span>·</span> {number.format(filteredProducts.reduce((sum, product) => sum + product.stock, 0))} units available <span>·</span> Click any product to see its details.</div>
              </section>
            </>
          )}

          {activePage === "activity" && (
            <>
              <section className="page-heading-row">
                <div><div className="eyebrow"><span className="eyebrow-line" /> EVERY LITTLE CHANGE</div><h1>Stock <em>history.</em></h1><p className="welcome-copy">Deliveries, sales and write-offs, in the order they happened.</p></div>
                <button className="button button-outline" onClick={exportReport}><Icon name="download" size={16} /> Export CSV</button>
              </section>
              <section className="panel full-panel history-panel">
                <div className="panel-heading"><div><div className="eyebrow">YOUR RECORD BOOK</div><h2>{transactions.length} recorded {transactions.length === 1 ? "change" : "changes"}</h2></div></div>
                <ActivityList transactions={transactions} showAll />
              </section>
            </>
          )}

          {activePage === "reports" && (
            <>
              <section className="page-heading-row">
                <div><div className="eyebrow"><span className="eyebrow-line" /> THE BIGGER PICTURE</div><h1>Shop <em>notes.</em></h1><p className="welcome-copy">Simple numbers to help you keep a better eye on things.</p></div>
                <button className="button button-outline" onClick={exportReport}><Icon name="download" size={16} /> Download history</button>
              </section>
              <div className="report-grid">
                <article className="report-card report-card-dark"><div className="eyebrow">ESTIMATED STOCK VALUE</div><strong>{currency.format(stockValue)}</strong><p>Current on-hand quantity × selling price.</p><span className="report-card-mark"><Icon name="chart" size={20} /></span></article>
                <article className="report-card"><div className="eyebrow">PRODUCTS ON FILE</div><strong>{number.format(products.length)}</strong><p>Across {categories.length - 1} {categories.length - 1 === 1 ? "category" : "categories"}.</p><span className="report-card-mark"><Icon name="box" size={20} /></span></article>
                <article className="report-card"><div className="eyebrow">UNITS WRITTEN OFF</div><strong>{number.format(transactions.filter((item) => item.type === "damaged").reduce((sum, item) => sum + item.quantity, 0))}</strong><p>Recorded as damaged or wasted.</p><span className="report-card-mark"><Icon name="damage" size={20} /></span></article>
                <article className="report-card"><div className="eyebrow">SALES RECORDED</div><strong>{number.format(transactions.filter((item) => item.type === "sold").reduce((sum, item) => sum + item.quantity, 0))}</strong><p>Units logged as sold.</p><span className="report-card-mark"><Icon name="sale" size={20} /></span></article>
              </div>
              <section className="panel full-panel report-activity">
                <div className="panel-heading"><div><div className="eyebrow">A QUICK LOOK BACK</div><h2>Latest changes</h2></div><button className="text-button" onClick={() => setActivePage("activity")}>All history <Icon name="arrow" size={15} /></button></div>
                <ActivityList transactions={transactions.slice(0, 6)} />
              </section>
              <p className="report-note">Stock value uses selling prices, not cost prices. Sales totals are unit counts, not revenue.</p>
            </>
          )}
          <footer className="page-footer"><span>Made for the rhythm of a little shop.</span><span>Stock Records <span className="footer-dot">·</span> Local workspace</span></footer>
        </div>
      </main>

      {(modal === "transaction" || modal === "voice") && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) closeTransactionModal();
        }}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="transaction-title">
            <div className="modal-header">
              <div><div className="eyebrow">{modal === "voice" ? "SAY IT LIKE YOU’D SAY IT" : "KEEPING THE BOOKS STRAIGHT"}</div><h2 id="transaction-title">{modal === "voice" ? "A quick stock note." : "Record a stock change."}</h2></div>
              <button className="icon-button" aria-label="Close dialog" disabled={saving} onClick={closeTransactionModal}><Icon name="close" /></button>
            </div>
            {modal === "voice" && (
              <div className="voice-input-area">
                <div className={`listen-button-wrap ${voiceActive ? "is-listening" : ""}`}>
                  <button className="listen-button" onClick={voiceActive ? () => recognitionRef.current?.stop() : startListening} aria-label={voiceActive ? "Stop listening" : "Start voice input"}><Icon name="mic" size={24} /></button>
                </div>
                <div className="voice-instructions"><strong>{voiceActive ? "I’m listening…" : "Tap the mic or type it out."}</strong><span>Try “sold 3 milk” or “received 12 tins of beans”.</span></div>
                <div className="voice-text-row"><input value={voiceText} onChange={(event) => setVoiceText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") parseVoiceCommand(voiceText); }} placeholder="e.g. received 12 tins of beans" aria-label="Type a stock command" /><button className="button button-dark" type="button" onClick={() => parseVoiceCommand(voiceText)}>Use words</button></div>
                {voiceMessage && <p className="voice-hint" role="status">{voiceMessage}</p>}
              </div>
            )}
            <form onSubmit={submitTransaction}>
              <div className="field-label">WHAT HAPPENED?</div>
              <div className="transaction-types">
                {(["received", "sold", "damaged"] as TransactionType[]).map((type) => (
                  <button type="button" key={type} className={`type-choice ${transactionType === type ? "type-choice-active" : ""}`} onClick={() => setTransactionType(type)}>
                    <Icon name={transactionIcon(type)} size={17} /><span>{type === "received" ? "Received" : type === "sold" ? "Sold" : "Damaged"}</span>
                  </button>
                ))}
              </div>
              <label className="form-field"><span>PRODUCT</span><select required value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}><option value="" disabled>Choose a product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {number.format(product.stock)} {product.unit} on hand</option>)}</select></label>
              <div className="form-row">
                <label className="form-field"><span>QUANTITY</span><input required type="number" min="0.01" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
                <div className="form-field"><span>AFTER THIS CHANGE</span><div className="after-stock">{selectedProduct ? `${number.format(selectedProduct.stock + (transactionType === "received" ? Number(quantity || 0) : -Number(quantity || 0)))} ${selectedProduct.unit}` : "Choose a product"}</div></div>
              </div>
              <label className="form-field"><span>NOTE <small>OPTIONAL</small></span><input value={note} onChange={(event) => setNote(event.target.value)} maxLength={160} placeholder="Supplier, reason, or anything to remember" /></label>
              {modal === "voice" && <div className="confirm-reminder"><Icon name="check" size={16} /> Your stock only changes when you confirm below.</div>}
              <div className="modal-footer"><button type="button" className="button button-quiet" disabled={saving} onClick={closeTransactionModal}>Cancel</button><button type="submit" className="button button-dark" disabled={saving || !products.length}>{saving ? "Saving…" : "Confirm & save"} <Icon name="arrow" size={16} /></button></div>
            </form>
          </section>
        </div>
      )}

      {viewingProduct && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setViewingProductId(null);
        }}>
          <section className="modal-card product-view-modal" role="dialog" aria-modal="true" aria-labelledby="product-view-title">
            <div className="modal-header">
              <div><div className="eyebrow">PRODUCT AT A GLANCE</div><h2 id="product-view-title">{viewingProduct.name}</h2></div>
              <button className="icon-button" aria-label="Close product details" onClick={() => setViewingProductId(null)}><Icon name="close" /></button>
            </div>
            <div className="product-view-hero">
              <ProductAvatar product={viewingProduct} />
              <div className="product-view-count"><span>AVAILABLE RIGHT NOW</span><strong>{number.format(viewingProduct.stock)} <small>{viewingProduct.unit}</small></strong></div>
              <StockBadge product={viewingProduct} />
            </div>
            <div className="product-view-grid">
              <div><span>CATEGORY</span><strong>{viewingProduct.category}</strong></div>
              <div><span>SKU</span><strong>{viewingProduct.sku}</strong></div>
              <div><span>SELLING PRICE</span><strong>{currency.format(viewingProduct.price)}</strong></div>
              <div><span>SHELF VALUE</span><strong>{currency.format(viewingProduct.stock * viewingProduct.price)}</strong></div>
              <div><span>RESTOCK WHEN</span><strong>{number.format(viewingProduct.lowStockAt)} {viewingProduct.unit} left</strong></div>
              <div><span>LAST UPDATED</span><strong>{formatTime(viewingProduct.updatedAt)}</strong></div>
            </div>
            <div className="product-view-history">
              <div className="product-view-history-head">
                <div className="field-label">RECENT MOVEMENTS</div>
                <button className="text-button" onClick={() => { setViewingProductId(null); setActivePage("activity"); }}>All history <Icon name="arrow" size={14} /></button>
              </div>
              <ActivityList transactions={viewingProductMovements} />
            </div>
            <div className="modal-footer product-view-footer">
              <button className="button button-quiet" onClick={() => setViewingProductId(null)}>Close</button>
              {isAdmin ? (
                <>
                  <button className="button button-outline" onClick={() => { const product = viewingProduct; setViewingProductId(null); openProductEditorNow(product); }}>Edit product</button>
                  <button className="button button-dark" onClick={() => { const product = viewingProduct; setViewingProductId(null); openTransactionNow("received", product); }}><Icon name="receive" size={15} /> Record stock</button>
                </>
              ) : (
                <button className="button button-dark" onClick={() => { setViewingProductId(null); openAdminPanel(); }}><Icon name="lock" size={15} /> Admin sign in</button>
              )}
            </div>
          </section>
        </div>
      )}

      {helpModal && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setHelpModal(false);
        }}>
          <section className="modal-card help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
            <div className="modal-header">
              <div><div className="eyebrow">QUICK START GUIDE</div><h2 id="help-title">A simple way to run the shelf.</h2></div>
              <button className="icon-button" aria-label="Close help" onClick={() => setHelpModal(false)}><Icon name="close" /></button>
            </div>
            <p className="help-lead">No training needed. Browse freely, and unlock admin when you need to change something.</p>
            <div className="help-steps">
              <div className="help-step"><span className="help-number">1</span><div><strong>Look around</strong><p>Click any product to see how many are available, the selling price and its recent stock movements.</p></div></div>
              <div className="help-step"><span className="help-number">2</span><div><strong>Unlock admin</strong><p>Click Admin and enter the owner password. Until then, everything stays safe and view-only.</p></div></div>
              <div className="help-step"><span className="help-number">3</span><div><strong>Add your products</strong><p>Use Add product to set a name, price, starting stock and the level where you want a restock warning.</p></div></div>
              <div className="help-step"><span className="help-number">4</span><div><strong>Record changes</strong><p>When a delivery arrives, a sale is made or something is damaged, record it. The shelf count updates automatically.</p></div></div>
            </div>
            <div className="help-tip"><Icon name="spark" size={15} /> Tip: the mic button lets you say things like “received 12 tins of beans”.</div>
            <div className="modal-footer">
              <button className="button button-quiet" onClick={() => setHelpModal(false)}>Close</button>
              {isAdmin ? (
                <button className="button button-dark" onClick={() => { setHelpModal(false); openProductEditor(); }}><Icon name="plus" size={15} /> Add a product</button>
              ) : (
                <button className="button button-dark" onClick={() => { setHelpModal(false); openAdminPanel(); }}><Icon name="lock" size={15} /> Unlock admin</button>
              )}
            </div>
          </section>
        </div>
      )}

      {productModal && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) setProductModal(false);
        }}>
          <section className="modal-card product-modal" role="dialog" aria-modal="true" aria-labelledby="product-title">
            <div className="modal-header"><div><div className="eyebrow">THE THINGS YOU SELL</div><h2 id="product-title">{editingProduct ? "A few product details." : "Add to the shelf."}</h2></div><button className="icon-button" aria-label="Close dialog" disabled={saving} onClick={() => setProductModal(false)}><Icon name="close" /></button></div>
            <p className="form-intro">Start with the basics: a name, category, price and how many you have. SKU is optional.</p>
            <form onSubmit={submitProduct}>
              <label className="form-field"><span>PRODUCT NAME</span><input autoFocus required maxLength={80} value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} placeholder="e.g. Long-life milk" /></label>
              <div className="form-row">
                <label className="form-field"><span>CATEGORY</span><input required maxLength={40} value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} placeholder="e.g. Groceries" /></label>
                <label className="form-field"><span>SKU <small>OPTIONAL</small></span><input maxLength={32} value={productForm.sku} onChange={(event) => setProductForm({ ...productForm, sku: event.target.value })} placeholder="Auto-generated if blank" /></label>
              </div>
              <div className="form-row three-fields">
                <label className="form-field"><span>SELLING PRICE ($)</span><input required type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} placeholder="0.00" /></label>
                <label className="form-field"><span>{editingProduct ? "CURRENT STOCK" : "IN STOCK"}</span><input required type="number" min="0" step="any" disabled={Boolean(editingProduct)} value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} placeholder="0" />{editingProduct && <small className="field-note">Use a stock action to change quantities and keep the history complete.</small>}</label>
                <label className="form-field"><span>UNIT</span><input required maxLength={12} value={productForm.unit} onChange={(event) => setProductForm({ ...productForm, unit: event.target.value })} placeholder="pcs" /></label>
              </div>
              <label className="form-field"><span>LOW-STOCK ALERT AT</span><input required type="number" min="0" step="any" value={productForm.lowStockAt} onChange={(event) => setProductForm({ ...productForm, lowStockAt: event.target.value })} /><small className="field-note">You’ll see a heads-up when stock reaches this amount.</small></label>
              <div className="modal-footer"><button type="button" className="button button-quiet" disabled={saving} onClick={() => setProductModal(false)}>Cancel</button><button type="submit" className="button button-dark" disabled={saving}>{saving ? "Saving…" : editingProduct ? "Save changes" : "Add product"} <Icon name="arrow" size={16} /></button></div>
            </form>
          </section>
        </div>
      )}

      {adminModal && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !adminBusy) closeAdminModal();
        }}>
          <section className="modal-card admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-title">
            <div className="modal-header">
              <div><div className="eyebrow">{isAdmin ? "OWNER ACCESS ACTIVE" : "OWNER ACCESS"}</div><h2 id="admin-title">{isAdmin ? "You are in control." : "Admin access."}</h2></div>
              <button className="icon-button" aria-label="Close dialog" disabled={adminBusy} onClick={closeAdminModal}><Icon name="close" /></button>
            </div>
            {isAdmin ? (
              <>
                <div className="admin-active-card">
                  <span className="admin-active-mark"><Icon name="check" size={20} /></span>
                  <div><strong>Admin mode is on.</strong><p>You can add, edit and remove products, and record every stock movement.</p></div>
                </div>
                <div className="admin-hint"><Icon name="lock" size={14} /> Customers can view the shop, but only you can change the stock.</div>
                <div className="modal-footer">
                  <button className="button button-quiet" onClick={closeAdminModal}>Close</button>
                  <button className="button button-outline" onClick={() => void exitAdminMode()}>Exit admin mode</button>
                </div>
              </>
            ) : (
              <form onSubmit={unlockAdmin}>
                <div className="admin-lock-mark"><Icon name="lock" size={22} /></div>
                <p className="admin-modal-copy">Enter your owner password to add or remove stock. Everything stays view-only until you unlock admin mode.</p>
                <label className="form-field"><span>ADMIN PASSWORD</span><input autoFocus required type="password" autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="Enter your password" /></label>
                {adminError && <div className="error-banner" role="alert"><span>{adminError}</span></div>}
                <div className="admin-hint"><Icon name="lock" size={14} /> Only the shop owner can add or remove stock.</div>
                <div className="modal-footer">
                  <button type="button" className="button button-quiet" disabled={adminBusy} onClick={closeAdminModal}>Cancel</button>
                  <button type="submit" className="button button-dark" disabled={adminBusy}>{adminBusy ? "Checking…" : "Unlock admin"} <Icon name="arrow" size={16} /></button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status"><span className="toast-mark"><Icon name={loadError ? "damage" : "check"} size={16} /></span>{toast}</div>}
    </div>
  );
}

function ProductAvatar({ product }: { product: Product }) {
  const colors = ["avatar-mint", "avatar-peach", "avatar-sky", "avatar-lilac", "avatar-yellow"];
  const color = colors[product.name.length % colors.length];
  return <span className={`product-avatar ${color}`}>{product.name.slice(0, 1).toUpperCase()}</span>;
}

function ProductCell({ product }: { product: Product }) {
  return <div className="product-cell"><ProductAvatar product={product} /><div><strong>{product.name}</strong><span>{product.category}</span></div></div>;
}

function StockBadge({ product }: { product: Product }) {
  const low = product.stock <= product.lowStockAt;
  return <span className={`stock-badge ${low ? "stock-badge-low" : "stock-badge-good"}`}><i />{low ? "Running low" : "In stock"}</span>;
}

function EmptyState({ title, detail, onClick }: { title: string; detail: string; onClick?: () => void }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name="box" size={21} /></span><strong>{title}</strong><p>{detail}</p>{onClick && <button className="button button-dark" onClick={onClick}><Icon name="plus" size={16} /> Add a product</button>}</div>;
}

function ActivityList({ transactions, showAll = false }: { transactions: Transaction[]; showAll?: boolean }) {
  if (!transactions.length) {
    return <div className="activity-empty"><span className="empty-icon"><Icon name="clock" size={19} /></span><strong>No stock changes yet.</strong><p>When you record a delivery, sale or write-off, it’ll appear here.</p></div>;
  }
  return <div className={`activity-list ${showAll ? "activity-list-all" : ""}`}>{transactions.map((item) => (
    <div className="activity-item" key={item.id}>
      <span className={`activity-icon activity-${item.type}`}><Icon name={transactionIcon(item.type)} size={16} /></span>
      <div className="activity-copy"><strong>{item.productName}</strong><span>{typeLabel(item.type)}{item.note ? ` · ${item.note}` : ""}</span></div>
      <div className={`activity-quantity ${item.type === "received" ? "quantity-in" : "quantity-out"}`}>{item.type === "received" ? "+" : "−"}{number.format(item.quantity)}<span> {item.type === "received" ? "in" : "out"}</span></div>
      <time>{formatTime(item.createdAt)}</time>
    </div>
  ))}</div>;
}
