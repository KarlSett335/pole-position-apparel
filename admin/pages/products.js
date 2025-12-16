import { initDB, loadDB, saveDB, uid } from "../lib/store.js";
import { requireAuth, logout } from "../lib/auth.js";

requireAuth();
await initDB();

document.getElementById("logout").addEventListener("click", logout);

const q = document.getElementById("q");
const cat = document.getElementById("cat");
const meta = document.getElementById("meta");
const empty = document.getElementById("empty");
const grid = document.getElementById("grid");
const newBtn = document.getElementById("new");

const modal = document.getElementById("modal");
const form = document.getElementById("form");
const delBtn = document.getElementById("del");
const msg = document.getElementById("msg");
const mTitle = document.getElementById("mTitle");
const mSub = document.getElementById("mSub");

const f_id = document.getElementById("id");
const f_name = document.getElementById("name");
const f_price = document.getElementById("price");
const f_category = document.getElementById("category");
const f_team = document.getElementById("team");
const f_stock = document.getElementById("stock");
const f_image = document.getElementById("image_url");
const f_active = document.getElementById("active");

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

function openModal(product) {
    msg.textContent = "";
    msg.style.display = "block";

    if (product) {
        editingId = product.id;
        mTitle.textContent = "Editar producto";
        mSub.textContent = product.id;

        f_id.value = product.id;
        f_name.value = product.name || "";
        f_price.value = Number(product.price || 0);
        f_category.value = product.category || "Accesorios";
        f_team.value = product.team || "";
        f_stock.value = Number(product.stock || 0);
        f_image.value = product.image_url || "";
        f_active.checked = !!product.active;

        delBtn.style.display = "inline-flex";
    } else {
        editingId = null;
        mTitle.textContent = "Nuevo producto";
        mSub.textContent = "Se agregará al catálogo";

        f_id.value = "";
        f_name.value = "";
        f_price.value = 0;
        f_category.value = "Accesorios";
        f_team.value = "";
        f_stock.value = 0;
        f_image.value = "";
        f_active.checked = true;

        delBtn.style.display = "none";
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
}

function getProducts() {
    const db = loadDB();
    return db.products || [];
}

function setProducts(products) {
    const db = loadDB();
    db.products = products;
    saveDB(db);
}

function categoriesFrom(products) {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    return ["all", ...Array.from(set)];
}

function renderCategories(products) {
    const current = cat.value || "all";
    const cats = categoriesFrom(products);

    cat.innerHTML = cats
        .map(c => `<option value="${c}">${c === "all" ? "Todas" : c}</option>`)
        .join("");

    if (cats.includes(current)) cat.value = current;
}

function card(p) {
    const img = p.image_url ? `<img class="admin-thumb" src="${p.image_url}" alt="">` : `<div class="admin-thumb placeholder"></div>`;
    const status = p.active ? "Activo" : "Oculto";
    const statusClass = p.active ? "is-paid" : "is-pending";

    return `
    <button type="button" class="admin-card" data-open="${p.id}">
      ${img}
      <div class="admin-card-body">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div class="admin-strong">${p.name}</div>
          <span class="badge-lux admin-badge ${statusClass}">${status}</span>
        </div>
        <div class="small-muted mt-1">${p.category || "—"}${p.team ? " · " + p.team : ""}</div>
        <div class="d-flex justify-content-between align-items-center mt-2">
          <div class="price">${money(p.price)} BOB</div>
          <div class="small-muted">Stock: ${Number(p.stock || 0)}</div>
        </div>
      </div>
    </button>
  `;
}

function render() {
    const products = getProducts();
    renderCategories(products);

    const text = normalize(q.value);
    const c = cat.value;

    let filtered = [...products];

    if (c !== "all") filtered = filtered.filter(p => p.category === c);

    if (text) {
        filtered = filtered.filter(p => {
            const hay = normalize(`${p.name} ${p.category} ${p.team}`);
            return hay.includes(text);
        });
    }

    meta.textContent = `${filtered.length} producto(s)`;
    if (filtered.length === 0) {
        empty.classList.remove("d-none");
        grid.innerHTML = "";
    } else {
        empty.classList.add("d-none");
        grid.innerHTML = filtered.map(card).join("");
    }

    document.querySelectorAll("[data-open]").forEach(b => {
        b.addEventListener("click", () => {
            const id = b.dataset.open;
            const prod = getProducts().find(x => x.id === id);
            openModal(prod);
        });
    });
}

newBtn.addEventListener("click", () => openModal(null));
q.addEventListener("input", render);
cat.addEventListener("change", render);

modal.addEventListener("click", (e) => {
    if (e.target?.dataset?.close) closeModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
});

form.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.textContent = "";

    const name = f_name.value.trim();
    const price = Number(f_price.value || 0);
    const category = f_category.value;
    const team = f_team.value.trim();
    const stock = Number(f_stock.value || 0);
    const image_url = f_image.value.trim();
    const active = !!f_active.checked;

    if (!name || price < 0 || stock < 0) {
        msg.textContent = "Revisa nombre, precio y stock.";
        return;
    }

    const products = getProducts();

    if (editingId) {
        const idx = products.findIndex(p => p.id === editingId);
        if (idx === -1) return;

        products[idx] = {
            ...products[idx],
            name,
            price,
            category,
            team,
            stock,
            image_url,
            active
        };

        setProducts(products);
        msg.textContent = "Producto actualizado.";
    } else {
        const p = {
            id: uid("p"),
            name,
            price,
            category,
            team,
            stock,
            active,
            image_url,
            created_at: new Date().toISOString()
        };

        products.unshift(p);
        setProducts(products);
        msg.textContent = "Producto creado.";
    }

    render();
    setTimeout(closeModal, 350);
});

delBtn.addEventListener("click", () => {
    if (!editingId) return;
    const products = getProducts().filter(p => p.id !== editingId);
    setProducts(products);
    render();
    closeModal();
});

render();
