import { PRODUCTS } from "./data.js";

document.getElementById("y").textContent = new Date().getFullYear();

const CART_KEY = "ppa_cart_v1";
const ORDERS_KEY = "ppa_orders_v1";

const empty = document.getElementById("empty");
const checkoutWrap = document.getElementById("checkoutWrap");
const success = document.getElementById("success");

const sumItems = document.getElementById("sumItems");
const subtotalEl = document.getElementById("subtotal");
const totalEl = document.getElementById("total");

const payBox = document.getElementById("payBox");
const hint = document.getElementById("hint");

const nameEl = document.getElementById("name");
const phoneEl = document.getElementById("phone");
const emailEl = document.getElementById("email");
const addressEl = document.getElementById("address");
const confirmBtn = document.getElementById("confirm");

let selectedPay = "QR";

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
function getOrders() {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
}
function setOrders(items) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(items));
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

function renderSummary(items) {
    if (items.length === 0) return;

    sumItems.innerHTML = items.map(it => `
    <div class="sum-row">
      <div class="sum-left">
        <div class="sum-name">${it.product.name}</div>
        <div class="small-muted">${it.product.team || "Pole Position"} · ${it.product.category} · x${it.qty}</div>
      </div>
      <div class="price">${money(it.line)} BOB</div>
    </div>
  `).join("");

    const subtotal = items.reduce((s, it) => s + it.line, 0);
    subtotalEl.textContent = money(subtotal);
    totalEl.textContent = money(subtotal);
}

function setPayUI(method) {
    selectedPay = method;
    document.querySelectorAll(".pay-option").forEach(b => b.classList.remove("is-active"));
    document.querySelector(`.pay-option[data-pay="${method}"]`)?.classList.add("is-active");

    if (method === "QR") {
        payBox.innerHTML = `
      <div class="pay-box-title">Paga con QR</div>
      <div class="small-muted mt-1">Escanea el código y confirma tu pago.</div>
      <div class="qr-wrap mt-3">
        <div class="qr-fake">QR</div>
        <div class="small-muted mt-2">Referencia: PPA-${Date.now().toString().slice(-6)}</div>
      </div>
    `;
        hint.textContent = "Luego podrás integrar una pasarela real. Por ahora guardamos el pedido para tu demo.";
    }

    if (method === "TIENDA") {
        payBox.innerHTML = `
      <div class="pay-box-title">Pago en tienda</div>
      <div class="small-muted mt-1">Te contactaremos para coordinar la entrega y el pago.</div>
      <div class="small-muted mt-3">Horario sugerido: 10:00–18:00</div>
    `;
        hint.textContent = "Tu pedido quedará registrado para coordinación.";
    }

    if (method === "TARJETA") {
        payBox.innerHTML = `
      <div class="pay-box-title">Pago con tarjeta</div>
      <div class="small-muted mt-1">Visa · Mastercard</div>
      <div class="small-muted mt-3">Integración real en la siguiente fase.</div>
    `;
        hint.textContent = "Para la demo, el pedido se guarda y el estado queda pendiente.";
    }
}

function validate() {
    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const address = addressEl.value.trim();

    if (name.length < 3) return "Ingresa tu nombre completo.";
    if (phone.length < 6) return "Ingresa un teléfono válido.";
    if (address.length < 6) return "Ingresa una dirección o referencia.";
    return "";
}

function createOrder(items) {
    const subtotal = items.reduce((s, it) => s + it.line, 0);

    return {
        id: `PPA-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
        created_at: new Date().toISOString(),
        customer: {
            name: nameEl.value.trim(),
            phone: phoneEl.value.trim(),
            email: emailEl.value.trim(),
            address: addressEl.value.trim()
        },
        payment_method: selectedPay,
        status: "PENDING",
        items: items.map(it => ({
            id: it.product.id,
            name: it.product.name,
            qty: it.qty,
            unit_price: it.product.price
        })),
        total: subtotal
    };
}

const items = cartItemsDetailed();

if (items.length === 0) {
    empty.classList.remove("d-none");
    checkoutWrap.classList.add("d-none");
    success.classList.add("d-none");
} else {
    empty.classList.add("d-none");
    checkoutWrap.classList.remove("d-none");
    success.classList.add("d-none");

    renderSummary(items);
    updateCartCount();

    document.querySelectorAll(".pay-option").forEach(b => {
        b.addEventListener("click", () => setPayUI(b.dataset.pay));
    });
    setPayUI("QR");

    confirmBtn.addEventListener("click", () => {
        const msg = validate();
        if (msg) {
            hint.textContent = msg;
            return;
        }

        const order = createOrder(items);
        const orders = getOrders();
        orders.unshift(order);
        setOrders(orders);

        setCart([]);
        updateCartCount();

        checkoutWrap.classList.add("d-none");
        success.classList.remove("d-none");
    });
}
