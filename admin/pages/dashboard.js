import { initDB, loadDB, exportDB, importDB, resetDB } from "../lib/store.js";
import { requireAuth, logout } from "../lib/auth.js";

requireAuth();
await initDB();

document.getElementById("logout").addEventListener("click", logout);

const db = loadDB();
const orders = db.orders || [];

const since = new Date();
since.setDate(since.getDate() - 30);
const sinceT = since.getTime();

const last30 = orders.filter(o => new Date(o.created_at).getTime() >= sinceT);
const sales = last30.reduce((s, o) => s + Number(o.total || 0), 0);
const pending = orders.filter(o => o.status === "PENDING_PAYMENT").length;

document.getElementById("kSales").textContent = sales.toLocaleString("es-BO") + " BOB";
document.getElementById("kOrders").textContent = String(last30.length);
document.getElementById("kPending").textContent = String(pending);

function download(name, text) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

const msg = document.getElementById("msg");

document.getElementById("export").addEventListener("click", () => {
    download("ppa-db.json", exportDB());
    msg.textContent = "Base exportada.";
});

document.getElementById("importFile").addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    importDB(text);
    msg.textContent = "Base importada. Recarga la página.";
});

document.getElementById("reset").addEventListener("click", () => {
    resetDB();
    msg.textContent = "Reset listo. Recarga la página.";
});
