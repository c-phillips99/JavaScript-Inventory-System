// --- State & Storage ---
let inventory = [];
let currentSort = { field: '', asc: true };
let lastSortedField = '';

const stored = localStorage.getItem('inventory');
if (stored) inventory = JSON.parse(stored);
renderProducts();

function updateStorage(){
  localStorage.setItem('inventory', JSON.stringify(inventory));
}

// --- Input Helpers ---
function clearInputs() {
  document.getElementById('prod-id').value = '';
  document.getElementById('prod-name').value = '';
  document.getElementById('prod-qty').value = '';
}

function clearFilters() {
  document.getElementById('search-name').value = '';
  document.getElementById('filter-min').value = '';
  document.getElementById('filter-max').value = '';
  renderProducts();

  document.getElementById('search-name').focus();
}

// --- Sanatization Helpers ---
function sanitizeId(input) {
  return input.replace(/\s+/g, '').toUpperCase();
}

function sanitizeName(input) {
  return input.replace(/\s+/g, ' ').trim();
}

function sanitizeNumber(input) {
  const n = parseInt(input, 10);
  return isNaN(n) ? null : n;
}

// --- Core Operations ---
function addProduct() {
  let id = sanitizeId(document.getElementById('prod-id').value);
  let name = sanitizeName(document.getElementById('prod-name').value);
  let qty = sanitizeNumber(document.getElementById('prod-qty').value);

  if (!id || !name || qty === null) {
    alert('Please provide valid ID, Name, and Quantity.');
    return;
  }

  if (/[^A-Z0-9_-]/.test(id)) {
    alert('Product ID contains invalid characters. Use letters, numbers, _ or - only.');
    return;
  }

  if (inventory.find(p => p.id === id)) {
    alert('Product ID must be unique.');
    return;
  }

  inventory.push({ id, name, quantity: qty });
  updateStorage();
  clearInputs();
  renderProducts();
  document.getElementById('prod-id').focus();
}


function applyQuantityChange(id) {
  const input = document.getElementById(`change-${id}`);
  const change = sanitizeNumber(input.value);

  if (change === null) {
    alert('Please enter a valid number for quantity change.');
    return;
  }

  const product = inventory.find(p => p.id === id);
  if (!product) return;

  const newQty = product.quantity + change;
  if (newQty < 0) {
    alert('Quantity cannot be negative.');
    return;
  }

  product.quantity = newQty;
  updateStorage();
  renderProducts();
  document.getElementById(`change-${id}`).focus();
}


function deleteProduct(id) {
  const confirmDelete = confirm("Are you sure you want to delete this product?");
  if (!confirmDelete) return;

  inventory = inventory.filter(p => p.id !== id);
  updateStorage();
  renderProducts();
  document.getElementById('prod-id').focus();
}

// --- Sorting & Filtering ---
function setSort(field) {
  if (currentSort.field === field) {
    currentSort.asc = !currentSort.asc;
  } else {
    lastSortedField = currentSort.field;
    currentSort.field = field;
    currentSort.asc = true;
  }
  displaySortArrow();
  renderProducts();
}

function sortProducts(products){
  if (!currentSort.field) return products;

  return [...products].sort((a, b) => {
    let valA = a[currentSort.field];
    let valB = b[currentSort.field];

    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return currentSort.asc ? -1 : 1;
    if (valA > valB) return currentSort.asc ? 1 : -1;
    return 0;
  });
}

function filterProducts() {
  const searchName = sanitizeName(document.getElementById('search-name').value).toLowerCase();
  const minQty = sanitizeNumber(document.getElementById('filter-min').value);
  const maxQty = sanitizeNumber(document.getElementById('filter-max').value);

  return inventory
    .filter(p => p.name.toLowerCase().includes(searchName))
    .filter(p => minQty === null || p.quantity >= minQty)
    .filter(p => maxQty === null || p.quantity <= maxQty);
}

// --- Rendering Logic ---
function displaySortArrow() {
  if (lastSortedField) {
    const lastEl = document.getElementById(`arrow-${lastSortedField}`);
    if (lastEl) lastEl.textContent = '';
  }

  if (currentSort.field) {
    const currentEl = document.getElementById(`arrow-${currentSort.field}`);
    if (currentEl) currentEl.textContent = currentSort.asc ? ' ↑' : ' ↓';
  }

  lastSortedField = currentSort.field;
}

function renderProducts() {
  const tbody = document.getElementById('product-table');
  tbody.innerHTML = '';

  result = sortProducts(filterProducts());

  if (result.length === 0) {
    const row = `<tr><td colspan="4" style="text-align: center; color: #666; font-style: italic;">
      No products found.
    </td></tr>`;
    tbody.innerHTML = row;
  } 
  else {
      result.forEach(p => {
        const row = `<tr>
          <td>${p.id}</td>
          <td>${p.name}</td>
          <td class="${p.quantity < 5 ? 'low-stock' : ''}">${p.quantity}</td>
          <td>
            <input type="number" id="change-${p.id}" placeholder="Adjust quantity" class="quantity-input">
            <button onclick="applyQuantityChange('${p.id}')">Update</button>
            <button onclick="deleteProduct('${p.id}')">Delete</button>
          </td>
        </tr>`;
        tbody.innerHTML += row;
      });
  }
}
