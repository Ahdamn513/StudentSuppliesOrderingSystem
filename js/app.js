// ===== STATE =====
// The shopping cart: an array of { id, name, price, qty } objects
let cart = [];

// PAYMENT: true after a successful payment, until New Transaction is clicked
let isTransactionComplete = false;

// ===== DOM REFERENCES =====
const productList = document.getElementById("product-list");
const cartTableBody = document.getElementById("cart-table-body");
const itemCountEl = document.getElementById("item-count");
const totalAmountEl = document.getElementById("total-amount");

// PAYMENT and RECEIPT references
const paymentMessage = document.getElementById("payment-message");
const cashInput = document.getElementById("cash-input");
const confirmPaymentBtn = document.getElementById("confirm-payment-btn");
const changeAmountEl = document.getElementById("change-amount");
const receiptContent = document.getElementById("receipt-content");
const newTransactionBtn = document.getElementById("new-transaction-btn");

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

// PAYMENT (changed): ignored while the transaction is locked
// Adds a product to the cart, or raises its quantity by 1 if it is already there
function addToCart(id, name, price) {
  if (isTransactionComplete) {
    return;
  }
  const existing = findCartItem(id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: id, name: name, price: price, qty: 1 });
  }
  updateCartDisplay();
}

// PAYMENT (changed): ignored while the transaction is locked
// Removes a whole line from the cart
function removeFromCart(id) {
  if (isTransactionComplete) {
    return;
  }
  cart = cart.filter(function (item) {
    return item.id !== id;
  });
  updateCartDisplay();
}

// PAYMENT (changed): ignored while the transaction is locked
// Changes a line's quantity by +1 or -1.
// If the quantity would drop below 1, the item is removed instead.
function changeQuantity(id, change) {
  if (isTransactionComplete) {
    return;
  }
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

// PAYMENT (changed): buttons are created disabled while the transaction is locked
// Creates a small button that carries data-action and data-id for event delegation
function createActionButton(label, action, id, extraClass) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-small " + extraClass;
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = id;
  button.disabled = isTransactionComplete;
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

// ===== PAYMENT FUNCTIONS =====

// PAYMENT: Shows one message in the payment message area. type is "success" or "error".
function showPaymentMessage(text, type) {
  paymentMessage.innerHTML = ""; // clear any previous message
  const message = document.createElement("div");
  message.className = "message " + type;
  message.textContent = text;
  paymentMessage.appendChild(message);
}

// PAYMENT: Returns an error message if the cart is empty, otherwise ""
function validateCart() {
  if (cart.length === 0) {
    return "Your cart is empty. Add at least one product first.";
  }
  return "";
}

// PAYMENT: Checks the cash text in order: blank, not a number, negative, too low.
// Returns the FIRST error message, or "" if the payment is valid.
function validateCash(text, total) {
  const trimmed = text.trim();

  // b. blank
  if (trimmed === "") {
    return "Please enter the cash amount.";
  }

  // d. negative numbers like "-50" or "-12.5" (checked first so they get the right message)
  if (/^-\d+(\.\d+)?$/.test(trimmed)) {
    return "Cash amount cannot be negative.";
  }

  // c. anything that is not digits with an optional decimal part
  // (rejects "abc", "12.5.3", "1e3", "5 0", ".5", "1,000")
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return "Cash amount must be a valid number.";
  }

  // e. not enough cash (both sides rounded to centavos)
  const cash = Number(trimmed);
  if (roundMoney(cash) < roundMoney(total)) {
    return "Cash is not enough. Total due is " + formatPeso(total) + ".";
  }

  return "";
}

// PAYMENT: Locks or unlocks the whole transaction (cart buttons, product buttons, payment)
function setTransactionLocked(isLocked) {
  isTransactionComplete = isLocked;
  cashInput.disabled = isLocked;
  confirmPaymentBtn.disabled = isLocked;

  const productButtons = document.querySelectorAll(".add-to-cart-btn");
  productButtons.forEach(function (button) {
    button.disabled = isLocked;
  });

  updateCartDisplay(); // redraw so the +, -, and Remove buttons are disabled or enabled
}

// ===== RECEIPT FUNCTIONS =====

// RECEIPT: Pads a number with a leading zero, e.g., 5 -> "05"
function pad2(number) {
  return String(number).padStart(2, "0");
}

// RECEIPT: Builds a reference number like TXN-20261012-143005-482
function generateReferenceNumber(date) {
  const datePart = date.getFullYear() + pad2(date.getMonth() + 1) + pad2(date.getDate());
  const timePart = pad2(date.getHours()) + pad2(date.getMinutes()) + pad2(date.getSeconds());
  const randomPart = Math.floor(100 + Math.random() * 900); // 100 to 999
  return "TXN-" + datePart + "-" + timePart + "-" + randomPart;
}

