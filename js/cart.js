import { loadProducts, onlyActive } from "./catalog.js";

const CART_KEY = "ppa_cart_v1";
const $ = (id) => document.getElementById(id);

function money(n) {
    return Number(n || 0).toLocaleString("es-BO");
}

function readCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : { items: [] };
    } catch {
        return { items: [] };
    }
}

function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function cartCount(cart) {
    return (cart.items || []).reduce((sum, it) => sum + Number(it.qty || 0), 0);
}

function imgOf(p) {
    return p?.image_url || p?.image || "/assets/images/placeholder.jpg";
}

function clampQty(v) {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(99, Math.floor(n));
}

function renderEmptyState(show) {
    const empty = $("empty");
    const list = $("list");
    if (!empty || !list) return;

    if (show) {
        empty.classList.remove("d-none");
        list.innerHTML = "";
    } else {
        empty.classList.add("d-none");
    }
}

function rowItem(product, qty) {
    const img = imgOf(product);
    const price = Number(product.price || 0);
    const subtotal = qty * price;

    return `
    <div class="cart-item">
      <img class="cart-img" src="${img}" alt="">
      <div class="cart-main">
        <div class="cart-title">${product.name}</div>
        <div class="small-muted">${product.category || ""}${product.team ? " · " + product.team : ""}</div>
        <div class="small-muted mt-1">Precio: ${money(price)} BOB</div>
      </div>

      <div class="cart-actions">
        <div class="cart-qty">
          <button type="button" class="qty-btn" data-act="dec" data-id="${product.id}">−</button>
          <input class="qty-input" data-act="input" data-id="${product.id}" value="${qty}" inputmode="numeric" />
          <button type="button" class="qty-btn" data-act="inc" data-id="${product.id}">+</button>
        </div>
        <div class="cart-price price">${money(subtotal)} BOB</div>
        <button type="button" class="cart-remove btn-lux btn-sm" data-act="del" data-id="${product.id}">Quitar</button>
      </div>
    </div>
  `;
}

(async () => {
    const year = $("y");
    if (year) year.textContent = new Date().getFullYear();

    const listEl = $("list");
    const subtotalEl = $("subtotal");
    const totalEl = $("total");
    const cartCountEl = $("cartCount");
    const clearBtn = $("clear");

    if (!listEl || !subtotalEl || !totalEl) return;

    const cart = readCart();

    // Cargar catálogo (admin/localStorage + fallback json)
    const products = onlyActive(await loadProducts());

    // Normalizar items inválidos
    cart.items = (cart.items || [])
        .filter(it => it && it.id != null && Number(it.qty || 0) > 0)
        .map(it => ({ id: it.id, qty: clampQty(it.qty) }));

    // Si el catálogo no tiene el producto, lo sacamos del carrito
    cart.items = cart.items.filter(it => products.some(p => String(p.id) === String(it.id)));

    writeCart(cart);

    // Badge count
    if (cartCountEl) cartCountEl.textContent = String(cartCount(cart));

    if (!cart.items.length) {
        renderEmptyState(true);
        subtotalEl.textContent = "0";
        totalEl.textContent = "0";
        return;
    }

    renderEmptyState(false);

    // Render lista + totales
    let subtotal = 0;
    listEl.innerHTML = cart.items.map(it => {
        const p = products.find(x => String(x.id) === String(it.id));
        if (!p) return "";
        const line = Number(p.price || 0) * Number(it.qty || 0);
        subtotal += line;
        return rowItem(p, Number(it.qty || 1));
    }).join("");

    subtotalEl.textContent = money(subtotal);
    totalEl.textContent = money(subtotal);

    // Eventos: + / - / quitar / escribir qty
    listEl.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        const act = btn.dataset.act;
        const id = btn.dataset.id;
        const item = cart.items.find(it => String(it.id) === String(id));
        if (!item) return;

        if (act === "inc") item.qty = clampQty(item.qty + 1);
        if (act === "dec") item.qty = clampQty(item.qty - 1);
        if (act === "del") cart.items = cart.items.filter(it => String(it.id) !== String(id));

        writeCart(cart);
        location.reload();
    });

    listEl.addEventListener("input", (e) => {
        const inp = e.target.closest("input");
        if (!inp) return;

        const id = inp.dataset.id;
        const item = cart.items.find(it => String(it.id) === String(id));
        if (!item) return;

        item.qty = clampQty(String(inp.value).replace(/\D/g, "") || "1");
        writeCart(cart);
    });

    listEl.addEventListener("change", () => {
        // recalcular sin reload para que sea rápido
        location.reload();
    });

    // Vaciar carrito
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            localStorage.setItem(CART_KEY, JSON.stringify({ items: [] }));
            location.reload();
        });
    }
})();
