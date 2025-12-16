document.getElementById("y").textContent = new Date().getFullYear();

const ORDERS_KEY = "ppa_orders_v1";

const list = document.getElementById("list");
const empty = document.getElementById("empty");
const meta = document.getElementById("meta");

const q = document.getElementById("q");
const exportBtn = document.getElementById("export");
const wipeBtn = document.getElementById("wipe");

let selectedStatus = "all";
let activeOrderId = null;

function getOrders() {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
}
function setOrders(items) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(items));
}
function money(n) {
    return Number(n).toLocaleString("es-BO");
}
function normalize(s) {
    return String(s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
}

function statusLabel(s) {
    if (s === "PAID") return "Pagado";
    if (s === "CANCELLED") return "Cancelado";
    if (s === "PENDING_PAYMENT") return "Pendiente de pago";
    return s || "Pendiente";
}

function badgeStatusClass(s) {
    if (s === "PAID") return "is-paid";
    if (s === "CANCELLED") return "is-cancelled";
    return "is-pending";
}

function card(o) {
    const customer = o.customer?.name || "—";
    const phone = o.customer?.phone || "—";
    const when = o.created_at ? new Date(o.created_at).toLocaleString() : "—";
    const ref = o.payment_ref ? `Ref: ${o.payment_ref}` : "Ref: —";

    return `
    <button type="button" class="admin-row" data-open="${o.id}">
      <div class="admin-left">
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <div class="admin-id">${o.id}</div>
          <span class="badge-lux admin-badge ${badgeStatusClass(o.status)}">${statusLabel(o.status)}</span>
          <span class="badge-lux admin-badge">${o.payment_method || "—"}</span>
          <span class="badge-lux admin-badge">${ref}</span>
        </div>
        <div class="small-muted mt-1">${customer} · ${phone}</div>
        <div class="small-muted">${when}</div>
      </div>

      <div class="admin-right">
        <div class="price">${money(o.total || 0)} BOB</div>
        <div class="small-muted">${(o.items?.length || 0)} item(s)</div>

        <div class="d-flex gap-2 justify-content-end mt-2 flex-wrap">
          <button type="button" class="btn-lux btn-sm px-3" data-pay="${o.id}">Marcar pagado</button>
          <button type="button" class="btn-lux btn-sm px-3" data-cancel="${o.id}">Cancelar</button>
        </div>
      </div>
    </button>
  `;
}

function render() {
    const orders = getOrders();
    const text = normalize(q.value);

    let filtered = [...orders];

    if (selectedStatus !== "all") filtered = filtered.filter(o => o.status === selectedStatus);

    if (text) {
        filtered = filtered.filter(o => {
            const hay = normalize(
                `${o.id} ${o.payment_ref || ""} ${o.payment_method || ""} ${o.customer?.name || ""} ${o.customer?.phone || ""} ${o.customer?.email || ""}`
            );
            return hay.includes(text);
        });
    }

    meta.textContent = `${filtered.length} pedido(s)`;

    if (filtered.length === 0) {
        empty.classList.remove("d-none");
        list.innerHTML = "";
    } else {
        empty.classList.add("d-none");
        list.innerHTML = filtered.map(card).join("");
    }

    document.querySelectorAll("[data-open]").forEach(b => {
        b.addEventListener("click", (e) => {
            if (e.target?.dataset?.pay || e.target?.dataset?.cancel) return;
            openModal(b.dataset.open);
        });
    });

    document.querySelectorAll("[data-pay]").forEach(btn => {
        btn.addEventListener("click", () => setStatus(btn.dataset.pay, "PAID"));
    });

    document.querySelectorAll("[data-cancel]").forEach(btn => {
        btn.addEventListener("click", () => setStatus(btn.dataset.cancel, "CANCELLED"));
    });
}

function setStatus(id, status) {
    const orders = getOrders();
    const o = orders.find(x => x.id === id);
    if (!o) return;
    o.status = status;
    setOrders(orders);
    render();
}

function download(filename, text) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

exportBtn.addEventListener("click", () => {
    download("orders.json", JSON.stringify(getOrders(), null, 2));
});

wipeBtn.addEventListener("click", () => {
    setOrders([]);
    render();
});

q.addEventListener("input", render);

function setupLuxSelect(name, onChange) {
    const root = document.querySelector(`.lux-select[data-select="${name}"]`);
    if (!root) return;

    const btn = root.querySelector(".lux-select-btn");
    const label = root.querySelector(".lux-select-label");
    const opts = [...root.querySelectorAll(".lux-option")];

    function closeAll() {
        document.querySelectorAll(".lux-select.open").forEach(el => {
            el.classList.remove("open");
            const b = el.querySelector(".lux-select-btn");
            if (b) b.setAttribute("aria-expanded", "false");
        });
    }

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = root.classList.contains("open");
        closeAll();
        root.classList.toggle("open", !isOpen);
        btn.setAttribute("aria-expanded", String(!isOpen));
    });

    opts.forEach(o => {
        o.addEventListener("click", () => {
            opts.forEach(x => x.classList.remove("is-active"));
            o.classList.add("is-active");
            label.textContent = o.textContent.trim();
            root.classList.remove("open");
            btn.setAttribute("aria-expanded", "false");
            onChange(o.dataset.value);
            render();
        });
    });

    document.addEventListener("click", closeAll);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
}

setupLuxSelect("status", (v) => { selectedStatus = v; });

const modal = document.getElementById("modal");
const mTitle = document.getElementById("mTitle");
const mSub = document.getElementById("mSub");
const mCustomer = document.getElementById("mCustomer");
const mContact = document.getElementById("mContact");
const mAddress = document.getElementById("mAddress");
const mPay = document.getElementById("mPay");
const mItems = document.getElementById("mItems");
const mTotal = document.getElementById("mTotal");
const mDelete = document.getElementById("mDelete");

function openModal(id) {
    const orders = getOrders();
    const o = orders.find(x => x.id === id);
    if (!o) return;

    activeOrderId = id;

    mTitle.textContent = o.id;
    mSub.textContent = o.created_at ? new Date(o.created_at).toLocaleString() : "—";

    mCustomer.textContent = o.customer?.name || "—";
    mContact.textContent = `${o.customer?.phone || "—"}${o.customer?.email ? " · " + o.customer.email : ""}`;
    mAddress.textContent = o.customer?.address || "—";

    const ref = o.payment_ref ? ` · Ref: ${o.payment_ref}` : "";
    mPay.textContent = `${o.payment_method || "—"} · ${statusLabel(o.status)}${ref}`;

    mItems.innerHTML = (o.items || []).map(it => `
    <div class="admin-item">
      <div>
        <div class="admin-strong">${it.name}</div>
        <div class="small-muted">x${it.qty} · ${money(it.unit_price)} BOB</div>
      </div>
      <div class="price">${money(it.qty * it.unit_price)} BOB</div>
    </div>
  `).join("");

    mTotal.textContent = money(o.total || 0);

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    activeOrderId = null;
}

modal.addEventListener("click", (e) => {
    if (e.target?.dataset?.close) closeModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
});

document.querySelectorAll("[data-status]").forEach(btn => {
    btn.addEventListener("click", () => {
        if (!activeOrderId) return;
        setStatus(activeOrderId, btn.dataset.status);
        openModal(activeOrderId);
    });
});

mDelete.addEventListener("click", () => {
    if (!activeOrderId) return;
    setOrders(getOrders().filter(o => o.id !== activeOrderId));
    closeModal();
    render();
});

render();
