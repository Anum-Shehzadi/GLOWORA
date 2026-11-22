(() => {
  "use strict";
  const STORAGE_KEY = "glowora-cart-v2";
  const form = document.getElementById("checkout-form");
  const success = document.getElementById("checkout-success");
  const itemsNode = document.getElementById("checkout-items");
  const emptyNode = document.getElementById("checkout-empty");
  const subtotalNode = document.getElementById("checkout-subtotal");
  const totalNode = document.getElementById("checkout-total");
  const countNode = document.getElementById("summary-count");
  const errorNode = document.getElementById("checkout-error");
  const money = value => `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;

  function readCart() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(value)) return [];
      return value.filter(item => item && typeof item.id === "string" && typeof item.name === "string" && Number.isFinite(Number(item.price)) && Number(item.price) > 0 && Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0);
    } catch (error) {
      console.warn("GLOWORA checkout: cart could not be read", error);
      return [];
    }
  }

  function renderSummary() {
    const cart = readCart();
    itemsNode.replaceChildren();
    emptyNode.hidden = cart.length > 0;
    form.querySelector(".checkout-submit").disabled = cart.length === 0;
    let subtotal = 0;
    let count = 0;
    cart.forEach(item => {
      const quantity = Number(item.quantity);
      const lineTotal = Number(item.price) * quantity;
      subtotal += lineTotal;
      count += quantity;
      const row = document.createElement("article");
      row.className = "checkout-item";
      const image = document.createElement("img");
      image.src = item.image || "";
      image.alt = item.alt || item.name;
      image.loading = "lazy";
      const details = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = item.name;
      const quantityText = document.createElement("p");
      quantityText.textContent = `Qty ${quantity} × ${money(item.price)}`;
      details.append(title, quantityText);
      const line = document.createElement("strong");
      line.textContent = money(lineTotal);
      row.append(image, details, line);
      itemsNode.append(row);
    });
    subtotalNode.textContent = money(subtotal);
    totalNode.textContent = money(subtotal);
    countNode.textContent = `${count} ${count === 1 ? "item" : "items"}`;
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    errorNode.textContent = "";
    if (!form.reportValidity()) return;
    if (!readCart().length) {
      errorNode.textContent = "Your cart is empty. Add a product before checkout.";
      return;
    }
    // Static-site demo: do not store personal details or pretend to submit an order.
    form.hidden = true;
    success.hidden = false;
    try { localStorage.removeItem(STORAGE_KEY); } catch (error) { /* Cart remains only in this browser if storage is blocked. */ }
    document.querySelector(".order-summary-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  renderSummary();
})();
