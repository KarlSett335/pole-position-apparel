const DB_KEY = "ppa_admin_db_v1";

export async function loadProducts() {
    try {
        const raw = localStorage.getItem(DB_KEY);
        if (raw) {
            const db = JSON.parse(raw);
            if (Array.isArray(db.products) && db.products.length) {
                return db.products;
            }
        }
    } catch (_) { }

    const r = await fetch("/data/products.json", { cache: "no-store" });
    const json = await r.json();
    return Array.isArray(json) ? json : [];
}

export function onlyActive(products) {
    return (products || []).filter(p => p && p.active !== false);
}
