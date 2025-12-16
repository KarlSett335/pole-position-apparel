import { loadProducts, loadOffers, onlyActive, activeOfferNow, applyOffer } from "/js/catalog.js";

function money(n) { return Number(n || 0).toLocaleString("es-BO"); }

function featuredCard(p, offer) {
  const img = p.image_url ? p.image_url : "/assets/images/placeholder.jpg";
  const { final, discount } = applyOffer(p.price, offer);
  const hasOffer = discount > 0;

  return `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="product-card">
        <img class="product-img" src="${img}" alt="">
        <div class="product-body">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div class="product-title">${p.name}</div>
            ${hasOffer ? `<span class="badge-offer">Oferta</span>` : ``}
          </div>
          <div class="small-muted">${p.category || ""}${p.team ? " · " + p.team : ""}</div>
          <div class="d-flex align-items-baseline gap-2 mt-2">
            ${hasOffer ? `<div class="price-old">${money(p.price)} BOB</div>` : ``}
            <div class="price">${money(final)} BOB</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

(async () => {
  const featured = document.getElementById("featured");
  if (!featured) return;

  const offers = await loadOffers();
  const offer = activeOfferNow(offers);

  let products = onlyActive(await loadProducts());
  products = products.slice(0, 6);

  featured.innerHTML = products.map(p => featuredCard(p, offer)).join("");
})();
