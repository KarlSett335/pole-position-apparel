import { initDB, loadDB, saveDB, uid } from "../lib/store.js";
import { requireAuth, logout, getSession } from "../lib/auth.js";

document.addEventListener("DOMContentLoaded", async () => {
    requireAuth();
    await initDB();

    const session = getSession?.() || null;

    // Solo ADMIN puede gestionar equipo
    const role = String(session?.role || "").toLowerCase();
    if (role !== "admin") {
        alert("Acceso solo para administradores.");
        window.location.href = "/admin/index.html";
        return;
    }


    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);

    const list = document.getElementById("list");
    const modal = document.getElementById("modal");
    const form = document.getElementById("form");
    const msg = document.getElementById("msg");
    const delBtn = document.getElementById("del");

    const f_id = document.getElementById("id");
    const f_user = document.getElementById("username");
    const f_pin = document.getElementById("pin");
    const f_role = document.getElementById("role");
    const f_active = document.getElementById("active");

    const newBtn = document.getElementById("new");

    let editingId = null;

    function getStaff() {
        return loadDB().staff || [];
    }

    function setStaff(staff) {
        const db = loadDB();
        db.staff = staff;
        saveDB(db);
    }

    function esc(s) {
        return String(s || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function openModal(user) {
        if (!modal) return;

        if (msg) msg.textContent = "";

        if (user) {
            editingId = user.id;

            f_id.value = user.id;
            f_user.value = user.username || "";
            f_pin.value = user.pin || "";
            f_role.value = user.role || "STAFF";
            f_active.checked = !!user.active;

            if (delBtn) delBtn.style.display = "inline-flex";
        } else {
            editingId = null;

            f_id.value = "";
            f_user.value = "";
            f_pin.value = "";
            f_role.value = "STAFF";
            f_active.checked = true;

            if (delBtn) delBtn.style.display = "none";
        }

        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        editingId = null;
    }

    function render() {
        const staff = getStaff();

        if (!list) return;

        list.innerHTML = staff
            .map((u) => {
                const badge = u.active ? "OK" : "OFF";
                const role = u.role || "STAFF";
                const state = u.active ? "Activo" : "Inactivo";
                const cls = u.active ? "is-paid" : "is-pending";

                return `
          <button type="button" class="admin-row" data-open="${esc(u.id)}">
            <div class="admin-left">
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <div class="admin-id">${esc(u.username)}</div>
                <span class="badge-lux admin-badge ${cls}">${esc(role)}</span>
                <span class="badge-lux admin-badge">${esc(state)}</span>
              </div>
              <div class="small-muted mt-1">${esc(u.name || "")}</div>
            </div>
            <div class="admin-right">
              <span class="badge-lux admin-badge ${cls}">${esc(badge)}</span>
            </div>
          </button>
        `;
            })
            .join("");

        document.querySelectorAll("[data-open]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.open;
                const u = getStaff().find((x) => x.id === id);
                openModal(u);
            });
        });
    }

    // Evento: Nuevo usuario
    if (newBtn) {
        newBtn.addEventListener("click", () => openModal(null));
    }

    // Cerrar modal al click en backdrop o botón con data-close
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target?.dataset?.close) closeModal();
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal?.classList.contains("open")) closeModal();
    });

    // Guardar (create/update)
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            if (msg) msg.textContent = "";

            const username = f_user.value.trim();
            const pin = f_pin.value.trim();
            const role = f_role.value;
            const active = !!f_active.checked;

            if (username.length < 3) {
                if (msg) msg.textContent = "El usuario debe tener al menos 3 caracteres.";
                return;
            }
            if (pin.length < 4) {
                if (msg) msg.textContent = "El PIN debe tener al menos 4 caracteres.";
                return;
            }

            let staff = getStaff();

            // Evitar duplicados de username
            const exists = staff.find((u) => u.username === username && u.id !== editingId);
            if (exists) {
                if (msg) msg.textContent = "Ese usuario ya existe. Usa otro.";
                return;
            }

            // No permitir desactivar el último admin activo
            const activeAdmins = staff.filter((u) => u.active && u.role === "ADMIN");
            if (editingId) {
                const current = staff.find((u) => u.id === editingId);
                if (current && current.role === "ADMIN" && current.active && (!active || role !== "ADMIN")) {
                    if (activeAdmins.length <= 1) {
                        if (msg) msg.textContent = "No puedes dejar el sistema sin un ADMIN activo.";
                        return;
                    }
                }
            }

            if (editingId) {
                const idx = staff.findIndex((u) => u.id === editingId);
                if (idx === -1) return;

                staff[idx] = {
                    ...staff[idx],
                    username,
                    pin,
                    role,
                    active
                };
            } else {
                staff.unshift({
                    id: uid("u"),
                    username,
                    pin,
                    role,
                    active,
                    created_at: new Date().toISOString()
                });
            }

            setStaff(staff);
            render();
            closeModal();
        });
    }

    // Eliminar
    if (delBtn) {
        delBtn.addEventListener("click", () => {
            if (!editingId) return;

            let staff = getStaff();
            const target = staff.find((u) => u.id === editingId);
            if (!target) return;

            // No permitir eliminar el último admin activo
            const activeAdmins = staff.filter((u) => u.active && u.role === "ADMIN");
            if (target.role === "ADMIN" && target.active && activeAdmins.length <= 1) {
                if (msg) msg.textContent = "No puedes eliminar el último ADMIN activo.";
                return;
            }

            staff = staff.filter((u) => u.id !== editingId);
            setStaff(staff);
            render();
            closeModal();
        });
    }

    render();
});
