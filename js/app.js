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
function $(id) { return document.getElementById(id); }

async function loadNextRace() {
  const nameEl = $("raceName");
  const metaEl = $("raceMeta");
  const cdEl = $("countdown");
  if (!nameEl || !metaEl || !cdEl) return;

  try {
    metaEl.textContent = "Cargando…";

    const res = await fetch("/api/next-race", { cache: "no-store" });
    const payload = await res.json();

    if (!res.ok || !payload.ok) throw new Error(payload.error || "API error");

    nameEl.textContent =
      payload.raceName + (payload.country ? " · " + payload.country : "");

    const raceDate = new Date(payload.iso);
    metaEl.textContent = raceDate.toLocaleString("es-BO");

    function tick() {
      const diff = raceDate - Date.now();
      if (diff <= 0) { cdEl.textContent = "¡Es hoy!"; return; }
      const s = Math.floor(diff / 1000);
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600);
      const m = Math.floor((s % 3600) / 60);
      const ss = s % 60;
      cdEl.textContent = `${d}d ${h}:${m}:${ss}`;
      setTimeout(tick, 1000);
    }
    tick();

  } catch {
    metaEl.textContent = "Calendario no disponible";
    cdEl.textContent = "--:--:--";
  }
}

document.addEventListener("DOMContentLoaded", loadNextRace);
