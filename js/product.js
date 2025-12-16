import { loadProducts, onlyActive } from "/js/catalog.js";

document.getElementById("y").textContent = new Date().getFullYear();

function money(n) {
  return Number(n || 0).toLocaleString("es-BO");
}

function getId() {
  const url = new URL(window.location.href);
  return url.searchParams.get("id");
}

function imgOf(p) {
  return p.image_url || p.image || "/assets/images/placeholder.jpg";
}

function setNotFound() {
  const box = document.getElementById("productView");
  if (!box) return;
  box.innerHTML = `
    <div class="hero-card">
      <div class="section-title">No encontrado</div>
      <h1 class="h-title mt-2">Este producto no existe</h1>
      <div class="mt-3">
        <a class="btn-lux" href="/shop.html">Volver a tienda</a>
      </div>
    </div>
  `;
}

function addToCart(product) {
  const CART_KEY = "ppa_cart_v1";
  const raw = localStorage.getItem(CART_KEY);
  const cart = raw ? JSON.parse(raw) : { items: [] };

  const found = cart.items.find(i => i.id === product.id);
  if (found) found.qty += 1;
  else cart.items.push({ id: product.id, qty: 1 });

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

(async () => {
  const id = getId();
  if (!id) return setNotFound();

  let products = onlyActive(await loadProducts());

  // Importante: algunos ids pueden venir como número o string
  const product = products.find(p => String(p.id) === String(id));

  if (!product) return setNotFound();

  const box = document.getElementById("productView");
  if (!box) return;

  box.innerHTML = `
    <div class="row g-4 align-items-start">
      <div class="col-lg-6">
        <div class="product-card">
          <img class="product-img" src="${imgOf(product)}" alt="">
        </div>
      </div>

      <div class="col-lg-6">
        <div class="section-title">${product.category || "Producto"}</div>
        <h1 class="h-title mt-2">${product.name}</h1>
        <div class="small-muted mt-2">${product.team ? product.team : ""}</div>

        <div class="price mt-3" style="font-size:1.4rem">${money(product.price)} BOB</div>

        <div class="small-muted mt-2">Stock: ${Number(product.stock || 0)}</div>

        <div class="d-flex gap-2 flex-wrap mt-4">
          <button id="add" class="btn-gold" type="button">Agregar al carrito</button>
          <a class="btn-lux" href="/cart.html">Ir a pagar</a>
        </div>
      </div>
    </div>
  `;

  const btn = document.getElementById("add");
  if (btn) {
    btn.addEventListener("click", () => {
      addToCart(product);
      btn.textContent = "Agregado ✓";
      setTimeout(() => (btn.textContent = "Agregar al carrito"), 1200);
    });
  }
})();
