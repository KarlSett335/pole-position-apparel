const DB_KEY = "ppa_admin_db_v1";

export async function loadDB() {
    try {
        const raw = localStorage.getItem(DB_KEY);
        if (raw) return JSON.parse(raw);
    } catch (_) { }
    return null;
}

export async function loadProducts() {
    const db = await loadDB();
    if (db && Array.isArray(db.products)) return db.products;

    const r = await fetch("/data/products.json", { cache: "no-store" });
    const json = await r.json();
    return Array.isArray(json) ? json : [];
}

export async function loadOffers() {
    const db = await loadDB();
    if (db && Array.isArray(db.offers)) return db.offers;
    return [];
}

export function onlyActive(products) {
    return (products || []).filter(p => p && p.active !== false);
}

export function activeOfferNow(offers) {
    const now = Date.now();
    const list = (offers || []).filter(o => o && o.active);

    const valid = list.filter(o => {
        const s = o.starts_at ? new Date(o.starts_at).getTime() : null;
        const e = o.ends_at ? new Date(o.ends_at).getTime() : null;
        const okStart = s ? now >= s : true;
        const okEnd = e ? now <= e : true;
        return okStart && okEnd;
    });

    // Si hay varias, usa la primera (la más nueva si tiene created_at)
    valid.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return valid[0] || null;
}

export function applyOffer(price, offer) {
    const p = Number(price || 0);
    if (!offer) return { final: p, discount: 0 };

    const v = Number(offer.value || 0);

    if (offer.type === "AMOUNT") {
        const final = Math.max(0, p - v);
        return { final, discount: p - final };
    }

    // PERCENT
    const final = Math.max(0, Math.round(p * (1 - v / 100)));
    return { final, discount: p - final };
}
