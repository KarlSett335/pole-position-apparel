import { initDB, loadDB, saveDB, exportDB } from "../lib/store.js";
import { requireAuth, logout } from "../lib/auth.js";

requireAuth();
await initDB();

document.getElementById("logout").addEventListener("click", logout);

const q = document.getElementById("q");
const status = document.getElementById("status");
const pay = document.getElementById("pay");
const meta = document.getElementById("meta");
const empty = document.getElementById("empty");
const list = document.getElementById("list");
const exportBtn = document.getElementById("export");

const modal = document.getElementById("modal");
const mTitle = document.getElementById("mTitle");
const mSub = document.getElementById("mSub");
const mCustomer = document.getElementById("mCustomer");
const mContact = document.getElementById("mContact");
const mAddress = document.getElementById("mAddress");
const mStatus = document.getElementById("mStatus");
const mPayStatus = document.getElementById("mPayStatus");
const mPayMethod = document.getElementById("mPayMethod");
const mRef = document.getElementById("mRef");
const mProofOk = document.getElementById("mProofOk");
const mItems = document.getElementById("mItems");
const mTotal = document.getElementById("mTotal");
const mMsg = document.getElementById("mMsg");

const saveBtn = document.getElementById("save");
const markPaidBtn = document.getElementById("markPaid");
const rejectBtn = document.getElementById("rejectPay");
const waBtn = document.getElementById("wa");

let activeId = null;

