/* ==========================================================
   Hopebridge Foundation – shared script for all pages
   ========================================================== */

// ---------- Helpers ----------
const $ = (selector) => document.querySelector(selector);
const isEmail = (text) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

// Show or clear an error under a field (the error <p> has id "<fieldId>-error")
function setError(input, message) {
  const error = document.getElementById(`${input.id}-error`);
  if (error) error.textContent = message;
  input.classList.toggle("invalid", Boolean(message));
  return !message; // true when valid
}

// ---------- 1. Footer year ----------
const year = $("#year");
if (year) year.textContent = new Date().getFullYear();

// ---------- 2. Mobile menu ----------
const navToggle = $(".nav-toggle");
const nav = $("#nav");
if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open);
  });
}

// ---------- 3. Impact numbers count up (home page) ----------
const counters = document.querySelectorAll("[data-count]");

function runCounter(el) {
  const target = Number(el.dataset.count);
  const steps = 60;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    el.textContent = Math.round((target * step) / steps).toLocaleString();
    if (step >= steps) clearInterval(timer);
  }, 20);
}

if (counters.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        runCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  });
  counters.forEach((el) => observer.observe(el));
}

// ---------- 4. Donate page ----------
const donateForm = $("#donate-form");

if (donateForm) {
  const amountButtons = document.querySelectorAll(".amount");
  const customInput = $("#custom");
  const summary = $("#summary");
  const programSelect = $("#program");
  let amount = 0;

  // Text like "Your gift: $25 one-time to Education"
  function updateSummary() {
    const freq = donateForm.querySelector('input[name="freq"]:checked').value;
    summary.textContent = amount > 0
      ? `Your gift: $${amount} ${freq} to ${programSelect.value}`
      : "Choose an amount to continue.";
  }

  // Preset amount buttons
  amountButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      amountButtons.forEach((b) => b.setAttribute("aria-pressed", b === btn));
      amount = Number(btn.dataset.amount);
      customInput.value = "";
      setError(customInput, "");
      updateSummary();
    });
  });

  // Custom amount
  customInput.addEventListener("input", () => {
    amountButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
    amount = parseFloat(customInput.value) || 0;
    updateSummary();
  });

  donateForm.addEventListener("change", updateSummary);

  // Pre-select a program from the link, e.g. donate.html?program=health
  const wanted = new URLSearchParams(location.search).get("program");
  const programNames = { education: "Education", food: "Food and nutrition", health: "Health care", water: "Clean water" };
  if (wanted && programNames[wanted]) programSelect.value = programNames[wanted];
  updateSummary();

  // Submit with validation
  donateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("#name");
    const email = $("#email");

    const amountOk = amount > 0
      ? setError(customInput, "")
      : setError(customInput, "Choose an amount or enter your own.");
    const nameOk = setError(name, name.value.trim() ? "" : "Enter your name.");
    const emailOk = setError(email, isEmail(email.value.trim()) ? "" : "Enter a valid email address.");

    if (!(amountOk && nameOk && emailOk)) return;

    $("#thanks-name").textContent = name.value.trim().split(" ")[0];
    $("#thanks-detail").textContent = `${summary.textContent.replace("Your gift: ", "Your gift of ")} has been recorded. A receipt would be sent to ${email.value.trim()}.`;
    donateForm.hidden = true;
    $("#donate-success").hidden = false;
  });
}

// ---------- 5. Contact page ----------
const contactForm = $("#contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("#c-name");
    const email = $("#c-email");
    const message = $("#c-message");

    const nameOk = setError(name, name.value.trim() ? "" : "Enter your name.");
    const emailOk = setError(email, isEmail(email.value.trim()) ? "" : "Enter a valid email address.");
    const msgOk = setError(message, message.value.trim().length >= 10 ? "" : "Write at least 10 characters.");

    if (!(nameOk && emailOk && msgOk)) return;

    contactForm.hidden = true;
    $("#contact-success").hidden = false;
  });
}


// Fade out before following links to other pages on this site
document.querySelectorAll("a[href]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const url = new URL(link.href);

    // Skip external links, new tabs, same-page anchors and modifier keys
    const external = url.origin !== location.origin;
    const newTab = link.target === "_blank" || event.ctrlKey || event.metaKey;
    const samePage = url.pathname === location.pathname && url.hash;
    if (external || newTab || samePage) return;

    event.preventDefault();
    document.body.classList.add("leaving");
    setTimeout(() => (location.href = link.href), 250);
  });
});

// If the user presses the Back button, remove the fade-out state
window.addEventListener("pageshow", () => {
  document.body.classList.remove("leaving");
});