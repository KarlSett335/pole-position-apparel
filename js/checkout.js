const DB_KEY = "ppa_admin_db_v1";
const CART_KEY = "ppa_cart_v1";

const $ = (id) => document.getElementById(id);

function money(n) {
    return Number(n || 0).toLocaleString("es-BO");
}

function safeJSON(raw, fallback) {
    try {
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function readCart() {
    const data = safeJSON(localStorage.getItem(CART_KEY), { items: [] });
    if (!data || typeof data !== "object") return { items: [] };
    if (!Array.isArray(data.items)) data.items = [];
    data.items = data.items
        .filter((it) => it && it.id != null)
        .map((it) => ({ id: it.id, qty: Math.max(1, Math.min(99, Number(it.qty || 1))) }));
    return data;
}

function writeCart(cart) {
    if (!cart || typeof cart !== "object") cart = { items: [] };
    if (!Array.isArray(cart.items)) cart.items = [];
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

function cartCount(cart) {
    return (cart.items || []).reduce((sum, it) => sum + Number(it.qty || 0), 0);
}

function updateCartBadge() {
    const cart = readCart();
    const count = String(cartCount(cart));

    const badgeById = document.getElementById("cartCount");
    if (badgeById) badgeById.textContent = count;

    const cartLink = Array.from(document.querySelectorAll("a.nav-pill")).find((a) =>
        a.textContent.toLowerCase().includes("carrito")
    );
    if (cartLink) {
        const badge = cartLink.querySelector(".badge-lux");
        if (badge) badge.textContent = count;
    }
}

function loadDB() {
    const db = safeJSON(localStorage.getItem(DB_KEY), null);
    if (!db || typeof db !== "object") return null;
    if (!Array.isArray(db.products)) db.products = [];
    if (!Array.isArray(db.offers)) db.offers = [];
    if (!Array.isArray(db.orders)) db.orders = [];
    return db;
}

async function loadProducts() {
    const db = loadDB();
    if (db && Array.isArray(db.products) && db.products.length) return db.products;

    const r = await fetch("/data/products.json", { cache: "no-store" });
    const json = await r.json();
    return Array.isArray(json) ? json : [];
}

async function loadOffers() {
    const db = loadDB();
    if (db && Array.isArray(db.offers)) return db.offers;
    return [];
}

function onlyActive(products) {
    return (products || []).filter((p) => p && p.active !== false);
}

function activeOfferNow(offers) {
    const now = Date.now();
    const list = (offers || []).filter((o) => o && o.active);

    const valid = list.filter((o) => {
        const s = o.starts_at ? new Date(o.starts_at).getTime() : null;
        const e = o.ends_at ? new Date(o.ends_at).getTime() : null;
        const okStart = s ? now >= s : true;
        const okEnd = e ? now <= e : true;
        return okStart && okEnd;
    });

    valid.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return valid[0] || null;
}

function applyOffer(price, offer) {
    const p = Number(price || 0);
    if (!offer) return { final: p, discount: 0 };

    const v = Number(offer.value || 0);

    if (offer.type === "AMOUNT") {
        const final = Math.max(0, p - v);
        return { final, discount: p - final };
    }

    const final = Math.max(0, Math.round(p * (1 - v / 100)));
    return { final, discount: p - final };
}

function imgOf(p) {
    return p?.image_url || p?.image || "/assets/images/placeholder.jpg";
}

function uid(prefix = "ord") {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function setPayActive(pay) {
    document.querySelectorAll(".pay-option").forEach((b) => {
        b.classList.toggle("is-active", b.dataset.pay === pay);
    });
}

function renderPayBox(pay, total) {
    const box = $("payBox");
    const hint = $("hint");
    if (!box) return;

    if (pay === "QR") {
        box.innerHTML = `
      <div class="section-title">Pago por QR</div>
      <div class="small-muted mt-1">Escanea el QR para pagar. Luego presiona “Confirmar pedido”.</div>
      <div class="pdp-divider my-3"></div>
      <div class="small-muted">Monto: <b>${money(total)} BOB</b></div>
      <div class="small-muted mt-2">QR (demo):</div>
      <div class="hero-card mt-2" style="padding:16px">
        <div class="small-muted">Coloca aquí tu imagen QR (por banco).</div>
      </div>
    `;
        if (hint) hint.textContent = "Tip: en producción, el QR lo generas desde tu pasarela/banco.";
        return;
    }

    if (pay === "TIENDA") {
        box.innerHTML = `
      <div class="section-title">Pago en tienda</div>
      <div class="small-muted mt-1">Reserva tu pedido y paga al recoger.</div>
      <div class="pdp-divider my-3"></div>
      <div class="small-muted">Te contactaremos para coordinar entrega y pago.</div>
    `;
        if (hint) hint.textContent = "Se registrará el pedido como “Pendiente de pago”.";
        return;
    }

    box.innerHTML = `
    <div class="section-title">Pago con tarjeta</div>
    <div class="small-muted mt-1">Demo (no procesa cargos reales).</div>

    <div class="row g-2 mt-2">
      <div class="col-12">
        <input id="cardNumber" class="form-control" inputmode="numeric" placeholder="Número de tarjeta"
          aria-label="Número de tarjeta">
      </div>
      <div class="col-6">
        <input id="cardExp" class="form-control" placeholder="MM/AA" aria-label="Fecha de expiración">
      </div>
      <div class="col-6">
        <input id="cardCvv" class="form-control" inputmode="numeric" placeholder="CVV" aria-label="CVV">
      </div>
      <div class="col-12">
        <input id="cardName" class="form-control" placeholder="Nombre en la tarjeta" aria-label="Nombre en la tarjeta">
      </div>
    </div>
  `;
    if (hint) hint.textContent = "En producción, aquí integras pasarela (Visa/Mastercard).";
}

function validateCustomer() {
    const name = $("name")?.value?.trim() || "";
    const phone = $("phone")?.value?.trim() || "";
    const address = $("address")?.value?.trim() || "";
    return { ok: Boolean(name && phone && address), name, phone, address };
}

function validateCardIfNeeded(pay) {
    if (pay !== "TARJETA") return { ok: true };

    const num = ($("cardNumber")?.value || "").replace(/\s+/g, "");
    const exp = ($("cardExp")?.value || "").trim();
    const cvv = ($("cardCvv")?.value || "").trim();
    const holder = ($("cardName")?.value || "").trim();

    if (!num || num.length < 12) return { ok: false, msg: "Número de tarjeta inválido." };
    if (!/^\d{2}\/\d{2}$/.test(exp)) return { ok: false, msg: "Expiración inválida (MM/AA)." };
    if (!/^\d{3,4}$/.test(cvv)) return { ok: false, msg: "CVV inválido." };
    if (!holder) return { ok: false, msg: "Nombre en tarjeta requerido." };

    return { ok: true };
}

function ensureDB() {
    let db = loadDB();
    if (!db) {
        db = { products: [], offers: [], orders: [], staff: [], meta: {} };
    }
    if (!Array.isArray(db.orders)) db.orders = [];
    return db;
}

function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

(async () => {
    const year = $("y");
    if (year) year.textContent = new Date().getFullYear();

    updateCartBadge();

    const emptyEl = $("empty");
    const wrapEl = $("checkoutWrap");
    const successEl = $("success");
    const sumItems = $("sumItems");
    const subtotalEl = $("subtotal");
    const totalEl = $("total");
    const confirmBtn = $("confirm");

    const cart = readCart();

    if (!cart.items.length) {
        if (emptyEl) emptyEl.classList.remove("d-none");
        if (wrapEl) wrapEl.classList.add("d-none");
        return;
    }

    const products = onlyActive(await loadProducts());
    const offers = await loadOffers();
    const offer = activeOfferNow(offers);

    const lines = cart.items
        .map((it) => {
            const p = products.find((x) => String(x.id) === String(it.id));
            if (!p) return null;
            const qty = Number(it.qty || 1);
            const price = Number(p.price || 0);
            const off = applyOffer(price, offer);
            return {
                id: p.id,
                name: p.name,
                image: imgOf(p),
                qty,
                unit: off.final,
                unitBefore: price,
                discount: off.discount,
                category: p.category || "",
                team: p.team || "",
            };
        })
        .filter(Boolean);

    if (!lines.length) {
        if (emptyEl) emptyEl.classList.remove("d-none");
        if (wrapEl) wrapEl.classList.add("d-none");
        writeCart({ items: [] });
        return;
    }

    let subtotal = 0;
    lines.forEach((l) => (subtotal += l.unit * l.qty));

    if (sumItems) {
        sumItems.innerHTML = lines
            .map(
                (l) => `
        <div class="sum-item">
          <img class="sum-img" src="${l.image}" alt="">
          <div class="sum-main">
            <div class="sum-title">${l.name}</div>
            <div class="small-muted">${l.category}${l.team ? " · " + l.team : ""}</div>
            <div class="small-muted">Cantidad: <b>${l.qty}</b></div>
          </div>
          <div class="sum-price price">${money(l.unit * l.qty)} BOB</div>
        </div>
      `
            )
            .join("");
    }

    if (subtotalEl) subtotalEl.textContent = money(subtotal);
    if (totalEl) totalEl.textContent = money(subtotal);

    let pay = "QR";
    setPayActive(pay);
    renderPayBox(pay, subtotal);

    document.querySelectorAll(".pay-option").forEach((btn) => {
        btn.addEventListener("click", () => {
            pay = btn.dataset.pay || "QR";
            setPayActive(pay);
            renderPayBox(pay, subtotal);
        });
    });

    if (confirmBtn) {
        confirmBtn.addEventListener("click", () => {
            const c = validateCustomer();
            if (!c.ok) {
                const hint = $("hint");
                if (hint) hint.textContent = "Completa: nombre, teléfono y dirección.";
                return;
            }

            const cardOk = validateCardIfNeeded(pay);
            if (!cardOk.ok) {
                const hint = $("hint");
                if (hint) hint.textContent = cardOk.msg || "Verifica los datos de la tarjeta.";
                return;
            }

            const email = $("email")?.value?.trim() || "";

            const order = {
                id: uid("order"),
                created_at: new Date().toISOString(),
                status: pay === "QR" ? "PENDIENTE_QR" : pay === "TIENDA" ? "PENDIENTE_RETIRO" : "PENDIENTE_TARJETA",
                payment_method: pay,
                currency: "BOB",
                subtotal,
                total: subtotal,
                customer: { name: c.name, phone: c.phone, email, address: c.address },
                items: lines.map((l) => ({
                    id: l.id,
                    name: l.name,
                    qty: l.qty,
                    unit_price: l.unit,
                    line_total: l.unit * l.qty,
                })),
            };

            const db = ensureDB();
            db.orders.unshift(order);
            saveDB(db);

            writeCart({ items: [] });

            if (wrapEl) wrapEl.classList.add("d-none");
            if (successEl) successEl.classList.remove("d-none");
            updateCartBadge();
        });
    }
})();
