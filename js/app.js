import { PRODUCTS } from "./data.js";

document.getElementById("y").textContent = new Date().getFullYear();

function productCard(p) {
    return `
  <div class="col-md-4">
    <a class="p-card d-block h-100" href="/product.html?id=${encodeURIComponent(p.id)}">
      <img class="p-img" src="${p.image}" alt="${p.name}">
      <div class="p-body">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div class="h5 mb-1">${p.name}</div>
          <span class="badge-lux">${p.category}</span>
        </div>
        <div class="small-muted mb-2">${p.team}</div>
        <div class="price">${p.price} BOB</div>
      </div>
    </a>
  </div>`;
}

const featured = document.getElementById("featured");
featured.innerHTML = PRODUCTS.slice(0, 6).map(productCard).join("");

// Cuenta regresiva demo
const demoDate = new Date(Date.now() + 1000 * 60 * 60 * 40); // 40h desde ahora
document.getElementById("raceMeta").textContent = demoDate.toLocaleString();
function tick() {
    const diff = demoDate.getTime() - Date.now();
    const el = document.getElementById("countdown");
    if (diff <= 0) { el.textContent = "¡Es hoy!"; return; }
    const s = Math.floor(diff / 1000);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const d = Math.floor(s / 86400);
    el.textContent = `${d}d ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    setTimeout(tick, 1000);
}
tick();
