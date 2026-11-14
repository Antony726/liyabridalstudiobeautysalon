import React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { supabase, requireSupabase } from "./lib/supabase";
import { imageUrl, money } from "./lib/format";
import {
  ShoppingBag, Search, Menu, X, Plus, Minus, Trash2, ArrowRight,
  Instagram, MessageCircle, ShieldCheck, Package, LayoutDashboard,
  Settings, Boxes, ClipboardList, LogOut, Upload, Pencil, Check, AlertCircle
} from "lucide-react";

const fallbackProducts = [
  { id: "demo-1", name: "Pearl Hair Clip", category: "Hair Accessories", price: 149, sale_price: 119, stock: 25, description: "An elegant pearl-finish clip for everyday styling.", image_path: "" },
  { id: "demo-2", name: "Classic Gold Bangles", category: "Bangles", price: 299, sale_price: null, stock: 18, description: "A timeless accessory with a subtle golden finish.", image_path: "" },
  { id: "demo-3", name: "Velvet Scrunchie Set", category: "Hair Accessories", price: 199, sale_price: 169, stock: 32, description: "Soft-touch scrunchies in versatile everyday shades.", image_path: "" },
  { id: "demo-4", name: "Everyday Lip Colour", category: "Cosmetics", price: 249, sale_price: null, stock: 14, description: "A comfortable colour for your everyday look.", image_path: "" }
];

const defaultSettings = {
  store_name: "Keepa", tagline: "A little something beautiful.", whatsapp_number: "",
  instagram_url: "", contact_email: "", currency: "INR", announcement: "A little luxury, every day."
};

function useStore() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!supabase) {
      setProducts(fallbackProducts);
      setCategories(["All", "Cosmetics", "Bangles", "Hair Accessories", "Jewellery"]);
      setLoading(false);
      return;
    }
    const [p, c, s] = await Promise.all([
      supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("store_settings").select("*").eq("id", 1).maybeSingle()
    ]);
    if (!p.error) setProducts(p.data || []);
    if (!c.error) setCategories(["All", ...(c.data || []).map(x => x.name)]);
    if (s.data) setSettings({ ...defaultSettings, ...s.data });
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);
  return { products, categories, settings, loading, refresh, setSettings };
}

function Header({ settings, cartCount }) {
  const [open, setOpen] = useState(false);
  return <header className="site-header">
    <div className="topline">{settings.announcement || "A little luxury, every day."}</div>
    <div className="nav wrap">
      <button className="icon-btn mobile-only" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X/> : <Menu/>}</button>
      <Link to="/" className="brand">{settings.store_name || "Keepa"}<span>.</span></Link>
      <nav className={open ? "nav-links open" : "nav-links"}>
        <Link onClick={() => setOpen(false)} to="/">Home</Link>
        <a onClick={() => setOpen(false)} href="/#shop">Shop</a>
        <a onClick={() => setOpen(false)} href="/#about">Our story</a>
      </nav>
      <Link className="cart-link" to="/cart"><ShoppingBag size={19}/><span>Bag ({cartCount})</span></Link>
    </div>
  </header>;
}

function ProductCard({ product, add, currency }) {
  const [added, setAdded] = useState(false);
  const src = imageUrl(product.image_path);
  return <article className="product-card">
    <div className="product-image">
      {src ? <img src={src} alt={product.name}/> : <div className="image-placeholder"><ShoppingBag size={30}/><span>KEEPA</span></div>}
      {product.sale_price && <span className="sale-tag">SPECIAL PRICE</span>}
      <button className="quick-add" onClick={() => { add(product); setAdded(true); setTimeout(() => setAdded(false), 900); }}>
        {added ? <><Check size={15}/> Added</> : <><Plus size={15}/> Add to bag</>}
      </button>
    </div>
    <div className="product-meta"><span>{product.category || "Accessories"}</span><span>{Number(product.stock) > 0 ? "In stock" : "Sold out"}</span></div>
    <h3>{product.name}</h3>
    <div className="price-line">
      <strong>{money(product.sale_price || product.price, currency)}</strong>
      {product.sale_price && <del>{money(product.price, currency)}</del>}
    </div>
  </article>;
}

