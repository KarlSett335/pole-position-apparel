import { loadDB, saveDB } from "./store.js";

const SESSION_KEY = "ppa_admin_session_v1";

export function getSession() {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
}

export function requireAuth() {
    const s = getSession();
    if (!s) window.location.href = "/admin/login.html";
    return s;
}

export function login(username, pin) {
    const db = loadDB();
    const u = (db.staff || []).find(x => x.active && x.username === username && x.pin === pin);
    if (!u) return null;

    const session = { id: u.id, name: u.name, role: u.role, username: u.username, at: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
}

export function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "/admin/login.html";
}

export function isAdmin() {
    const s = getSession();
    return s?.role === "admin";
}

export function setStaff(updatedStaff) {
    const db = loadDB();
    db.staff = updatedStaff;
    saveDB(db);
}
