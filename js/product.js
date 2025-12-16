import { loadProducts, onlyActive } from "./catalog.js";

const CART_KEY = "ppa_cart_v1";
const $ = (id) => document.getElementById(id);

function money(n) {
  return Number(n || 0).toLocaleString("es-BO");
}

function getProductId() {
  const url = new URL(window.location.href);
  return url.searchParams.get("id");
}

function imgOf(p) {
  return p?.image_url || p?.image || "/assets/images/placeholder.jpg";
}

function clampQty(v) {
  const n = Number(String(v).replace(/\D/g, ""));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(99, Math.floor(n));
}

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const data = raw ? JSON.parse(raw) : null;

    if (Array.isArray(data)) return { items: data };

    if (!data || typeof data !== "object") return { items: [] };

    if (!Array.isArray(data.items)) data.items = [];

    return data;
  } catch {
    return { items: [] };
  }
}

function cartCount(cart) {
  return (cart.items || []).reduce((sum, it) => sum + Number(it.qty || 0), 0);
}

function updateCartBadge() {
  const cart = readCart();
  const count = String(cartCount(cart));

  // Caso ideal: id="cartCount"
  const badgeById = document.getElementById("cartCount");
  if (badgeById) badgeById.textContent = count;

  // Fallback: busca badge dentro del link de Carrito
  const cartLink = Array.from(document.querySelectorAll("a.nav-pill"))
    .find(a => a.textContent.toLowerCase().includes("carrito"));

  if (cartLink) {
    const badge = cartLink.querySelector(".badge-lux");
    if (badge) badge.textContent = count;
  }
}

function writeCart(cart) {
  // Asegura el formato siempre
  if (!cart || typeof cart !== "object") cart = { items: [] };
  if (!Array.isArray(cart.items)) cart.items = [];

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function setNotFound() {
  document.body.innerHTML = `
    <nav class="navbar navbar-expand navbar-dark sticky-top">
      <div class="container py-2 d-flex align-items-center justify-content-between gap-2">
        <a class="brand text-truncate" href="/">POLE POSITION APPAREL</a>
        <div class="d-flex gap-2 flex-shrink-0">
          <a class="nav-pill" href="/shop.html">Tienda</a>
          <a class="nav-pill" href="/cart.html">Carrito <span class="ms-1 badge-lux">0</span></a>
        </div>
      </div>
    </nav>
    <main class="container py-5">
      <div class="hero-card">
        <div class="section-title">No encontrado</div>
        <h1 class="h-title mt-2">Este producto no existe</h1>
        <div class="mt-3">
          <a class="btn-lux" href="/shop.html">Volver a tienda</a>
        </div>
      </div>
    </main>
  `;
}

function setupQtyControls(maxStock) {
  const minus = $("minus");
  const plus = $("plus");
  const qty = $("qty");
  if (!minus || !plus || !qty) return;

  const set = (next) => {
    let v = clampQty(next);
    if (Number.isFinite(maxStock) && maxStock > 0) v = Math.min(v, maxStock);
    qty.value = String(v);
  };

  set(qty.value || 1);

  minus.addEventListener("click", () => set(Number(qty.value) - 1));
  plus.addEventListener("click", () => set(Number(qty.value) + 1));
  qty.addEventListener("input", () => set(qty.value));
  qty.addEventListener("blur", () => set(qty.value));
}

function renderRelated(current, products) {
  const el = $("related");
  if (!el) return;

  const list = (products || [])
    .filter((p) => String(p.id) !== String(current.id) && p.active !== false)
    .slice(0, 3);

  if (list.length === 0) {
    el.innerHTML = `<div class="small-muted mt-2">Sin recomendaciones por ahora.</div>`;
    return;
  }

  el.innerHTML = list
    .map((p) => {
      const img = imgOf(p);
      return `
        <div class="col-12 col-md-6 col-lg-4">
          <a class="product-card" href="/product.html?id=${encodeURIComponent(p.id)}">
            <img class="product-img" src="${img}" alt="">
            <div class="product-body">
              <div class="product-title">${p.name}</div>
              <div class="small-muted">${p.category || ""}${p.team ? " · " + p.team : ""}</div>
              <div class="price mt-2">${money(p.price)} BOB</div>
            </div>
          </a>
        </div>
      `;
    })
    .join("");
}

(async () => {
  const year = $("y");
  if (year) year.textContent = new Date().getFullYear();

  updateCartBadge();

  const id = getProductId();
  if (!id) return setNotFound();

  const products = onlyActive(await loadProducts());
  const product = products.find((p) => String(p.id) === String(id));
  if (!product) return setNotFound();

  const imgEl = $("img");
  const nameEl = $("name");
  const metaEl = $("meta");
  const priceEl = $("price");
  const descEl = $("desc");
  const crumbEl = $("crumb");

  if (imgEl) imgEl.src = imgOf(product);
  if (nameEl) nameEl.textContent = product.name || "";
  if (crumbEl) crumbEl.textContent = product.category || "";
  if (metaEl) metaEl.textContent = `${product.category || ""}${product.team ? " · " + product.team : ""}`;
  if (priceEl) priceEl.textContent = money(product.price);
  if (descEl) descEl.textContent = product.description || product.desc || "Merch premium inspirado en F1. Edición limitada.";

  const maxStock = Number(product.stock || 0);
  setupQtyControls(maxStock);

  const addBtn = $("add");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const qty = clampQty($("qty")?.value || 1);

      if (maxStock > 0 && qty > maxStock) {
        addBtn.textContent = "Stock insuficiente";
        setTimeout(() => (addBtn.textContent = "Añadir al carrito"), 1200);
        return;
      }

      const cart = readCart();
      const found = cart.items.find((it) => String(it.id) === String(product.id));

      if (found) found.qty += qty;
      else cart.items.push({ id: product.id, qty });

      writeCart(cart);

      addBtn.textContent = "Agregado ✓";
      setTimeout(() => (addBtn.textContent = "Añadir al carrito"), 1200);
    });
  }

  renderRelated(product, products);
})();
