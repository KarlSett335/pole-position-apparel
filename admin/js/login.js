const ADMIN_PIN = "1234"; // 🔒 CAMBIA ESTE PIN

const loginPage = document.getElementById("loginPage");
const adminPage = document.getElementById("adminPage");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

// Si ya está logueado, entra directo
if (localStorage.getItem("ppa_admin_logged") === "true") {
    loginPage.classList.add("hidden");
    adminPage.classList.remove("hidden");
}

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const pin = document.getElementById("pin").value.trim();

    if (pin === ADMIN_PIN) {
        localStorage.setItem("ppa_admin_logged", "true");
        loginError.style.display = "none";
        loginPage.classList.add("hidden");
        adminPage.classList.remove("hidden");
    } else {
        loginError.style.display = "block";
    }

    loginForm.reset();
});
