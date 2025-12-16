const CANDIDATE_KEYS = [
    "ppa_admin_db_v1",
    "ppa_db_v1",
    "pole_position_db",
    "db",
];

function tryParse(raw) {
    try { return JSON.parse(raw); } catch { return null; }
}

function findDBInLocalStorage() {
    // 1) Probar llaves conocidas
    for (const k of CANDIDATE_KEYS) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const db = tryParse(raw);
        if (db && (Array.isArray(db.products) || Array.isArray(db.offers) || Array.isArray(db.orders))) {
            return db;
        }
    }

    // 2) Escanear todo el localStorage por si el key es distinto
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const raw = localStorage.getItem(k);
        const db = tryParse(raw);
        if (db && Array.isArray(db.products)) {
            return db;
        }
    }

    return null;
}

export async function loadProducts() {
    const db = findDBInLocalStorage();
    if (db && Array.isArray(db.products) && db.products.length) return db.products;

    const r = await fetch("/data/products.json", { cache: "no-store" });
    const json = await r.json();
    return Array.isArray(json) ? json : [];
}

export function onlyActive(products) {
    return (products || []).filter(p => p && p.active !== false);
}
