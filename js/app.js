// ===== STATE =====
// The shopping cart: an array of { id, name, price, qty } objects
let cart = [];

// ===== DOM REFERENCES =====
const productList = document.getElementById("product-list");
const cartTableBody = document.getElementById("cart-table-body");
const itemCountEl = document.getElementById("item-count");
const totalAmountEl = document.getElementById("total-amount");

// ===== HELPER FUNCTIONS =====

// Rounds a peso amount to 2 decimal places and never returns -0
function roundMoney(amount) {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  return rounded || 0; // -0 is falsy, so this turns -0 into 0
}

// Formats a number as pesos, e.g., 1250.5 -> "₱1,250.50"
function formatPeso(amount) {
  return amount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP"
  });
}

// Finds a cart line by product id. Returns undefined if it is not in the cart.
function findCartItem(id) {
  return cart.find(function (item) {
    return item.id === id;
  });
}

// Subtotal of one cart line = unit price x quantity (rounded to centavos)
function getSubtotal(item) {
  return roundMoney(item.price * item.qty);
}

// Total Amount = sum of all item subtotals.
// Kept as a normal function so the payment step can reuse it later.
function getCartTotal() {
  let total = 0;
  for (const item of cart) {
    total += getSubtotal(item);
  }
  return roundMoney(total);
}

// Total number of items = sum of all quantities
function getItemCount() {
  let count = 0;
  for (const item of cart) {
    count += item.qty;
  }
  return count;
}

// ===== CART FUNCTIONS =====

// Adds a product to the cart, or raises its quantity by 1 if it is already there
function addToCart(id, name, price) {
  const existing = findCartItem(id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: id, name: name, price: price, qty: 1 });
  }
  updateCartDisplay();
}

// Removes a whole line from the cart
function removeFromCart(id) {
  cart = cart.filter(function (item) {
    return item.id !== id;
  });
  updateCartDisplay();
}

// Changes a line's quantity by +1 or -1.
// If the quantity would drop below 1, the item is removed instead.
function changeQuantity(id, change) {
  const item = findCartItem(id);
  if (!item) {
    return;
  }

  const newQty = item.qty + change;
  if (newQty < 1) {
    removeFromCart(id); // also refreshes the display
    return;
  }

  item.qty = newQty;
  updateCartDisplay();
}

// ===== RENDER FUNCTIONS =====

// Creates one table cell with plain text (safe: uses textContent)
function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

// Creates a small button that carries data-action and data-id for event delegation
function createActionButton(label, action, id, extraClass) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-small " + extraClass;
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = id;
  return button;
}

// Creates the "Your cart is empty." placeholder row
function createEmptyRow() {
  const row = document.createElement("tr");
  row.className = "empty-row";
  const cell = document.createElement("td");
  cell.colSpan = 5;
  cell.textContent = "Your cart is empty.";
  row.appendChild(cell);
  return row;
}

// Creates the Quantity cell: [-] quantity [+]
function createQuantityCell(item) {
  const cell = document.createElement("td");
  const wrapper = document.createElement("div");
  wrapper.className = "qty-controls";

  const quantity = document.createElement("span");
  quantity.textContent = item.qty;

  wrapper.appendChild(createActionButton("-", "decrease", item.id, "btn-primary"));
  wrapper.appendChild(quantity);
  wrapper.appendChild(createActionButton("+", "increase", item.id, "btn-primary"));
  cell.appendChild(wrapper);
  return cell;
}

// Creates the Actions cell with the Remove button
function createRemoveCell(item) {
  const cell = document.createElement("td");
  cell.appendChild(createActionButton("Remove", "remove", item.id, "btn-danger"));
  return cell;
}

// Creates one full cart row for an item
function createCartRow(item) {
  const row = document.createElement("tr");
  row.appendChild(createCell(item.name));
  row.appendChild(createCell(formatPeso(item.price)));
  row.appendChild(createQuantityCell(item));
  row.appendChild(createCell(formatPeso(getSubtotal(item))));
  row.appendChild(createRemoveCell(item));
  return row;
}

// Redraws the whole cart table
function renderCart() {
  cartTableBody.innerHTML = ""; // clear old rows

  if (cart.length === 0) {
    cartTableBody.appendChild(createEmptyRow());
    return;
  }

  for (const item of cart) {
    cartTableBody.appendChild(createCartRow(item));
  }
}

// Updates the Order Summary (number of items and total amount)
function renderSummary() {
  itemCountEl.textContent = getItemCount();
  totalAmountEl.textContent = formatPeso(getCartTotal());
}

// Redraws the cart and the summary together after every cart change
function updateCartDisplay() {
  renderCart();
  renderSummary();
}

// ===== EVENT LISTENERS (event delegation: one listener per container) =====

// One listener on the product list handles all six "Add to Cart" buttons
productList.addEventListener("click", function (event) {
  const button = event.target.closest(".add-to-cart-btn");
  if (!button) {
    return; // the click was not on an Add to Cart button
  }
  addToCart(
    button.dataset.id,
    button.dataset.name,
    Number(button.dataset.price)
  );
});

// One listener on the cart body handles all +, -, and Remove buttons
cartTableBody.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "increase") {
    changeQuantity(id, 1);
  } else if (action === "decrease") {
    changeQuantity(id, -1);
  } else if (action === "remove") {
    removeFromCart(id);
  }
});

// ===== INITIAL DRAW =====
updateCartDisplay();