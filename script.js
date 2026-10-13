"use strict";

/* ==========================================================
   Slice Rocket - shared script for all three pages.
   Each section checks that its elements exist first, so the
   same file can safely be loaded on every page.
   ========================================================== */

/* ---------- 1. Mobile navigation toggle ---------- */
(function initNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", function () {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
})();

/* ---------- 2. Order page ---------- */
(function initOrderPage() {
  const menuGrid = document.getElementById("menuGrid");
  if (!menuGrid) return; // not on the order page

  // Menu data. Prices are in pence to avoid floating point errors.
  const MENU = [
    { id: "margherita", name: "Margherita", category: "classic", desc: "Tomato, mozzarella and basil.", price: 800 },
    { id: "marinara", name: "Marinara", category: "classic", desc: "Tomato, garlic and oregano.", price: 700 },
    { id: "pepperoni", name: "Pepperoni", category: "meat", desc: "Mozzarella and spicy pepperoni.", price: 950 },
    { id: "bbq-chicken", name: "BBQ Chicken", category: "meat", desc: "Chicken, red onion and smoky BBQ sauce.", price: 1050 },
    { id: "garden", name: "Garden Veg", category: "veggie", desc: "Peppers, mushrooms, olives and sweetcorn.", price: 900 },
    { id: "spinach", name: "Spinach & Feta", category: "veggie", desc: "Spinach, feta and roasted garlic.", price: 950 },
    { id: "garlic-bread", name: "Garlic Bread", category: "sides", desc: "Toasted with garlic butter.", price: 400, noSize: true },
    { id: "cola", name: "Cola (1L)", category: "sides", desc: "Chilled and fizzy.", price: 300, noSize: true }
  ];

  // Extra cost per size, in pence
  const SIZES = [
    { key: "small", label: "Small (9\")", extra: 0 },
    { key: "medium", label: "Medium (12\")", extra: 200 },
    { key: "large", label: "Large (15\")", extra: 400 }
  ];

  let basket = []; // [{ key, name, sizeLabel, unitPrice, qty }]

  const filters = document.getElementById("filters");
  const basketList = document.getElementById("basketList");
  const basketTotal = document.getElementById("basketTotal");
  const emptyMessage = document.getElementById("emptyMessage");
  const placeOrder = document.getElementById("placeOrder");
  const clearBtn = document.getElementById("clearBasket");
  const orderForm = document.getElementById("orderForm");
  const orderMessage = document.getElementById("orderMessage");

  function formatPrice(pence) {
    return "£" + (pence / 100).toFixed(2);
  }

  /* ----- Menu rendering ----- */
  function renderMenu(category) {
    menuGrid.textContent = "";

    MENU.filter(function (item) {
      return category === "all" || item.category === category;
    }).forEach(function (item) {
      const card = document.createElement("article");
      card.className = "card menu-item";

      const title = document.createElement("h3");
      title.textContent = item.name;

      const desc = document.createElement("p");
      desc.textContent = item.desc;

      const price = document.createElement("p");
      price.className = "price";
      price.textContent = item.noSize ? formatPrice(item.price) : "From " + formatPrice(item.price);

      card.append(title, desc, price);

      let select = null;
      if (!item.noSize) {
        const label = document.createElement("label");
        label.setAttribute("for", "size-" + item.id);
        label.textContent = "Size";
        select = document.createElement("select");
        select.id = "size-" + item.id;
        SIZES.forEach(function (size) {
          const option = document.createElement("option");
          option.value = size.key;
          option.textContent = size.label + (size.extra ? " +" + formatPrice(size.extra) : "");
          select.appendChild(option);
        });
        card.append(label, select);
      }

      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "btn";
      addBtn.textContent = "Add to basket";
      addBtn.addEventListener("click", function () {
        addToBasket(item, select ? select.value : null);
      });
      card.appendChild(addBtn);

      menuGrid.appendChild(card);
    });
  }

  /* ----- Category filter ----- */
  filters.addEventListener("click", function (event) {
    const btn = event.target.closest(".filter-btn");
    if (!btn) return;
    filters.querySelectorAll(".filter-btn").forEach(function (b) {
      b.classList.remove("active");
      b.removeAttribute("aria-pressed");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-pressed", "true");
    renderMenu(btn.dataset.category);
  });

  /* ----- Basket logic ----- */
  function addToBasket(item, sizeKey) {
    const size = sizeKey ? SIZES.find(function (s) { return s.key === sizeKey; }) : null;
    const key = item.id + "|" + (size ? size.key : "none");
    const existing = basket.find(function (line) { return line.key === key; });

    if (existing) {
      existing.qty += 1;
    } else {
      basket.push({
        key: key,
        name: item.name,
        sizeLabel: size ? size.label : "",
        unitPrice: item.price + (size ? size.extra : 0),
        qty: 1
      });
    }
    hideOrderMessage();
    renderBasket();
  }

  function changeQty(key, delta) {
    const line = basket.find(function (l) { return l.key === key; });
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) {
      basket = basket.filter(function (l) { return l.key !== key; });
    }
    renderBasket();
  }

  function renderBasket() {
    basketList.textContent = "";
    let total = 0;

    basket.forEach(function (line) {
      total += line.unitPrice * line.qty;

      const li = document.createElement("li");

      const info = document.createElement("span");
      info.textContent = line.qty + " x " + line.name + (line.sizeLabel ? " (" + line.sizeLabel + ")" : "") +
        " - " + formatPrice(line.unitPrice * line.qty);

      const controls = document.createElement("span");
      controls.className = "qty-controls";

      const minus = document.createElement("button");
      minus.type = "button";
      minus.textContent = "-";
      minus.setAttribute("aria-label", "Remove one " + line.name);
      minus.addEventListener("click", function () { changeQty(line.key, -1); });

      const plus = document.createElement("button");
      plus.type = "button";
      plus.textContent = "+";
      plus.setAttribute("aria-label", "Add one " + line.name);
      plus.addEventListener("click", function () { changeQty(line.key, 1); });

      controls.append(minus, plus);
      li.append(info, controls);
      basketList.appendChild(li);
    });

    basketTotal.textContent = formatPrice(total);
    emptyMessage.classList.toggle("hidden", basket.length > 0);
    placeOrder.disabled = basket.length === 0;
  }

  clearBtn.addEventListener("click", function () {
    basket = [];
    hideOrderMessage();
    renderBasket();
  });

  /* ----- Checkout form validation ----- */
  function setError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    document.getElementById(errorId).textContent = message;
    input.classList.toggle("invalid", message !== "");
    return message === "";
  }

  function validateOrderForm() {
    const name = document.getElementById("name").value.trim();
    const address = document.getElementById("address").value.trim();
    const phone = document.getElementById("phone").value.trim();

    const okName = setError("name", "nameError", name.length < 2 ? "Please enter your name." : "");
    const okAddress = setError("address", "addressError", address.length < 5 ? "Please enter your full delivery address." : "");
    // Digits, spaces, + and - allowed; at least 10 digits in total
    const digits = phone.replace(/\D/g, "");
    const phoneValid = /^[0-9+\-\s()]+$/.test(phone) && digits.length >= 10;
    const okPhone = setError("phone", "phoneError", phoneValid ? "" : "Please enter a valid phone number (at least 10 digits).");

    return okName && okAddress && okPhone;
  }

  function hideOrderMessage() {
    orderMessage.classList.add("hidden");
    orderMessage.textContent = "";
  }

  orderForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (basket.length === 0) return;
    if (!validateOrderForm()) return;

    const name = document.getElementById("name").value.trim();
    const total = basketTotal.textContent;

    orderMessage.textContent = "Thanks " + name + "! Your order of " + total +
      " has been placed. Your pizza is on its way (about 30 minutes).";
    orderMessage.classList.remove("hidden");

    basket = [];
    orderForm.reset();
    renderBasket();
  });

  // Initial render
  renderMenu("all");
  renderBasket();
})();

/* ---------- 3. Contact page ---------- */
(function initContactPage() {
  const form = document.getElementById("contactForm");
  if (!form) return; // not on the contact page

  const message = document.getElementById("contactMessage");

  function setError(inputId, errorId, text) {
    document.getElementById(errorId).textContent = text;
    document.getElementById(inputId).classList.toggle("invalid", text !== "");
    return text === "";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("cName").value.trim();
    const email = document.getElementById("cEmail").value.trim();
    const topic = document.getElementById("cTopic").value;
    const text = document.getElementById("cMessage").value.trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const results = [
      setError("cName", "cNameError", name.length < 2 ? "Please enter your name." : ""),
      setError("cEmail", "cEmailError", emailPattern.test(email) ? "" : "Please enter a valid email address."),
      setError("cTopic", "cTopicError", topic === "" ? "Please choose a topic." : ""),
      setError("cMessage", "cMessageError", text.length < 10 ? "Please write at least 10 characters." : "")
    ];

    if (results.indexOf(false) !== -1) {
      message.classList.add("hidden");
      return;
    }

    message.textContent = "Thanks " + name + ", your message has been sent. We'll reply to " + email + " soon.";
    message.classList.remove("hidden");
    form.reset();
  });
})();
