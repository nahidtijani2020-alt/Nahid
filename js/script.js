/* ==========================================================
   Hopebridge Foundation – shared script for all pages
   ========================================================== */

const isEmail = (text) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

function setError(input, message) {
  const error = document.getElementById(`${input.id}-error`);
  if (error) error.textContent = message;
  input.classList.toggle("invalid", Boolean(message));
  return !message;
}

function updateYear() {
  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();
}

function setCurrentPageLink() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a[href$='.html']").forEach((link) => {
    const match = (link.getAttribute("href") || "").split("/").pop() === path;
    if (match) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function initMobileMenu() {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#nav");
  if (!navToggle || !nav || navToggle.dataset.bound === "true") return;

  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open);
  });
  navToggle.dataset.bound = "true";
}

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

function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        runCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });

  counters.forEach((el) => observer.observe(el));
}

function initDonateForm() {
  const donateForm = document.querySelector("#donate-form");
  if (!donateForm) return;

  const amountButtons = document.querySelectorAll(".amount");
  const customInput = document.querySelector("#custom");
  const summary = document.querySelector("#summary");
  const programSelect = document.querySelector("#program");
  let amount = 0;

  function updateSummary() {
    const freq = donateForm.querySelector('input[name="freq"]:checked').value;
    summary.textContent = amount > 0
      ? `Your gift: $${amount} ${freq} to ${programSelect.value}`
      : "Choose an amount to continue.";
  }

  amountButtons.forEach((btn) => {
    btn.onclick = () => {
      amountButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      amount = Number(btn.dataset.amount);
      customInput.value = "";
      setError(customInput, "");
      updateSummary();
    };
  });

  customInput.oninput = () => {
    amountButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
    amount = parseFloat(customInput.value) || 0;
    updateSummary();
  };

  donateForm.onchange = updateSummary;

  const wanted = new URLSearchParams(window.location.search).get("program");
  const programNames = { education: "Education", food: "Food and nutrition", health: "Health care", water: "Clean water" };
  if (wanted && programNames[wanted]) programSelect.value = programNames[wanted];
  updateSummary();

  donateForm.onsubmit = (event) => {
    event.preventDefault();
    const name = document.querySelector("#name");
    const email = document.querySelector("#email");

    const amountOk = amount > 0
      ? setError(customInput, "")
      : setError(customInput, "Choose an amount or enter your own.");
    const nameOk = setError(name, name.value.trim() ? "" : "Enter your name.");
    const emailOk = setError(email, isEmail(email.value.trim()) ? "" : "Enter a valid email address.");

    if (!(amountOk && nameOk && emailOk)) return;

    document.querySelector("#thanks-name").textContent = name.value.trim().split(" ")[0];
    document.querySelector("#thanks-detail").textContent = `${summary.textContent.replace("Your gift: ", "Your gift of ")} has been recorded. A receipt would be sent to ${email.value.trim()}.`;
    donateForm.hidden = true;
    document.querySelector("#donate-success").hidden = false;
  };
}

function initContactForm() {
  const contactForm = document.querySelector("#contact-form");
  if (!contactForm) return;

  contactForm.onsubmit = (event) => {
    event.preventDefault();
    const name = document.querySelector("#c-name");
    const email = document.querySelector("#c-email");
    const message = document.querySelector("#c-message");

    const nameOk = setError(name, name.value.trim() ? "" : "Enter your name.");
    const emailOk = setError(email, isEmail(email.value.trim()) ? "" : "Enter a valid email address.");
    const msgOk = setError(message, message.value.trim().length >= 10 ? "" : "Write at least 10 characters.");

    if (!(nameOk && emailOk && msgOk)) return;

    contactForm.hidden = true;
    document.querySelector("#contact-success").hidden = false;
  };
}

function loadPage(url) {
  const targetUrl = new URL(url, window.location.href);
  if (targetUrl.origin !== window.location.origin) return;

  const currentMain = document.querySelector("main");
  if (!currentMain) return;

  currentMain.classList.add("page-leave");

  fetch(targetUrl.href)
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.text();
    })
    .then((html) => {
      const tempDoc = document.implementation.createHTMLDocument("");
      tempDoc.documentElement.innerHTML = html;
      const nextMain = tempDoc.querySelector("main");
      if (!nextMain) throw new Error("No main content found");

      const nextTitle = tempDoc.title || "Hopebridge Foundation";
      document.title = nextTitle;

      const metaDescription = tempDoc.querySelector('meta[name="description"]');
      let currentMeta = document.querySelector('meta[name="description"]');
      if (!currentMeta) {
        currentMeta = document.createElement("meta");
        currentMeta.setAttribute("name", "description");
        document.head.appendChild(currentMeta);
      }
      if (metaDescription) currentMeta.setAttribute("content", metaDescription.getAttribute("content") || "");

      const parent = currentMain.parentNode;
      parent.insertBefore(nextMain, currentMain.nextSibling);
      nextMain.classList.add("page-enter");
      currentMain.classList.add("page-leave");
      setCurrentPageLink();
      updateYear();
      initPage();
      history.pushState({ url: targetUrl.href }, "", targetUrl.href);
      window.scrollTo({ top: 0, behavior: "auto" });

      setTimeout(() => {
        currentMain.remove();
      }, 220);
    })
    .catch(() => {
      window.location.assign(targetUrl.href);
    });
}

function initPage() {
  updateYear();
  setCurrentPageLink();
  initMobileMenu();
  initCounters();
  initDonateForm();
  initContactForm();
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  if (!link) return;

  const href = link.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || link.target === "_blank") return;

  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin || link.pathname === window.location.pathname) return;

  event.preventDefault();
  loadPage(url.href);
});

window.addEventListener("popstate", (event) => {
  if (event.state && event.state.url) {
    loadPage(event.state.url);
  }
});

initPage();