function Storefront({ store, cart, setCart }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const add = (p) => setCart(old => {
    const found = old.find(x => x.id === p.id);
    return found ? old.map(x => x.id === p.id ? { ...x, quantity: Math.min(x.quantity + 1, Number(p.stock || 99)) } : x)
      : [...old, { id: p.id, name: p.name, price: p.sale_price || p.price, quantity: 1, image_path: p.image_path, stock: p.stock }];
  });
  const filtered = useMemo(() => store.products.filter(p =>
    (category === "All" || p.category === category) &&
    `${p.name} ${p.category} ${p.description || ""}`.toLowerCase().includes(query.toLowerCase())
  ), [store.products, category, query]);

  return <>
    <section className="hero">
      <div className="hero-glow"></div>
      <div className="wrap hero-content">
        <p className="eyebrow">THE KEEPA EDIT · BEAUTY & ACCESSORIES</p>
        <h1>Everyday beauty.<br/><em>Elevated.</em></h1>
        <p className="hero-copy">{store.settings.tagline || "Discover little details that make every day feel special."}</p>
        <a className="button button-gold" href="#shop">Explore the collection <ArrowRight size={16}/></a>
        <div className="hero-note"><span className="gold-line"></span> Curated with care. Chosen by you.</div>
      </div>
      <div className="hero-stamp">K<br/><small>EST. 2026</small></div>
    </section>

    <section className="wrap collection-section" id="shop">
      <div className="section-heading">
        <div><p className="eyebrow">FIND YOUR FAVOURITES</p><h2>The collection<span>.</span></h2></div>
        <p>Thoughtful little finds, made part of your everyday.</p>
      </div>
      <div className="shop-tools">
        <div className="category-list">{store.categories.map(c => <button key={c} className={category === c ? "category active" : "category"} onClick={() => setCategory(c)}>{c}</button>)}</div>
        <label className="searchbox"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search the collection"/></label>
      </div>
      {store.loading ? <div className="empty-state">Loading collection…</div> : filtered.length ? <div className="product-grid">
        {filtered.map(p => <ProductCard key={p.id} product={p} add={add} currency={store.settings.currency}/>)}
      </div> : <div className="empty-state">No products found. Try another search or category.</div>}
    </section>

    <section className="story-section" id="about"><div className="wrap story-inner">
      <p className="eyebrow">A NOTE FROM KEEPA</p><h2>Small details.<br/><em>Beautiful feelings.</em></h2>
      <p>Explore a considered collection of cosmetics, accessories and little treasures selected to bring joy to your everyday.</p>
      <a href="#shop" className="text-link">Discover the collection <ArrowRight size={15}/></a>
    </div></section>
  </>;
}

function CartPage({ cart, setCart, settings }) {
  const navigate = useNavigate();
  const total = cart.reduce((n, x) => n + x.price * x.quantity, 0);
  const update = (id, delta) => setCart(old => old.map(x => x.id === id ? { ...x, quantity: Math.max(1, Math.min(x.quantity + delta, Number(x.stock || 99))) } : x));
  return <main className="wrap page-wrap">
    <p className="eyebrow">YOUR SELECTION</p><h1 className="page-title">Shopping bag<span>.</span></h1>
    {!cart.length ? <div className="empty-state">Your bag is waiting for something lovely. <Link to="/">Continue shopping</Link></div> :
      <div className="cart-layout"><div className="cart-items">{cart.map(item => <div className="cart-item" key={item.id}>
        <div className="cart-thumb">{imageUrl(item.image_path) ? <img src={imageUrl(item.image_path)} alt=""/> : <ShoppingBag/>}</div>
        <div className="cart-info"><h3>{item.name}</h3><p>{money(item.price, settings.currency)}</p><div className="qty"><button onClick={() => update(item.id, -1)}><Minus size={13}/></button><span>{item.quantity}</span><button onClick={() => update(item.id, 1)}><Plus size={13}/></button></div></div>
        <div className="cart-end"><strong>{money(item.price * item.quantity, settings.currency)}</strong><button className="icon-btn" onClick={() => setCart(old => old.filter(x => x.id !== item.id))}><Trash2 size={17}/></button></div>
      </div>)}</div>
      <aside className="summary-card"><h3>Order summary</h3><div className="summary-row"><span>Subtotal</span><strong>{money(total, settings.currency)}</strong></div><div className="summary-row"><span>Delivery</span><span>Confirmed by store</span></div><div className="summary-total"><span>Estimated total</span><strong>{money(total, settings.currency)}</strong></div><p className="muted small">Delivery charges, availability and payment will be confirmed by the store.</p><button className="button button-gold full" onClick={() => navigate("/checkout")}>Continue to details <ArrowRight size={16}/></button></aside></div>}
  </main>;
}

