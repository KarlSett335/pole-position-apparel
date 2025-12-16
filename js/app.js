document.getElementById("y").textContent = new Date().getFullYear();

// Cuenta regresiva demo (NO TOCAR)
document.addEventListener("DOMContentLoaded", () => {
  const raceNameEl = document.getElementById("raceName");
  const raceMetaEl = document.getElementById("raceMeta");
  const countdownEl = document.getElementById("countdown");

  if (!raceNameEl || !raceMetaEl || !countdownEl) return;

  async function loadNextRace() {
    try {
      raceMetaEl.textContent = "Cargando…";
      countdownEl.textContent = "--:--:--";

      const res = await fetch("/api/next-race", { cache: "no-store" });
      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      if (!data.ok) throw new Error("Payload inválido");

      const title =
        data.raceName + (data.country ? " · " + data.country : "");
      raceNameEl.textContent = title;

      const raceDate = new Date(data.iso);
      if (isNaN(raceDate.getTime())) {
        raceMetaEl.textContent = "Fecha no disponible";
        return;
      }

      raceMetaEl.textContent = raceDate.toLocaleString("es-BO");

      function tick() {
        const diff = raceDate.getTime() - Date.now();

        if (diff <= 0) {
          countdownEl.textContent = "¡Es hoy!";
          return;
        }

        const totalSeconds = Math.floor(diff / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        countdownEl.textContent =
          `${days}d ` +
          `${String(hours).padStart(2, "0")}:` +
          `${String(minutes).padStart(2, "0")}:` +
          `${String(seconds).padStart(2, "0")}`;

        setTimeout(tick, 1000);
      }

      tick();
    } catch (err) {
      console.error("Countdown error:", err);
      raceMetaEl.textContent = "Calendario no disponible";
      countdownEl.textContent = "--:--:--";
    }
  }

  loadNextRace();
});

// ===============================
// Featured desde Admin (localStorage) + fallback JSON
// ===============================
import { loadProducts, onlyActive } from "/js/catalog.js";

function money(n) {
  return Number(n || 0).toLocaleString("es-BO");
}

function featuredCard(p) {
  const img =
    p.image_url ||
    p.image ||
    "/assets/images/placeholder.jpg";

  return `
    <div class="col-12 col-md-6 col-lg-4">
      <a class="product-card" href="/product.html?id=${encodeURIComponent(p.id)}">
        <img class="product-img" src="${img}" alt="">
        <div class="product-body">
          <div class="product-title">${p.name}</div>
          <div class="small-muted">${p.category || ""}${p.team ? " · " + p.team : ""}</div>
          <div class="price mt-2">${money(p.price)} BOB</div>
        </div>
      </a>
    </div>
  `;
}

(async () => {
  const el = document.getElementById("featured");
  if (!el) return;

  let products = onlyActive(await loadProducts());

  // Si no hay nada en localStorage y tampoco en JSON, evita romper
  if (!products || products.length === 0) {
    el.innerHTML = `
      <div class="col-12">
        <div class="hero-card">
          <div class="section-title">Sin productos</div>
          <div class="small-muted mt-1">Agrega productos desde Admin (en este mismo dominio) o revisa /data/products.json</div>
        </div>
      </div>
    `;
    return;
  }

  products = products.slice(0, 6);
  el.innerHTML = products.map(featuredCard).join("");
})();
