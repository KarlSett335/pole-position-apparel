import { PRODUCTS } from "./data.js";

document.getElementById("y").textContent = new Date().getFullYear();

const CART_KEY = "ppa_cart_v1";
const ORDERS_KEY = "ppa_orders_v1";

// ⚠️ Cambia esto por tu WhatsApp (Bolivia): 591 + número (sin +, sin espacios)
const WHATSAPP_NUMBER = "59170000000";

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
      <div class="pay-box-title">Pago por QR</div>
      <div class="small-muted mt-1">Te enviaremos el QR por WhatsApp con tu referencia.</div>
      <div class="small-muted mt-2">Luego podrás enviar el comprobante por el mismo chat.</div>
    `;
        hint.textContent = "Recomendado: QR por WhatsApp para confirmar el pago rápidamente.";
    }

    if (method === "TIENDA") {
        payBox.innerHTML = `
      <div class="pay-box-title">Pago en tienda</div>
      <div class="small-muted mt-1">Reserva tu pedido y coordinamos por WhatsApp para entrega y pago.</div>
      <div class="small-muted mt-2">Horario sugerido: 10:00–18:00</div>
    `;
        hint.textContent = "Te contactaremos para coordinar el punto de entrega.";
    }

    if (method === "TARJETA") {
        payBox.innerHTML = `
      <div class="pay-box-title">Pago con tarjeta</div>
      <div class="small-muted mt-1">Visa · Mastercard</div>
      <div class="small-muted mt-2">En la siguiente fase se integra pasarela de pago (ej. MercadoPago/Stripe/PayPal).</div>
    `;
        hint.textContent = "Para la demo, el pedido se registra y queda pendiente de pago.";
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
    const paymentRef = `PPA-${Date.now().toString().slice(-6)}`;

    return {
        id: `PPA-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
        created_at: new Date().toISOString(),
        payment_ref: paymentRef,
        proof: "",
        customer: {
            name: nameEl.value.trim(),
            phone: phoneEl.value.trim(),
            email: emailEl.value.trim(),
            address: addressEl.value.trim()
        },
        payment_method: selectedPay,
        status: "PENDING_PAYMENT",
        items: items.map(it => ({
            id: it.product.id,
            name: it.product.name,
            qty: it.qty,
            unit_price: it.product.price
        })),
        total: subtotal
    };
}

function openWhatsApp(order) {
    const lines = order.items
        .map(it => `- ${it.name} x${it.qty}`)
        .join("\n");

    const text =
        `Hola, quiero confirmar mi pedido en Pole Position Apparel.\n\n` +
        `Pedido: ${order.id}\n` +
        `Método: ${order.payment_method}\n` +
        `Referencia: ${order.payment_ref}\n` +
        `Total: ${money(order.total)} BOB\n\n` +
        `Cliente: ${order.customer.name}\n` +
        `Teléfono: ${order.customer.phone}\n` +
        `Dirección: ${order.customer.address}\n\n` +
        `Items:\n${lines}\n\n` +
        `¿Me envían el QR / confirmamos la entrega?`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
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

        // ✅ Acciones por método de pago
        if (order.payment_method === "QR" || order.payment_method === "TIENDA") {
            openWhatsApp(order);
        } else {
            hint.textContent = "Pedido registrado. Pago con tarjeta se integra en la siguiente fase.";
        }
    });
}
