import { PRODUCTS } from "./data.js";

document.getElementById("y").textContent = new Date().getFullYear();

const CART_KEY = "ppa_cart_v1";

const list = document.getElementById("list");
const empty = document.getElementById("empty");
const subtotalEl = document.getElementById("subtotal");
const totalEl = document.getElementById("total");
const clearBtn = document.getElementById("clear");

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
function money(n) {
    return Number(n).toLocaleString("es-BO");
}

function cartItemsDetailed() {
    const cart = getCart();
    return cart
        .map(ci => {
            const p = PRODUCTS.find(x => x.id === ci.id);
            if (!p) return null;
            return { ...ci, product: p, line: p.price * ci.qty };
        })
        .filter(Boolean);
}

function clampQty(v) {
    const n = Math.max(1, Math.min(99, Number(v) || 1));
    return n;
}

function setQty(id, qty) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty = clampQty(qty);
    setCart(cart);
    render();
}

function removeItem(id) {
    setCart(getCart().filter(i => i.id !== id));
    render();
}

function clearCart() {
    setCart([]);
    render();
}

function row(item) {
    const p = item.product;
    return `
    <div class="cart-item">
      <a class="cart-imgwrap" href="/product.html?id=${encodeURIComponent(p.id)}">
        <img class="cart-img" src="${p.image}" alt="${p.name}">
      </a>

      <div class="cart-main">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div class="cart-name">${p.name}</div>
            <div class="small-muted">${p.team || "Pole Position"} · ${p.category}</div>
          </div>
          <button class="cart-remove" type="button" data-remove="${p.id}" aria-label="Quitar producto">×</button>
        </div>

        <div class="d-flex justify-content-between align-items-center gap-2 mt-2 flex-wrap">
          <div class="small-muted">${money(p.price)} BOB</div>

          <div class="cart-qty">
            <button type="button" class="qty-btn" data-minus="${p.id}" aria-label="Disminuir">−</button>
            <input class="qty-input" data-qty="${p.id}" value="${item.qty}" inputmode="numeric" aria-label="Cantidad">
            <button type="button" class="qty-btn" data-plus="${p.id}" aria-label="Aumentar">+</button>
          </div>

          <div class="price">${money(item.line)} BOB</div>
        </div>
      </div>
    </div>
  `;
}

function render() {
    const items = cartItemsDetailed();

    if (items.length === 0) {
        empty.classList.remove("d-none");
        list.innerHTML = "";
    } else {
        empty.classList.add("d-none");
        list.innerHTML = items.map(row).join("");
    }

    const subtotal = items.reduce((s, it) => s + it.line, 0);
    subtotalEl.textContent = money(subtotal);
    totalEl.textContent = money(subtotal);

    updateCartCount();

    document.querySelectorAll("[data-remove]").forEach(b => {
        b.addEventListener("click", () => removeItem(b.dataset.remove));
    });

    document.querySelectorAll("[data-minus]").forEach(b => {
        b.addEventListener("click", () => {
            const id = b.dataset.minus;
            const cart = getCart();
            const it = cart.find(i => i.id === id);
            if (!it) return;
            setQty(id, it.qty - 1);
        });
    });

    document.querySelectorAll("[data-plus]").forEach(b => {
        b.addEventListener("click", () => {
            const id = b.dataset.plus;
            const cart = getCart();
            const it = cart.find(i => i.id === id);
            if (!it) return;
            setQty(id, it.qty + 1);
        });
    });

    document.querySelectorAll("[data-qty]").forEach(inp => {
        inp.addEventListener("input", () => setQty(inp.dataset.qty, inp.value));
    });
}

clearBtn.addEventListener("click", clearCart);

render();