function normalize(s) {
    return String(s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
}

function money(n) {
    return Number(n || 0).toLocaleString("es-BO");
}

function getDB() {
    return loadDB();
}

function setOrders(orders) {
    const db = getDB();
    db.orders = orders;
    saveDB(db);
}

function getOrders() {
    return getDB().orders || [];
}

function badgeStatus(s) {
    if (s === "PAID") return ["Pagado", "is-paid"];
    if (s === "SHIPPED") return ["Enviado", "is-paid"];
    if (s === "CANCELLED") return ["Cancelado", "is-cancelled"];
    return ["Pendiente", "is-pending"];
}

function badgePay(s) {
    if (s === "CONFIRMED") return ["Pago confirmado", "is-paid"];
    if (s === "REJECTED") return ["Pago rechazado", "is-cancelled"];
    return ["Pago pendiente", "is-pending"];
}

function row(o) {
    const [stLabel, stClass] = badgeStatus(o.status);
    const [psLabel, psClass] = badgePay(o.payment?.status);

    const customer = o.customer_snapshot?.name || "—";
    const phone = o.customer_snapshot?.phone || "—";
    const ref = o.payment?.ref ? `Ref ${o.payment.ref}` : "Ref —";
    const when = o.created_at ? new Date(o.created_at).toLocaleString("es-BO") : "—";
    const method = o.payment?.method || "—";

    return `
    <button type="button" class="admin-row" data-open="${o.id}">
      <div class="admin-left">
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <div class="admin-id">${o.id}</div>
          <span class="badge-lux admin-badge ${stClass}">${stLabel}</span>
          <span class="badge-lux admin-badge ${psClass}">${psLabel}</span>
          <span class="badge-lux admin-badge">${method}</span>
          <span class="badge-lux admin-badge">${ref}</span>
        </div>
        <div class="small-muted mt-1">${customer} · ${phone}</div>
        <div class="small-muted">${when}</div>
      </div>

      <div class="admin-right">
        <div class="price">${money(o.total)} BOB</div>
        <div class="small-muted">${(o.items || []).length} item(s)</div>
      </div>
    </button>
  `;
}

function render() {
    const orders = getOrders();
    const text = normalize(q.value);
    const st = status.value;
    const pm = pay.value;

    let filtered = [...orders];

    if (st !== "all") filtered = filtered.filter(o => o.status === st);
    if (pm !== "all") filtered = filtered.filter(o => (o.payment?.method || "") === pm);

    if (text) {
        filtered = filtered.filter(o => {
            const hay = normalize(
                `${o.id} ${o.payment?.ref || ""} ${o.customer_snapshot?.name || ""} ${o.customer_snapshot?.phone || ""} ${o.customer_snapshot?.address || ""}`
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
        list.innerHTML = filtered.map(row).join("");
    }

    document.querySelectorAll("[data-open]").forEach(b => {
        b.addEventListener("click", () => openModal(b.dataset.open));
    });
}

function openModal(id) {
    const o = getOrders().find(x => x.id === id);
    if (!o) return;

    activeId = id;
    mMsg.textContent = "";

    mTitle.textContent = o.id;
    mSub.textContent = o.created_at ? new Date(o.created_at).toLocaleString("es-BO") : "—";

    mCustomer.textContent = o.customer_snapshot?.name || "—";
    mContact.textContent = `${o.customer_snapshot?.phone || "—"}${o.customer_snapshot?.email ? " · " + o.customer_snapshot.email : ""}`;
    mAddress.textContent = o.customer_snapshot?.address || "—";

    mStatus.value = o.status || "PENDING_PAYMENT";
    mPayStatus.value = o.payment?.status || "PENDING";
    mPayMethod.value = o.payment?.method || "";
    mRef.value = o.payment?.ref || "";
    mProofOk.checked = !!o.payment?.proof_ok;

    mTotal.textContent = money(o.total);

    mItems.innerHTML = (o.items || []).map(it => `
    <div class="admin-item">
      <div>
        <div class="admin-strong">${it.name}</div>
        <div class="small-muted">x${it.qty} · ${money(it.unit_price)} BOB</div>
      </div>
      <div class="price">${money(it.qty * it.unit_price)} BOB</div>
    </div>
  `).join("");

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    activeId = null;
}

modal.addEventListener("click", (e) => {
    if (e.target?.dataset?.close) closeModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
});

function updateActive(updateFn) {
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === activeId);
    if (idx === -1) return;

    const o = structuredClone(orders[idx]);
    updateFn(o);

    orders[idx] = o;
    setOrders(orders);
    render();
    openModal(activeId);
    mMsg.textContent = "Cambios guardados.";
}

saveBtn.addEventListener("click", () => {
    if (!activeId) return;

    updateActive((o) => {
        o.status = mStatus.value;

        o.payment = o.payment || { method: "QR", ref: "", status: "PENDING" };
        o.payment.status = mPayStatus.value;
        o.payment.ref = mRef.value.trim();
        o.payment.proof_ok = !!mProofOk.checked;

        if (o.status === "PAID" && o.payment.status !== "CONFIRMED") o.payment.status = "CONFIRMED";
        if (o.payment.status === "CONFIRMED" && o.status === "PENDING_PAYMENT") o.status = "PAID";
    });
});

markPaidBtn.addEventListener("click", () => {
    if (!activeId) return;

    updateActive((o) => {
        o.status = "PAID";
        o.payment = o.payment || { method: "QR", ref: "", status: "PENDING" };
        o.payment.status = "CONFIRMED";
        o.payment.proof_ok = true;
    });
});

rejectBtn.addEventListener("click", () => {
    if (!activeId) return;

    updateActive((o) => {
        o.payment = o.payment || { method: "QR", ref: "", status: "PENDING" };
        o.payment.status = "REJECTED";
        o.payment.proof_ok = false;
        if (o.status === "PAID") o.status = "PENDING_PAYMENT";
    });
});

waBtn.addEventListener("click", () => {
    if (!activeId) return;
    const o = getOrders().find(x => x.id === activeId);
    if (!o) return;

    const phone = String(o.customer_snapshot?.phone || "").replace(/\D/g, "");
    if (!phone) {
        mMsg.textContent = "Este pedido no tiene teléfono.";
        return;
    }

    const lines = (o.items || []).map(it => `- ${it.name} x${it.qty}`).join("\n");
    const text =
        `Hola ${o.customer_snapshot?.name || ""}, sobre tu pedido ${o.id}.\n` +
        `Estado: ${o.status}\n` +
        `Pago: ${o.payment?.method || ""} · ${o.payment?.status || ""}\n` +
        `Ref: ${o.payment?.ref || ""}\n` +
        `Total: ${money(o.total)} BOB\n\n` +
        `Items:\n${lines}\n\n` +
        `Pole Position Apparel`;

    const url = `https://wa.me/591${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
});

function download(name, text) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

exportBtn.addEventListener("click", () => {
    const db = loadDB();
    download("orders.json", JSON.stringify(db.orders || [], null, 2));
});

q.addEventListener("input", render);
status.addEventListener("change", render);
pay.addEventListener("change", render);

render();
