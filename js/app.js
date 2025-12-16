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

  if (!nameEl || !metaEl || !cdEl) {
    console.warn("Faltan elementos en el DOM:", {
      raceName: !!nameEl, raceMeta: !!metaEl, countdown: !!cdEl
    });
    return;
  }

  try {
    metaEl.textContent = "Cargando…";

    const url = "https://ergast.com/api/f1/current/next.json";
    const res = await fetch(url, { cache: "no-store" });

    console.log("Ergast status:", res.status);
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    console.log("Ergast data:", data);

    const race = data?.MRData?.RaceTable?.Races?.[0];
    if (!race) throw new Error("No se encontró la próxima carrera");

    const country = race?.Circuit?.Location?.country ? ` · ${race.Circuit.Location.country}` : "";
    nameEl.textContent = `${race.raceName}${country}`;

    const time = (race.time && race.time.includes("Z")) ? race.time : (race.time ? race.time + "Z" : "00:00:00Z");
    const raceDate = new Date(`${race.date}T${time}`);

    if (isNaN(raceDate.getTime())) {
      metaEl.textContent = "Fecha no disponible";
      cdEl.textContent = "--:--:--";
      console.warn("Fecha inválida construida con:", race.date, time);
      return;
    }

    metaEl.textContent = raceDate.toLocaleString("es-BO");

    function tick() {
      const diff = raceDate.getTime() - Date.now();
      if (diff <= 0) {
        cdEl.textContent = "¡Es hoy!";
        return;
      }
      const s = Math.floor(diff / 1000);
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600);
      const m = Math.floor((s % 3600) / 60);
      const ss = s % 60;
      cdEl.textContent = `${d}d ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
      setTimeout(tick, 1000);
    }
    tick();

  } catch (err) {
    console.error("Error cargando carrera:", err);
    metaEl.textContent = "Calendario no disponible";
    cdEl.textContent = "--:--:--";
  }
}

document.addEventListener("DOMContentLoaded", loadNextRace);