function Checkout({ cart, setCart, settings }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", pincode: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const total = cart.reduce((n, x) => n + x.price * x.quantity, 0);
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });

  async function placeOrder(e) {
    e.preventDefault(); setError("");
    if (!cart.length) return setError("Your cart is empty.");
    if (!settings.whatsapp_number) return setError("The store has not configured its WhatsApp number yet. Please contact the store.");
    setBusy(true);
    try {
      const client = requireSupabase();

      // Customer details from your existing form state
      const customerData = {
        name: form.name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        pincode: form.pincode,
        notes: form.notes || "",
      };

      // Cart items
      const items = cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      }));

      // Create order directly through Supabase RPC
      const { data: order, error: rpcError } = await client.rpc(
        "create_customer_order",
        {
          p_customer: customerData,
          p_items: items,
        }
      );

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      if (!order?.id) {
        throw new Error("Order was not created successfully.");
      }
      const lines = order.items.map(x => `• ${x.name} × ${x.quantity} — ${money(x.line_total, settings.currency)}`).join("\n");
      const message = `Hello ${settings.store_name || "Store"}! I would like to place an order.\n\nOrder ID: ${order.order_number}\nName: ${form.name}\nPhone: ${form.phone}\n\nItems:\n${lines}\n\nSubtotal: ${money(order.total, settings.currency)}\nAddress: ${form.address}, ${form.city} - ${form.pincode}\n${form.notes ? `Notes: ${form.notes}\n` : ""}\nPlease confirm availability, delivery charges and payment. Thank you!`;
      const phone = settings.whatsapp_number.replace(/\D/g, "");
      setCart([]);
      window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      navigate(`/order-received/${order.order_number}`);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  return <main className="wrap page-wrap narrow"><p className="eyebrow">ALMOST YOURS</p><h1 className="page-title">Delivery details<span>.</span></h1>
    <form className="form-card" onSubmit={placeOrder}>
      <div className="form-grid"><label>Full name<input name="name" required value={form.name} onChange={change} maxLength="100"/></label>
      <label>Mobile number<input name="phone" required value={form.phone} onChange={change} inputMode="tel" pattern="[0-9+\\- ]{8,18}" maxLength="18"/></label>
      <label className="span-2">Delivery address<textarea name="address" required value={form.address} onChange={change} maxLength="500"/></label>
      <label>City<input name="city" required value={form.city} onChange={change} maxLength="100"/></label>
      <label>PIN code<input name="pincode" required value={form.pincode} onChange={change} pattern="[0-9]{6}" maxLength="6" inputMode="numeric"/></label>
      <label className="span-2">Order notes (optional)<textarea name="notes" value={form.notes} onChange={change} maxLength="500" placeholder="Any preferences or delivery instructions?"/></label></div>
      <div className="checkout-total"><span>Estimated total</span><strong>{money(total, settings.currency)}</strong></div>
      <p className="muted small">Your order will be saved on this website first. WhatsApp will then open with the order summary. You must press Send in WhatsApp. The store will contact you to confirm the order and payment manually.</p>
      {error && <p className="error-text"><AlertCircle size={16}/>{error}</p>}
      <button className="button button-gold full" disabled={busy}>{busy ? "Creating order…" : "Place order & open WhatsApp"} <MessageCircle size={17}/></button>
    </form>
  </main>;
}

function Received({ number }) {
  return <main className="wrap page-wrap narrow"><div className="success-card"><div className="success-icon"><Check/></div><p className="eyebrow">ORDER CREATED</p><h1>Thank you<span>.</span></h1><p>Your order reference is <strong>{number}</strong>.</p><p className="muted">WhatsApp should open with your order summary. Please press Send to share it with the store. The store will contact you to confirm availability, delivery and payment.</p><Link className="button button-gold" to="/">Continue shopping</Link></div></main>;
}

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    const { data, error: err } = await requireSupabase().auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    else {
      const role = data.user?.app_metadata?.role;
      if (role !== "admin") { await supabase.auth.signOut(); setError("This account does not have administrator access."); }
      else onLogin(data.user);
    }
    setBusy(false);
  }
  return <main className="admin-login"><form className="login-card" onSubmit={submit}><div className="brand login-brand">Keepa<span>.</span></div><p className="eyebrow">PRIVATE STORE ACCESS</p><h1>Welcome back.</h1><label>Email address<input type="email" required value={email} onChange={e => setEmail(e.target.value)}/></label><label>Password<input type="password" required value={password} onChange={e => setPassword(e.target.value)}/></label>{error && <p className="error-text">{error}</p>}<button className="button button-gold full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button><Link className="muted small back-link" to="/">← Back to store</Link></form></main>;
}

