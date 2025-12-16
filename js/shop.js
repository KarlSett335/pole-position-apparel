import { PRODUCTS } from "./data.js";

document.getElementById("y").textContent = new Date().getFullYear();

const grid = document.getElementById("grid");
const q = document.getElementById("q");
const resultsMeta = document.getElementById("resultsMeta");

let selectedCategory = "all";
let selectedSort = "featured";

const CART_KEY = "ppa_cart_v1";

function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}
function setCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
}
function addToCart(productId) {
    const cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (item) item.qty += 1;
    else cart.push({ id: productId, qty: 1 });
    setCart(cart);
    updateCartCount();
}
function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const el = document.getElementById("cartCount");
    if (el) el.textContent = String(count);
}

function card(p) {
    return `
  <div class="col-12 col-sm-6 col-lg-4">
    <div class="p-card h-100">
      <a class="d-block" href="/product.html?id=${encodeURIComponent(p.id)}">
        <img class="p-img" src="${p.image}" alt="${p.name}">
      </a>
      <div class="p-body">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div class="h5 mb-1">${p.name}</div>
          <span class="badge-lux">${p.category}</span>
        </div>
        <div class="small-muted mb-2">${p.team || "Pole Position"}</div>
        <div class="d-flex justify-content-between align-items-center gap-2">
          <div class="price">${p.price} BOB</div>
          <button class="btn-lux btn-sm px-3" data-add="${p.id}" type="button">Añadir</button>
        </div>
      </div>
    </div>
  </div>`;
}

function normalize(s) {
    return String(s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
}

function applyFilters() {
    const text = normalize(q.value);
    const cat = selectedCategory;
    const s = selectedSort;
    const team = document.querySelector(".chip.is-active")?.dataset.team || "all";

    let list = [...PRODUCTS];

    if (cat !== "all") list = list.filter(p => p.category === cat);
    if (team !== "all") list = list.filter(p => (p.team || "") === team);

    if (text) {
        list = list.filter(p => {
            const hay = normalize(`${p.name} ${p.category} ${p.team || ""}`);
            return hay.includes(text);
        });
    }

    if (s === "price-asc") list.sort((a, b) => a.price - b.price);
    if (s === "price-desc") list.sort((a, b) => b.price - a.price);
    if (s === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));

    resultsMeta.textContent = `${list.length} producto(s)`;

    grid.innerHTML = list.map(card).join("");

    grid.querySelectorAll("[data-add]").forEach(btn => {
        btn.addEventListener("click", () => addToCart(btn.dataset.add));
    });
}

document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
        document.querySelectorAll(".chip").forEach(c => c.classList.remove("is-active"));
        chip.classList.add("is-active");
        applyFilters();
    });
});

q.addEventListener("input", applyFilters);

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
            applyFilters();
        });
    });

    document.addEventListener("click", closeAll);
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeAll();
    });
}

setupLuxSelect("category", (v) => { selectedCategory = v; });
setupLuxSelect("sort", (v) => { selectedSort = v; });

updateCartCount();
applyFilters();
