const DB_KEY = "ppa_admin_db_v1";

const DEFAULT_FILES = {
    staff: "/data/staff.json",
    products: "/data/products.json",
    customers: "/data/customers.json",
    orders: "/data/orders.json",
    offers: "/data/offers.json",
};

export async function initDB() {
    const existing = localStorage.getItem(DB_KEY);
    if (existing) return JSON.parse(existing);

    const db = {};
    for (const [k, url] of Object.entries(DEFAULT_FILES)) {
        const r = await fetch(url, { cache: "no-store" });
        db[k] = await r.json();
    }
    saveDB(db);
    return db;
}

export function loadDB() {
    return JSON.parse(localStorage.getItem(DB_KEY) || "{}");
}

export function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function resetDB() {
    localStorage.removeItem(DB_KEY);
}

export function exportDB() {
    return JSON.stringify(loadDB(), null, 2);
}

export function importDB(jsonText) {
    const parsed = JSON.parse(jsonText);
    saveDB(parsed);
    return parsed;
}

export function uid(prefix = "id") {
    return `${prefix}_${Math.random().toString(16).slice(2, 10)}`;
}