// RECEIPT: Creates a "Label: value" line
function createReceiptLine(label, value) {
  const line = document.createElement("p");
  line.textContent = label + ": " + value;
  return line;
}

// RECEIPT: Creates a table header cell with plain text
function createHeaderCell(text) {
  const cell = document.createElement("th");
  cell.textContent = text;
  return cell;
}

// RECEIPT: Builds the purchased-items table from a snapshot of the cart
function buildReceiptTable(items) {
  const wrapper = document.createElement("div");
  wrapper.className = "table-wrapper";

  const table = document.createElement("table");
  const headRow = document.createElement("tr");
  ["Product", "Qty", "Unit Price", "Subtotal"].forEach(function (title) {
    headRow.appendChild(createHeaderCell(title));
  });
  const head = document.createElement("thead");
  head.appendChild(headRow);
  table.appendChild(head);

  const body = document.createElement("tbody");
  for (const item of items) {
    const row = document.createElement("tr");
    row.appendChild(createCell(item.name));
    row.appendChild(createCell(item.qty));
    row.appendChild(createCell(formatPeso(item.price)));
    row.appendChild(createCell(formatPeso(getSubtotal(item))));
    body.appendChild(row);
  }
  table.appendChild(body);

  wrapper.appendChild(table);
  return wrapper;
}

// RECEIPT: Builds the whole receipt element (does not put it on the page yet)
function buildReceipt(items, total, paid, change, reference, date) {
  const receipt = document.createElement("div");

  const title = document.createElement("h3");
  title.textContent = "Student Supplies Shop";
  title.style.textAlign = "center";
  receipt.appendChild(title);

  receipt.appendChild(createReceiptLine("Reference No.", reference));
  receipt.appendChild(createReceiptLine("Date and Time", date.toLocaleString("en-PH")));
  receipt.appendChild(buildReceiptTable(items));
  receipt.appendChild(createReceiptLine("Total Amount Due", formatPeso(total)));
  receipt.appendChild(createReceiptLine("Amount Paid", formatPeso(paid)));
  receipt.appendChild(createReceiptLine("Change", formatPeso(change)));

  const confirmation = document.createElement("p");
  confirmation.textContent = "PAYMENT CONFIRMED";
  confirmation.style.textAlign = "center";
  confirmation.style.fontWeight = "700";
  receipt.appendChild(confirmation);

  return receipt;
}

// RECEIPT: Replaces whatever is in the receipt area with the given receipt element
function showReceipt(receiptElement) {
  receiptContent.innerHTML = "";
  receiptContent.appendChild(receiptElement);
}

// RECEIPT: Puts the original "Your receipt will appear here..." paragraph back
function restoreReceiptPlaceholder() {
  receiptContent.innerHTML = "";
  const placeholder = document.createElement("p");
  placeholder.className = "receipt-placeholder";
  placeholder.textContent = "Your receipt will appear here after payment.";
  receiptContent.appendChild(placeholder);
}

// ===== PAYMENT FLOW =====

// PAYMENT: Validates, computes change, shows the receipt, and locks the transaction
function confirmPayment() {
  if (isTransactionComplete) {
    return;
  }

  // a. cart must not be empty
  const cartError = validateCart();
  if (cartError) {
    showPaymentMessage(cartError, "error");
    cashInput.focus();
    return;
  }

  // b to e. validate the cash text
  const total = getCartTotal();
  const cashError = validateCash(cashInput.value, total);
  if (cashError) {
    showPaymentMessage(cashError, "error");
    cashInput.focus();
    return;
  }

  // Valid payment: compute change
  const paid = roundMoney(Number(cashInput.value.trim()));
  const change = roundMoney(paid - total);
  changeAmountEl.textContent = formatPeso(change);

  // RECEIPT: copy the items first, so later cart changes cannot affect the receipt
  const itemsSnapshot = cart.map(function (item) {
    return { id: item.id, name: item.name, price: item.price, qty: item.qty };
  });
  const now = new Date();
  const reference = generateReferenceNumber(now);
  showReceipt(buildReceipt(itemsSnapshot, total, paid, change, reference, now));

  showPaymentMessage("Payment confirmed. Thank you!", "success");
  setTransactionLocked(true);
}

// PAYMENT: Clears everything and unlocks the app for the next customer
function startNewTransaction() {
  cart = [];
  cashInput.value = "";
  changeAmountEl.textContent = formatPeso(0);
  paymentMessage.innerHTML = "";
  restoreReceiptPlaceholder();
  setTransactionLocked(false); // unlocks and refreshes the cart and summary
  cashInput.focus();
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

// PAYMENT: payment and new transaction buttons
confirmPaymentBtn.addEventListener("click", confirmPayment);
newTransactionBtn.addEventListener("click", startNewTransaction);

// ===== INITIAL DRAW =====
updateCartDisplay();