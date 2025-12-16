import { initDB, loadDB, saveDB, uid } from "../lib/store.js";
import { requireAuth, logout } from "../lib/auth.js";

requireAuth();
await initDB();

document.getElementById("logout").addEventListener("click", logout);

const q = document.getElementById("q");
const active = document.getElementById("active");
const meta = document.getElementById("meta");
const empty = document.getElementById("empty");
const list = document.getElementById("list");
const exportBtn = document.getElementById("export");
const newBtn = document.getElementById("new");

const modal = document.getElementById("modal");
const mTitle = document.getElementById("mTitle");
const mSub = document.getElementById("mSub");
const form = document.getElementById("form");
const msg = document.getElementById("msg");
const delBtn = document.getElementById("del");

const f_id = document.getElementById("id");
const f_title = document.getElementById("title");
const f_type = document.getElementById("type");
const f_value = document.getElementById("value");
const f_start = document.getElementById("starts_at");
const f_end = document.getElementById("ends_at");
const f_active = document.getElementById("is_active");

let editingId = null;

function normalize(s) {
    return String(s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
}

function getOffers() {
    const db = loadDB();
    return db.offers || [];
}

function setOffers(offers) {
    const db = loadDB();
    db.offers = offers;
    saveDB(db);
}

function toLocalInputValue(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toISOFromLocalInput(v) {
    if (!v) return "";
    const d = new Date(v);
    return d.toISOString();
}

function label(o) {
    const val = Number(o.value || 0);
    const kind = o.type === "AMOUNT" ? `-${val} BOB` : `${val}%`;
    const st = o.active ? "Activa" : "Inactiva";
    const stClass = o.active ? "is-paid" : "is-pending";

    const s = o.starts_at ? new Date(o.starts_at).toLocaleDateString("es-BO") : "—";
    const e = o.ends_at ? new Date(o.ends_at).toLocaleDateString("es-BO") : "—";

    return `
    <button type="button" class="admin-row" data-open="${o.id}">
      <div class="admin-left">
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <div class="admin-id">${o.title}</div>
          <span class="badge-lux admin-badge ${stClass}">${st}</span>
          <span class="badge-lux admin-badge">${kind}</span>
        </div>
        <div class="small-muted mt-1">Inicio: ${s} · Fin: ${e}</div>
      </div>
      <div class="admin-right">
        <div class="small-muted">Editar</div>
      </div>
    </button>
  `;
}

function openModal(offer) {
    msg.textContent = "";

    if (offer) {
        editingId = offer.id;
        mTitle.textContent = "Editar oferta";
        mSub.textContent = offer.id;

        f_id.value = offer.id;
        f_title.value = offer.title || "";
        f_type.value = offer.type || "PERCENT";
        f_value.value = Number(offer.value || 0);
        f_start.value = toLocalInputValue(offer.starts_at);
        f_end.value = toLocalInputValue(offer.ends_at);
        f_active.checked = !!offer.active;

        delBtn.style.display = "inline-flex";
    } else {
        editingId = null;
        mTitle.textContent = "Nueva oferta";
        mSub.textContent = "Se agregará a marketing";

        f_id.value = "";
        f_title.value = "";
        f_type.value = "PERCENT";
        f_value.value = 10;
        f_start.value = "";
        f_end.value = "";
        f_active.checked = true;

        delBtn.style.display = "none";
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

function render() {
    const offers = getOffers();
    const text = normalize(q.value);
    const act = active.value;

    let filtered = [...offers];

    if (act === "active") filtered = filtered.filter(o => !!o.active);
    if (act === "inactive") filtered = filtered.filter(o => !o.active);

    if (text) filtered = filtered.filter(o => normalize(o.title).includes(text));

    meta.textContent = `${filtered.length} oferta(s)`;

    if (filtered.length === 0) {
        empty.classList.remove("d-none");
        list.innerHTML = "";
    } else {
        empty.classList.add("d-none");
        list.innerHTML = filtered.map(label).join("");
    }

    document.querySelectorAll("[data-open]").forEach(b => {
        b.addEventListener("click", () => {
            const id = b.dataset.open;
            const offer = getOffers().find(x => x.id === id);
            openModal(offer);
        });
    });
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.textContent = "";

    const title = f_title.value.trim();
    const type = f_type.value;
    const value = Number(f_value.value || 0);
    const starts_at = toISOFromLocalInput(f_start.value);
    const ends_at = toISOFromLocalInput(f_end.value);
    const isActive = !!f_active.checked;

    if (!title || value < 0) {
        msg.textContent = "Revisa título y valor.";
        return;
    }

    const offers = getOffers();

    if (editingId) {
        const idx = offers.findIndex(o => o.id === editingId);
        if (idx === -1) return;

        offers[idx] = { ...offers[idx], title, type, value, starts_at, ends_at, active: isActive };
        setOffers(offers);
        msg.textContent = "Oferta actualizada.";
    } else {
        offers.unshift({
            id: uid("of"),
            title,
            type,
            value,
            starts_at,
            ends_at,
            active: isActive,
            created_at: new Date().toISOString()
        });
        setOffers(offers);
        msg.textContent = "Oferta creada.";
    }

    render();
    setTimeout(closeModal, 350);
});

delBtn.addEventListener("click", () => {
    if (!editingId) return;
    const offers = getOffers().filter(o => o.id !== editingId);
    setOffers(offers);
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
    download("offers.json", JSON.stringify(getOffers(), null, 2));
});

newBtn.addEventListener("click", () => openModal(null));
q.addEventListener("input", render);
active.addEventListener("change", render);

render();
