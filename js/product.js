import { PRODUCTS } from "./data.js";

document.getElementById("y").textContent = new Date().getFullYear();

const CART_KEY = "ppa_cart_v1";

function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}
function setCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
}
function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const el = document.getElementById("cartCount");
    if (el) el.textContent = String(count);
}
function addToCart(productId, qty) {
    const cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (item) item.qty += qty;
    else cart.push({ id: productId, qty });
    setCart(cart);
    updateCartCount();
}

function getIdFromURL() {
    const params = new URLSearchParams(location.search);
    return params.get("id");
}

function money(n) {
    return Number(n).toLocaleString("es-BO");
}

function card(p) {
    return `
  <div class="col-12 col-sm-6 col-lg-4">
    <a class="p-card d-block h-100" href="/product.html?id=${encodeURIComponent(p.id)}">
      <img class="p-img" src="${p.image}" alt="${p.name}">
      <div class="p-body">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div class="h5 mb-1">${p.name}</div>
          <span class="badge-lux">${p.category}</span>
        </div>
        <div class="small-muted mb-2">${p.team || "Pole Position"}</div>
        <div class="price">${p.price} BOB</div>
      </div>
    </a>
  </div>`;
}

updateCartCount();

const id = getIdFromURL();
const product = PRODUCTS.find(p => p.id === id);

if (!product) {
    document.querySelector("main").innerHTML = `
    <div class="container py-5">
      <div class="hero-card">
        <div class="section-title">No encontrado</div>
        <h1 class="h-title mt-2">Este producto no existe</h1>
        <a class="btn-lux mt-3" href="/shop.html">Volver a tienda</a>
      </div>
    </div>`;
} else {
    const img = document.getElementById("img");
    const name = document.getElementById("name");
    const meta = document.getElementById("meta");
    const price = document.getElementById("price");
    const desc = document.getElementById("desc");
    const crumb = document.getElementById("crumb");

    img.src = product.image;
    img.alt = product.name;

    name.textContent = product.name;
    meta.textContent = `${product.team || "Pole Position"} · ${product.category}`;
    price.textContent = money(product.price);
    crumb.textContent = product.category;

    desc.textContent = product.desc || "Diseño premium, inspirado en la estética del motorsport.";

    const qtyInput = document.getElementById("qty");
    const minus = document.getElementById("minus");
    const plus = document.getElementById("plus");
    const addBtn = document.getElementById("add");

    function clampQty(v) {
        const n = Math.max(1, Math.min(99, Number(v) || 1));
        return n;
    }

    function setQty(v) {
        qtyInput.value = String(clampQty(v));
    }

    minus.addEventListener("click", () => setQty(clampQty(qtyInput.value) - 1));
    plus.addEventListener("click", () => setQty(clampQty(qtyInput.value) + 1));
    qtyInput.addEventListener("input", () => setQty(qtyInput.value));

    addBtn.addEventListener("click", () => {
        const qty = clampQty(qtyInput.value);
        addToCart(product.id, qty);
        addBtn.textContent = "Añadido ✓";
        setTimeout(() => { addBtn.textContent = "Añadir al carrito"; }, 900);
    });

    const related = PRODUCTS
        .filter(p => p.id !== product.id)
        .filter(p => p.category === product.category || p.team === product.team)
        .slice(0, 6);

    document.getElementById("related").innerHTML = related.map(card).join("");
}
