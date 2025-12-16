import { initDB, loadDB, saveDB, uid } from "../lib/store.js";
import { requireAuth, logout } from "../lib/auth.js";

requireAuth();
await initDB();

document.getElementById("logout").addEventListener("click", logout);

const q = document.getElementById("q");
const meta = document.getElementById("meta");
const empty = document.getElementById("empty");
const list = document.getElementById("list");
const exportBtn = document.getElementById("export");
const newBtn = document.getElementById("new");

const modal = document.getElementById("modal");
const mTitle = document.getElementById("mTitle");
const mSub = document.getElementById("mSub");
const mCount = document.getElementById("mCount");
const mOrders = document.getElementById("mOrders");

const form = document.getElementById("form");
const msg = document.getElementById("msg");
const delBtn = document.getElementById("del");

const f_id = document.getElementById("id");
const f_name = document.getElementById("name");
const f_phone = document.getElementById("phone");
const f_email = document.getElementById("email");
const f_created = document.getElementById("created_at");
const f_address = document.getElementById("address");

let editingId = null;

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

function setDB(db) {
    saveDB(db);
}

function getCustomers() {
    return getDB().customers || [];
}

function setCustomers(customers) {
    const db = getDB();
    db.customers = customers;
    setDB(db);
}

function getOrders() {
    return getDB().orders || [];
}

function orderStatusLabel(s) {
    if (s === "PAID") return "Pagado";
    if (s === "SHIPPED") return "Enviado";
    if (s === "CANCELLED") return "Cancelado";
    return "Pendiente";
}

function openModal(customer) {
    msg.textContent = "";
    msg.style.display = "block";

    if (customer) {
        editingId = customer.id;
        mTitle.textContent = customer.name || "Cliente";
        mSub.textContent = customer.id;

        f_id.value = customer.id;
        f_name.value = customer.name || "";
        f_phone.value = customer.phone || "";
        f_email.value = customer.email || "";
        f_address.value = customer.address || "";
        f_created.value = customer.created_at ? new Date(customer.created_at).toLocaleString("es-BO") : "—";

        delBtn.style.display = "inline-flex";
        renderCustomerOrders(customer.id);
    } else {
        editingId = null;
        mTitle.textContent = "Nuevo cliente";
        mSub.textContent = "Se agregará al CRM";

        f_id.value = "";
        f_name.value = "";
        f_phone.value = "";
        f_email.value = "";
        f_address.value = "";
        f_created.value = new Date().toLocaleString("es-BO");

        delBtn.style.display = "none";
        mCount.textContent = "0 pedidos";
        mOrders.innerHTML = `<div class="small-muted">Aún no hay pedidos.</div>`;
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    editingId = null;
}

modal.addEventListener("click", (e) => {
    if (e.target?.dataset?.close) closeModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
});

function row(c) {
    const phone = c.phone || "—";
    const email = c.email || "";
    const address = c.address || "";
    const when = c.created_at ? new Date(c.created_at).toLocaleDateString("es-BO") : "—";

    return `
    <button type="button" class="admin-row" data-open="${c.id}">
      <div class="admin-left">
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <div class="admin-id">${c.name}</div>
          <span class="badge-lux admin-badge">${phone}</span>
          ${email ? `<span class="badge-lux admin-badge">${email}</span>` : ""}
        </div>
        <div class="small-muted mt-1">${address || "—"}</div>
        <div class="small-muted">Registro: ${when}</div>
      </div>
      <div class="admin-right">
        <div class="small-muted">Ver detalle</div>
      </div>
    </button>
  `;
}

function render() {
    const customers = getCustomers();
    const text = normalize(q.value);

    let filtered = [...customers];

    if (text) {
        filtered = filtered.filter(c => {
            const hay = normalize(`${c.name} ${c.phone} ${c.email} ${c.address}`);
            return hay.includes(text);
        });
    }

    meta.textContent = `${filtered.length} cliente(s)`;

    if (filtered.length === 0) {
        empty.classList.remove("d-none");
        list.innerHTML = "";
    } else {
        empty.classList.add("d-none");
        list.innerHTML = filtered.map(row).join("");
    }

    document.querySelectorAll("[data-open]").forEach(b => {
        b.addEventListener("click", () => {
            const id = b.dataset.open;
            const c = getCustomers().find(x => x.id === id);
            openModal(c);
        });
    });
}

function renderCustomerOrders(customerId) {
    const orders = getOrders().filter(o => o.customer_id === customerId);

    mCount.textContent = `${orders.length} pedido(s)`;

    if (orders.length === 0) {
        mOrders.innerHTML = `<div class="small-muted">Aún no hay pedidos.</div>`;
        return;
    }

    mOrders.innerHTML = orders
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(o => `
      <div class="admin-item">
        <div>
          <div class="admin-strong">${o.id}</div>
          <div class="small-muted">${new Date(o.created_at).toLocaleString("es-BO")}</div>
          <div class="small-muted">Estado: ${orderStatusLabel(o.status)} · Pago: ${o.payment?.method || "—"} · ${o.payment?.status || "—"}</div>
        </div>
        <div class="price">${money(o.total)} BOB</div>
      </div>
    `)
        .join("");
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.textContent = "";

    const name = f_name.value.trim();
    const phone = f_phone.value.trim().replace(/\D/g, "");
    const email = f_email.value.trim();
    const address = f_address.value.trim();

    if (!name || phone.length < 7) {
        msg.textContent = "Revisa el nombre y el teléfono.";
        return;
    }

    const customers = getCustomers();

    if (editingId) {
        const idx = customers.findIndex(c => c.id === editingId);
        if (idx === -1) return;

        customers[idx] = {
            ...customers[idx],
            name,
            phone,
            email,
            address
        };

        setCustomers(customers);
        msg.textContent = "Cliente actualizado.";
        render();
        openModal(customers[idx]);
    } else {
        const c = {
            id: uid("c"),
            name,
            phone,
            email,
            address,
            created_at: new Date().toISOString()
        };

        customers.unshift(c);
        setCustomers(customers);
        msg.textContent = "Cliente creado.";
        render();
        openModal(c);
    }
});

delBtn.addEventListener("click", () => {
    if (!editingId) return;

    const customers = getCustomers().filter(c => c.id !== editingId);
    setCustomers(customers);

    msg.textContent = "Cliente eliminado.";
    render();
    closeModal();
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
    download("customers.json", JSON.stringify(getCustomers(), null, 2));
});

newBtn.addEventListener("click", () => openModal(null));
q.addEventListener("input", render);

render();
