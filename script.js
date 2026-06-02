/* ── SELECTORS ───────────────────────────── */
const pages       = document.querySelectorAll(".page");
const pageButtons = document.querySelectorAll("[data-page]");
const navItems    = document.querySelectorAll(".nav-item");
const feedFilters = document.querySelectorAll("[data-filter]");
const feedCards   = document.querySelectorAll("[data-feed-card]");
const regionBtns  = document.querySelectorAll("[data-region]");
const oppSearch   = document.querySelector("#opportunitySearch");
const oppCards    = document.querySelectorAll(".opportunity-card");
const toggleBtns  = document.querySelectorAll("[data-toggle-label]");
const toast       = document.querySelector("#toast");
const composerBtn = document.querySelector("#openComposer");
const composerModal = document.querySelector("#composerModal");
const globalSearch  = document.querySelector("#globalSearch");
const threads       = document.querySelectorAll(".thread");
const chatMessages  = document.querySelector(".chat-messages");
const composeInput  = document.querySelector(".compose input");
const composeSend   = document.querySelector(".compose button");
const roleBtns      = document.querySelectorAll(".role-btn");
const roleElements  = document.querySelectorAll("[data-role-show]");

let selectedRegion = "all";

/* ── TOAST ───────────────────────────────── */
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 1600);
}

/* ── PAGE NAVIGATION ─────────────────────── */
function showPage(id) {
  const target = document.querySelector(`#${id}`);
  if (!target) return;
  pages.forEach(p => p.classList.remove("active"));
  target.classList.add("active");
  navItems.forEach(n => n.classList.toggle("active", n.dataset.page === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

pageButtons.forEach(btn => btn.addEventListener("click", () => showPage(btn.dataset.page)));

/* ── ROLE SWITCHER ───────────────────────── */
const roleConfig = {
  player: {
    name:     "Jalen Wilson",
    role:     "Player · SG",
    greeting: "Welcome back, Jalen",
    pipeline: ["Your Recruiting Pipeline", "Track every opportunity from discovery to contract signing."],
  },
  coach: {
    name:     "Coach Rivera",
    role:     "Head Coach",
    greeting: "Good day, Coach Rivera",
    pipeline: ["Player Evaluation Pipeline", "Track candidates from prospect to signed contract."],
  },
  agent: {
    name:     "Marcus Kline",
    role:     "Sports Agent",
    greeting: "Good evening, Marcus Kline",
    pipeline: ["Deal Pipeline", "Track client negotiations from first contact to signed deal."],
  },
};

function setRole(role) {
  roleBtns.forEach(b => b.classList.toggle("active", b.dataset.role === role));

  roleElements.forEach(el => {
    el.style.display = el.dataset.roleShow === role ? "" : "none";
  });

  const cfg = roleConfig[role];
  const nameEl  = document.getElementById("topbarName");
  const roleEl  = document.getElementById("topbarRole");
  const ptEl    = document.getElementById("pipelineTitle");
  const psEl    = document.getElementById("pipelineSubtitle");

  if (nameEl) nameEl.textContent = cfg.name;
  if (roleEl) roleEl.textContent = cfg.role;
  if (ptEl)   ptEl.textContent   = cfg.pipeline[0];
  if (psEl)   psEl.textContent   = cfg.pipeline[1];

  const greetEl = document.getElementById("homeGreeting");
  if (greetEl) greetEl.textContent = cfg.greeting;
}

roleBtns.forEach(btn => btn.addEventListener("click", () => setRole(btn.dataset.role)));

/* ── FEED FILTER ─────────────────────────── */
feedFilters.forEach(f => {
  f.addEventListener("click", () => {
    feedFilters.forEach(x => x.classList.remove("active"));
    f.classList.add("active");
    const sel = f.dataset.filter;
    feedCards.forEach(c => {
      c.hidden = sel !== "all" && !c.dataset.feedCard.includes(sel);
    });
  });
});

/* ── OPPORTUNITY FILTER ──────────────────── */
function filterOpps() {
  const q = (oppSearch?.value || "").trim().toLowerCase();
  oppCards.forEach(c => {
    const regionOk = selectedRegion === "all" || c.dataset.region === selectedRegion;
    const textOk   = !q || (c.textContent + " " + (c.dataset.search || "")).toLowerCase().includes(q);
    c.hidden = !regionOk || !textOk;
  });
}

regionBtns.forEach(b => {
  b.addEventListener("click", () => {
    regionBtns.forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    selectedRegion = b.dataset.region;
    filterOpps();
  });
});

oppSearch?.addEventListener("input", filterOpps);

/* ── TOGGLE BUTTONS (like/save) ──────────── */
toggleBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const [off, on] = btn.dataset.toggleLabel.split("|");
    const active = btn.classList.toggle("active");
    btn.textContent = active ? on : off;
    showToast(active ? on.replace(/[★♥]\s?/, "") : "Removed");
  });
});

/* ── COMPOSER ────────────────────────────── */
composerBtn?.addEventListener("click", () => {
  composerModal.classList.add("open");
  composerModal.querySelector("textarea").focus();
});

document.querySelector("#composerClose")?.addEventListener("click", () => {
  composerModal.classList.remove("open");
});

composerModal?.addEventListener("click", e => {
  if (e.target === composerModal) composerModal.classList.remove("open");
});

document.querySelector("#composerPost")?.addEventListener("click", () => {
  composerModal.classList.remove("open");
  showToast("Highlight posted!");
});

/* ── MESSAGES ────────────────────────────── */
threads.forEach(t => {
  t.addEventListener("click", () => {
    threads.forEach(x => x.classList.remove("active"));
    t.classList.add("active");
  });
});

function sendMessage() {
  const text = composeInput?.value.trim();
  if (!text) return;
  const msg = document.createElement("div");
  msg.className = "message sent";
  msg.textContent = text;
  chatMessages?.appendChild(msg);
  if (composeInput) composeInput.value = "";
  msg.scrollIntoView({ behavior: "smooth" });
}

composeSend?.addEventListener("click", sendMessage);
composeInput?.addEventListener("keydown", e => {
  if (e.key === "Enter" && composeInput.value.trim()) sendMessage();
});

/* ── GLOBAL SEARCH ───────────────────────── */
globalSearch?.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  const q = globalSearch.value.trim();
  if (!q) return;
  if (/spain|germany|australia|portugal|japan|canada|league|opportunit/i.test(q)) {
    showPage("opportunities");
    if (oppSearch) { oppSearch.value = q; filterOpps(); }
    return;
  }
  if (/salary|contract|financial|money|commission|cost/i.test(q)) {
    showPage("financial");
    return;
  }
  if (/pipeline|stage|offer|applied/i.test(q)) {
    showPage("pipeline");
    return;
  }
  showPage("discover");
  showToast(`Searching for "${q}"`);
});

/* ── COMMISSION CALCULATOR ───────────────── */
const calcMonthly = document.getElementById("calcMonthly");
const calcMonths  = document.getElementById("calcMonths");
const calcRate    = document.getElementById("calcRate");
const calcOutput  = document.getElementById("calcOutput");

function updateCalc() {
  const monthly = parseFloat(calcMonthly?.value) || 0;
  const months  = parseFloat(calcMonths?.value)  || 0;
  const rate    = parseFloat(calcRate?.value)    || 0;
  const result  = (monthly * months * rate) / 100;
  if (calcOutput) {
    calcOutput.textContent = "$" + result.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
}

[calcMonthly, calcMonths, calcRate].forEach(el => el?.addEventListener("input", updateCalc));
