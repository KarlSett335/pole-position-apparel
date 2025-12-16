const loginForm = document.getElementById("loginForm");
const loginPage = document.getElementById("loginPage");
const adminPage = document.getElementById("adminPage");
const loginError = document.getElementById("loginError");

const ADMIN_PIN = "1234"; // cámbialo

if (localStorage.getItem("adminLoggedIn") === "true") {
    loginPage.classList.add("hidden");
    adminPage.classList.remove("hidden");
}

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const pin = document.getElementById("pin").value.trim();

    if (pin === ADMIN_PIN) {
        localStorage.setItem("adminLoggedIn", "true");
        loginError.style.display = "none";
        loginPage.classList.add("hidden");
        adminPage.classList.remove("hidden");
    } else {
        loginError.style.display = "block";
    }

    loginForm.reset();
});