function Admin({ settings, refreshStore }) {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("overview");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [storeSettings, setStoreSettings] = useState(settings);
  const [categories, setCategories] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null);

  async function loadAdmin() {
    const client = requireSupabase();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user || auth.user.app_metadata?.role !== "admin") { setUser(null); return; }
    setUser(auth.user);
    const [p, o, s, c] = await Promise.all([
      client.from("products").select("*").order("created_at", { ascending: false }),
      client.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(200),
      client.from("store_settings").select("*").eq("id", 1).maybeSingle(),
      client.from("categories").select("*").order("name")
    ]);
    if (!p.error) setProducts(p.data || []);
    if (!o.error) setOrders(o.data || []);
    if (s.data) setStoreSettings({ ...defaultSettings, ...s.data });
    if (!c.error) setCategories(c.data || []);
  }
  useEffect(() => { loadAdmin(); }, []);

  async function logout() { await supabase.auth.signOut(); setUser(null); }
  async function saveSettings(e) {
    e.preventDefault(); setBusy(true); setNotice("");
    const { error } = await requireSupabase().from("store_settings").upsert({ id: 1, ...storeSettings, updated_at: new Date().toISOString() });
    setNotice(error ? error.message : "Store settings saved."); if (!error) refreshStore(); setBusy(false);
  }
  async function saveProduct(e) {
    e.preventDefault(); setBusy(true); setNotice("");
    const fd = new FormData(e.currentTarget);
    const file = fd.get("image");
    let image_path = editing?.image_path || null;
    if (file && file.size) {
      const ext = file.name.split(".").pop().toLowerCase();
      if (!["jpg", "jpeg", "png", "webp"].includes(ext) || file.size > 5 * 1024 * 1024) {
        setNotice("Use JPG, PNG or WebP images up to 5 MB."); setBusy(false); return;
      }
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await requireSupabase().storage.from("product-images").upload(path, file, { upsert: false });
      if (uploadError) { setNotice(uploadError.message); setBusy(false); return; }
      image_path = path;
    }
    const payload = {
      name: fd.get("name"), category: fd.get("category"), description: fd.get("description"),
      price: Number(fd.get("price")), sale_price: fd.get("sale_price") ? Number(fd.get("sale_price")) : null,
      stock: Number(fd.get("stock")), is_active: fd.get("is_active") === "on", image_path
    };
    
    const query = editing?.id
      ? requireSupabase()
          .from("products")
          .update(payload)
          .eq("id", editing.id)
      : requireSupabase()
          .from("products")
          .insert(payload);

    const { error } = await query;
    setNotice(error ? error.message : "Product saved.");
    if (!error) { setEditing(null); await loadAdmin(); refreshStore(); }
    setBusy(false);
  }
  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    const { error } = await requireSupabase().from("products").delete().eq("id", id);
    setNotice(error ? error.message : "Product deleted."); if (!error) { loadAdmin(); refreshStore(); }
  }
  async function updateOrder(id, patch) {
    const { error } = await requireSupabase().from("orders").update(patch).eq("id", id);
    setNotice(error ? error.message : "Order updated."); if (!error) loadAdmin();
  }
  async function addCategory(e) {
    e.preventDefault(); const name = new FormData(e.currentTarget).get("name")?.trim();
    if (!name) return;
    const { error } = await requireSupabase().from("categories").insert({ name });
    setNotice(error ? error.message : "Category added."); if (!error) { e.currentTarget.reset(); loadAdmin(); refreshStore(); }
  }

  if (!user) return <AdminLogin onLogin={u => { setUser(u); loadAdmin(); }}/>;
  const revenue = orders.filter(o => o.payment_status === "paid" && o.status !== "cancelled").reduce((n, o) => n + Number(o.total), 0);
  const pending = orders.filter(o => !["delivered", "cancelled"].includes(o.status)).length;
  const nav = [{ id: "overview", label: "Overview", icon: LayoutDashboard }, { id: "products", label: "Products", icon: Boxes }, { id: "orders", label: "Orders", icon: ClipboardList }, { id: "categories", label: "Categories", icon: Package }, { id: "settings", label: "Store settings", icon: Settings }];
  return <div className="admin-shell">
    <aside className="admin-sidebar"><Link to="/" className="brand">Keepa<span>.</span></Link><p className="eyebrow">STORE MANAGEMENT</p><nav>{nav.map(n => <button key={n.id} className={tab === n.id ? "admin-nav active" : "admin-nav"} onClick={() => { setTab(n.id); setEditing(null); }}><n.icon size={17}/>{n.label}</button>)}</nav><div className="sidebar-bottom"><span className="muted small">{user.email}</span><button className="admin-nav" onClick={logout}><LogOut size={17}/>Sign out</button><Link to="/" className="muted small">← View storefront</Link></div></aside>
    <main className="admin-main"><div className="admin-top"><div><p className="eyebrow">KEEPA / ADMIN</p><h1>{nav.find(n => n.id === tab)?.label}</h1></div><span className="admin-chip"><ShieldCheck size={15}/> Admin access</span></div>
      {notice && <div className="notice">{notice}<button onClick={() => setNotice("")}><X size={15}/></button></div>}
      {tab === "overview" && <><div className="stats-grid"><Stat label="Total orders" value={orders.length}/><Stat label="Confirmed revenue" value={money(revenue, storeSettings.currency)}/><Stat label="Active products" value={products.filter(p => p.is_active).length}/><Stat label="Open orders" value={pending}/></div><section className="admin-panel"><div className="panel-head"><h2>Recent orders</h2><button className="text-link" onClick={() => setTab("orders")}>View all <ArrowRight size={14}/></button></div><OrderTable orders={orders.slice(0, 6)} updateOrder={updateOrder}/></section><section className="admin-panel"><h2>Stock watch</h2><div className="simple-list">{products.filter(p => Number(p.stock) <= 5).slice(0, 8).map(p => <div key={p.id}><span>{p.name}</span><strong className="low-stock">{p.stock} left</strong></div>)}{products.every(p => Number(p.stock) > 5) && <p className="muted">No low-stock products.</p>}</div></section></>}
      {tab === "products" && <section className="admin-panel"><div className="panel-head"><h2>{editing?.id ? "Edit product" : "Add product"}</h2><button className="button button-gold" onClick={() => setEditing({})}><Plus size={16}/> Add product</button></div>
        {editing !== null && <form className="admin-form" onSubmit={saveProduct}><div className="form-grid"><label>Product name<input name="name" required defaultValue={editing.name || ""}/></label><label>Category<input name="category" required list="category-options" defaultValue={editing.category || ""}/><datalist id="category-options">{categories.map(c => <option key={c.id} value={c.name}/>)}</datalist></label><label>Price (₹)<input name="price" type="number" min="0" step="0.01" required defaultValue={editing.price || ""}/></label><label>Sale price (optional)<input name="sale_price" type="number" min="0" step="0.01" defaultValue={editing.sale_price || ""}/></label><label>Stock quantity<input name="stock" type="number" min="0" required defaultValue={editing.stock ?? 0}/></label><label>Product image<input name="image" type="file" accept="image/png,image/jpeg,image/webp"/></label><label className="span-2">Description<textarea name="description" defaultValue={editing.description || ""}/></label><label className="check-label"><input name="is_active" type="checkbox" defaultChecked={editing.is_active ?? true}/> Visible in store</label></div><div className="form-actions"><button className="button button-gold" disabled={busy}>{busy ? "Saving…" : "Save product"}</button><button type="button" className="button button-outline" onClick={() => setEditing(null)}>Cancel</button></div></form>}
        <div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>{products.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.category}</td><td>{money(p.sale_price || p.price, storeSettings.currency)}</td><td>{p.stock}</td><td><span className="status-pill">{p.is_active ? "Active" : "Hidden"}</span></td><td><button className="icon-btn" onClick={() => setEditing(p)}><Pencil size={16}/></button><button className="icon-btn danger" onClick={() => deleteProduct(p.id)}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>
      </section>}
      {tab === "orders" && <section className="admin-panel"><h2>All orders</h2><OrderTable orders={orders} updateOrder={updateOrder}/></section>}
      {tab === "categories" && <section className="admin-panel"><h2>Product categories</h2><form className="inline-form" onSubmit={addCategory}><input name="name" placeholder="New category name" required/><button className="button button-gold"><Plus size={15}/> Add category</button></form><div className="category-admin">{categories.map(c => <span key={c.id}>{c.name}</span>)}</div></section>}
      {tab === "settings" && <section className="admin-panel"><h2>Store identity & contact</h2><form className="admin-form" onSubmit={saveSettings}><div className="form-grid"><label>Store name<input value={storeSettings.store_name || ""} onChange={e => setStoreSettings({ ...storeSettings, store_name: e.target.value })} required/></label><label>Tagline<input value={storeSettings.tagline || ""} onChange={e => setStoreSettings({ ...storeSettings, tagline: e.target.value })}/></label><label>WhatsApp number<input value={storeSettings.whatsapp_number || ""} onChange={e => setStoreSettings({ ...storeSettings, whatsapp_number: e.target.value })} placeholder="91XXXXXXXXXX"/></label><label>Contact email<input type="email" value={storeSettings.contact_email || ""} onChange={e => setStoreSettings({ ...storeSettings, contact_email: e.target.value })}/></label><label>Instagram URL<input value={storeSettings.instagram_url || ""} onChange={e => setStoreSettings({ ...storeSettings, instagram_url: e.target.value })}/></label><label>Announcement bar<input value={storeSettings.announcement || ""} onChange={e => setStoreSettings({ ...storeSettings, announcement: e.target.value })}/></label><label>Currency<select value={storeSettings.currency || "INR"} onChange={e => setStoreSettings({ ...storeSettings, currency: e.target.value })}><option value="INR">INR – Indian Rupee</option></select></label></div><button className="button button-gold" disabled={busy}>{busy ? "Saving…" : "Save store settings"}</button></form></section>}
    </main>
  </div>;
}

