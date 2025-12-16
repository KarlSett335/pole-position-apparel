import { loadProducts, onlyActive } from "/js/catalog.js";

document.getElementById("y").textContent = new Date().getFullYear();

const q = document.getElementById("q");
const cat = document.getElementById("cat");
const sort = document.getElementById("sort");

const meta = document.getElementById("meta");
const grid = document.getElementById("productsGrid");
const empty = document.getElementById("empty");

const gridTeams = document.getElementById("gridTeams");
const gridDrivers = document.getElementById("gridDrivers");
const gridScale = document.getElementById("gridScale");
const gridAcc = document.getElementById("gridAcc");

function money(n) {
    return Number(n || 0).toLocaleString("es-BO");
}

function normalize(s) {
    return String(s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
}

function productImg(p) {
    return p.image_url || p.image || "/assets/images/placeholder.jpg";
}

function productCard(p) {
    const img = productImg(p);

    return `
    <div class="col-12 col-md-6 col-lg-4">
      <a class="product-card" href="/product.html?id=${encodeURIComponent(p.id)}">
        <img class="product-img" src="${img}" alt="">
        <div class="product-body">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div class="product-title">${p.name}</div>
            ${p.category ? `<span class="badge-lux">${p.category}</span>` : ``}
          </div>

          <div class="small-muted">${p.team ? p.team : ""}</div>

          <div class="d-flex justify-content-between align-items-center mt-2">
            <div class="price">${money(p.price)} BOB</div>
            <div class="small-muted">Stock: ${Number(p.stock || 0)}</div>
          </div>
        </div>
      </a>
    </div>
  `;
}

function buildCategories(products) {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    const cats = ["all", ...Array.from(set)];
    cat.innerHTML = cats
        .map(c => `<option value="${c}">${c === "all" ? "Todas" : c}</option>`)
        .join("");
}

function applySort(arr, mode) {
    const a = [...arr];

    if (mode === "price-asc") a.sort((x, y) => Number(x.price || 0) - Number(y.price || 0));
    else if (mode === "price-desc") a.sort((x, y) => Number(y.price || 0) - Number(x.price || 0));
    else if (mode === "name") a.sort((x, y) => String(x.name || "").localeCompare(String(y.name || "")));
    else a.sort((x, y) => new Date(y.created_at || 0) - new Date(x.created_at || 0));

    return a;
}

function renderMain(products) {
    const text = normalize(q.value);
    const c = cat.value;

    let filtered = [...products];

    if (c !== "all") filtered = filtered.filter(p => p.category === c);

    if (text) {
        filtered = filtered.filter(p =>
            normalize(`${p.name} ${p.category} ${p.team}`).includes(text)
        );
    }

    filtered = applySort(filtered, sort.value);

    meta.textContent = `${filtered.length} producto(s)`;

    if (filtered.length === 0) {
        empty.classList.remove("d-none");
        grid.innerHTML = "";
    } else {
        empty.classList.add("d-none");
        grid.innerHTML = filtered.map(productCard).join("");
    }
}

function renderSection(el, products, category) {
    if (!el) return;
    const items = products.filter(p => p.category === category);
    el.innerHTML = items.length ? items.slice(0, 9).map(productCard).join("") : `<div class="small-muted mt-2">Sin productos en esta categoría.</div>`;
}

(async () => {
    let products = onlyActive(await loadProducts());


    if (!products || products.length === 0) {
        meta.textContent = "0 producto(s)";
        empty.classList.remove("d-none");
        grid.innerHTML = "";
        if (gridTeams) gridTeams.innerHTML = `<div class="small-muted mt-2">Sin productos.</div>`;
        if (gridDrivers) gridDrivers.innerHTML = `<div class="small-muted mt-2">Sin productos.</div>`;
        if (gridScale) gridScale.innerHTML = `<div class="small-muted mt-2">Sin productos.</div>`;
        if (gridAcc) gridAcc.innerHTML = `<div class="small-muted mt-2">Sin productos.</div>`;
        return;
    }

    buildCategories(products);
    renderMain(products);

    renderSection(gridTeams, products, "Equipos");
    renderSection(gridDrivers, products, "Pilotos");
    renderSection(gridScale, products, "Escala");
    renderSection(gridAcc, products, "Accesorios");

    q.addEventListener("input", () => renderMain(products));
    cat.addEventListener("change", () => renderMain(products));
    sort.addEventListener("change", () => renderMain(products));
})();
