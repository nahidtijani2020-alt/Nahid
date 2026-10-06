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

function closeMobileMenu() {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#nav");
  if (!navToggle || !nav) return;

  nav.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
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
  if (!counters.length || !("IntersectionObserver" in window)) {
    counters.forEach((el) => {
      el.textContent = Number(el.dataset.count).toLocaleString();
    });
    return;
  }

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
  if (!customInput || !summary || !programSelect) return;
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
  const name = document.querySelector("#c-name");
  const email = document.querySelector("#c-email");
  const message = document.querySelector("#c-message");
  const success = document.querySelector("#contact-success");
  if (!name || !email || !message || !success) return;

  contactForm.onsubmit = (event) => {
    event.preventDefault();
    const nameOk = setError(name, name.value.trim() ? "" : "Enter your name.");
    const emailOk = setError(email, isEmail(email.value.trim()) ? "" : "Enter a valid email address.");
    const msgOk = setError(message, message.value.trim().length >= 10 ? "" : "Write at least 10 characters.");

    if (!(nameOk && emailOk && msgOk)) return;

    contactForm.hidden = true;
    success.hidden = false;
  };
}

let pageLoadController;
let pageLoadId = 0;
let pageTransitionAnimation;

async function loadPage(url, { historyMode = "push", scroll = true } = {}) {
  const targetUrl = new URL(url, window.location.href);
  if (targetUrl.origin !== window.location.origin) return;

  pageLoadController?.abort();
  pageTransitionAnimation?.cancel();
  pageTransitionAnimation = null;
  pageLoadController = new AbortController();
  const controller = pageLoadController;
  const currentLoadId = ++pageLoadId;

  try {
    const response = await fetch(targetUrl.href, { signal: controller.signal });
    if (!response.ok) throw new Error(`Page request failed (${response.status})`);

    const html = await response.text();
    const nextDocument = new DOMParser().parseFromString(html, "text/html");
    const nextMain = nextDocument.querySelector("main");
    if (!nextMain) throw new Error("The requested page does not contain a main element.");

    if (currentLoadId !== pageLoadId) return;

    const currentMain = document.querySelector("main");
    if (!currentMain) throw new Error("The current page does not contain a main element.");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion && currentMain.animate) {
      pageTransitionAnimation = currentMain.animate(
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(-8px)" }
        ],
        { duration: 140, easing: "ease-in", fill: "forwards" }
      );
      await pageTransitionAnimation.finished;
      pageTransitionAnimation = null;
    }

    if (currentLoadId !== pageLoadId) return;

    currentMain.replaceWith(nextMain);
    document.title = nextDocument.title || "Hopebridge Foundation";

    const nextDescription = nextDocument.querySelector('meta[name="description"]');
    let currentDescription = document.querySelector('meta[name="description"]');
    if (nextDescription) {
      if (!currentDescription) {
        currentDescription = document.createElement("meta");
        currentDescription.name = "description";
        document.head.appendChild(currentDescription);
      }
      currentDescription.content = nextDescription.content;
    }

    if (historyMode === "push") {
      history.pushState({ hopebridgePage: true }, "", targetUrl.href);
    }

    closeMobileMenu();
    setCurrentPageLink();
    updateYear();
    initPage();

    if (scroll && targetUrl.hash) {
      const targetId = decodeURIComponent(targetUrl.hash.slice(1));
      document.getElementById(targetId)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    } else if (scroll) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    if (!reduceMotion && nextMain.animate) {
      nextMain.animate(
        [
          { opacity: 0, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" }
        ],
        { duration: 220, easing: "ease-out" }
      );
    }
  } catch (error) {
    if (error.name === "AbortError" || currentLoadId !== pageLoadId) return;
    console.error("Unable to switch pages smoothly; loading the destination normally.", error);
    window.location.assign(targetUrl.href);
  }
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
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!link) return;
  if ((link.target && link.target !== "_self") || link.hasAttribute("download")) return;

  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return;

  const sameDocument = url.pathname === window.location.pathname && url.search === window.location.search;
  if (sameDocument) return;
  event.preventDefault();
  loadPage(url.href);
});

window.addEventListener("popstate", () => {
  loadPage(window.location.href, { historyMode: "none" });
});

history.replaceState(
  { ...(history.state && typeof history.state === "object" ? history.state : {}), hopebridgePage: true },
  "",
  window.location.href
);

initPage();
