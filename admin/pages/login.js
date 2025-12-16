import { initDB } from "../lib/store.js";
import { login, getSession } from "../lib/auth.js";

await initDB();

if (getSession()) window.location.href = "/admin/index.html";

const form = document.getElementById("loginForm");
const err = document.getElementById("err");

form.addEventListener("submit", (e) => {
    e.preventDefault();
    err.style.display = "none";
    err.textContent = "";

    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("pin").value.trim();

    const s = login(u, p);
    if (!s) {
        err.textContent = "Credenciales inválidas.";
        err.style.display = "block";
        return;
    }
    window.location.href = "/admin/index.html";
});
