import { loadProducts, loadOffers, onlyActive, activeOfferNow, applyOffer } from "/js/catalog.js";

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

function money(n) { return Number(n || 0).toLocaleString("es-BO"); }
function normalize(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function card(p, offer) {
    const img = p.image_url ? p.image_url : "/assets/images/placeholder.jpg";
    const { final, discount } = applyOffer(p.price, offer);

    const hasOffer = discount > 0;

    return `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="product-card">
        <img class="product-img" src="${img}" alt="">
        <div class="product-body">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div class="product-title">${p.name}</div>
            ${hasOffer ? `<span class="badge-offer">Oferta</span>` : ``}
          </div>

          <div class="small-muted">${p.category || ""}${p.team ? " · " + p.team : ""}</div>

          <div class="d-flex justify-content-between align-items-center mt-2">
            <div class="d-flex align-items-baseline gap-2">
              ${hasOffer ? `<div class="price-old">${money(p.price)} BOB</div>` : ``}
              <div class="price">${money(final)} BOB</div>
            </div>
            <div class="small-muted">Stock: ${Number(p.stock || 0)}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCategories(products) {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    const cats = ["all", ...Array.from(set)];
    cat.innerHTML = cats.map(c => `<option value="${c}">${c === "all" ? "Todas" : c}</option>`).join("");
}

function applySort(arr, mode) {
    const a = [...arr];
    if (mode === "price-asc") a.sort((x, y) => Number(x.price || 0) - Number(y.price || 0));
    else if (mode === "price-desc") a.sort((x, y) => Number(y.price || 0) - Number(x.price || 0));
    else if (mode === "name") a.sort((x, y) => String(x.name).localeCompare(String(y.name)));
    else a.sort((x, y) => new Date(y.created_at || 0) - new Date(x.created_at || 0));
    return a;
}

function renderMain(products, offer) {
    const text = normalize(q.value);
    const c = cat.value;

    let filtered = [...products];
    if (c !== "all") filtered = filtered.filter(p => p.category === c);

    if (text) {
        filtered = filtered.filter(p => normalize(`${p.name} ${p.category} ${p.team}`).includes(text));
    }

    filtered = applySort(filtered, sort.value);

    meta.textContent = `${filtered.length} producto(s)`;

    if (filtered.length === 0) {
        empty.classList.remove("d-none");
        grid.innerHTML = "";
    } else {
        empty.classList.add("d-none");
        grid.innerHTML = filtered.map(p => card(p, offer)).join("");
    }
}

function renderSection(el, products, category, offer) {
    if (!el) return;
    const items = products.filter(p => p.category === category);
    el.innerHTML = items.slice(0, 9).map(p => card(p, offer)).join("") || `<div class="small-muted mt-2">Sin productos en esta categoría.</div>`;
}

(async () => {
    let products = onlyActive(await loadProducts());
    const offers = await loadOffers();
    const offer = activeOfferNow(offers);

    renderCategories(products);

    renderMain(products, offer);
    renderSection(gridTeams, products, "Equipos", offer);
    renderSection(gridDrivers, products, "Pilotos", offer);
    renderSection(gridScale, products, "Escala", offer);
    renderSection(gridAcc, products, "Accesorios", offer);

    q.addEventListener("input", () => renderMain(products, offer));
    cat.addEventListener("change", () => renderMain(products, offer));
    sort.addEventListener("change", () => renderMain(products, offer));
})();
