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