function Stat({ label, value }) { return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>; }

function OrderTable({ orders, updateOrder }) {
  if (!orders.length) return <p className="muted">No orders yet.</p>;
  return <div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Order status</th></tr></thead><tbody>{orders.map(o => <tr key={o.id}><td><strong>{o.order_number}</strong><small>{new Date(o.created_at).toLocaleDateString("en-IN")}</small></td><td>{o.customer_name}<small>{o.phone}</small></td><td>{money(o.total)}</td><td><select value={o.payment_status} onChange={e => updateOrder(o.id, { payment_status: e.target.value })}><option value="pending">Pending</option><option value="paid">Paid</option><option value="refunded">Refunded</option></select></td><td><select value={o.status} onChange={e => updateOrder(o.id, { status: e.target.value })}>{["new","contacted","confirmed","processing","shipped","delivered","cancelled"].map(s => <option key={s} value={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div>;
}

export default function App() {
  const store = useStore();
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("keepa-cart") || "[]"); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem("keepa-cart", JSON.stringify(cart)); }, [cart]);
  return <div className="app">
    <Routes>
      <Route path="/admin/*" element={<Admin settings={store.settings} refreshStore={store.refresh}/>}/>
      <Route path="*" element={<><Header settings={store.settings} cartCount={cart.reduce((n, x) => n + x.quantity, 0)}/><Routes>
        <Route path="/" element={<Storefront store={store} cart={cart} setCart={setCart}/>}/>
        <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} settings={store.settings}/>}/>
        <Route path="/checkout" element={<Checkout cart={cart} setCart={setCart} settings={store.settings}/>}/>
        <Route path="/order-received/:number" element={<ReceivedRoute/>}/>
      </Routes><Footer settings={store.settings}/></>}/>
    </Routes>
  </div>;
}
function ReceivedRoute() { const { pathname } = window.location; return <Received number={decodeURIComponent(pathname.split("/").pop())}/>; }
function Footer({ settings }) {
  return <footer className="footer"><div className="wrap footer-inner"><div><div className="brand">{settings.store_name || "Keepa"}<span>.</span></div><p>{settings.tagline}</p></div><div className="footer-links">{settings.instagram_url && <a href={settings.instagram_url} target="_blank" rel="noreferrer"><Instagram size={17}/> Instagram</a>}<Link to="/admin">Store admin</Link></div><small>© {new Date().getFullYear()} {settings.store_name || "Keepa"}. All rights reserved.</small></div></footer>;
}
