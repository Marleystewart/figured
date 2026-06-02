const pages = document.querySelectorAll(".page");
const pageButtons = document.querySelectorAll("[data-page]");
const navItems = document.querySelectorAll(".nav-item");
const feedFilters = document.querySelectorAll("[data-filter]");
const feedCards = document.querySelectorAll("[data-feed-card]");
const regionButtons = document.querySelectorAll("[data-region]");
const opportunitySearch = document.querySelector("#opportunitySearch");
const opportunityCards = document.querySelectorAll(".opportunity-card");
const toggleButtons = document.querySelectorAll("[data-toggle-label]");
const toast = document.querySelector("#toast");
const composerButton = document.querySelector("#openComposer");
const composerModal = document.querySelector("#composerModal");
const globalSearch = document.querySelector("#globalSearch");
const threads = document.querySelectorAll(".thread");
const chatMessages = document.querySelector(".chat-panel");
const composeInput = document.querySelector(".compose input");
const composeSend = document.querySelector(".compose button");

let selectedRegion = "all";

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1500);
}

function showPage(pageId) {
  const target = document.querySelector(`#${pageId}`);

  if (!target) return;

  pages.forEach((page) => page.classList.remove("active"));
  target.classList.add("active");

  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.page === pageId);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

pageButtons.forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

feedFilters.forEach((filter) => {
  filter.addEventListener("click", () => {
    feedFilters.forEach((item) => item.classList.remove("active"));
    filter.classList.add("active");

    const selected = filter.dataset.filter;
    feedCards.forEach((card) => {
      card.hidden = selected !== "all" && !card.dataset.feedCard.includes(selected);
    });
  });
});

function filterOpportunities() {
  const query = opportunitySearch.value.trim().toLowerCase();

  opportunityCards.forEach((card) => {
    const matchesRegion = selectedRegion === "all" || card.dataset.region === selectedRegion;
    const matchesSearch = !query || `${card.textContent} ${card.dataset.search}`.toLowerCase().includes(query);
    card.hidden = !matchesRegion || !matchesSearch;
  });
}

regionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    regionButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    selectedRegion = button.dataset.region;
    filterOpportunities();
  });
});

opportunitySearch.addEventListener("input", filterOpportunities);

toggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const [offLabel, onLabel] = button.dataset.toggleLabel.split("|");
    const active = button.classList.toggle("active");
    button.textContent = active ? onLabel : offLabel;
    showToast(active ? onLabel.replace("★ ", "").replace("♥ ", "") : "Updated");
  });
});

composerButton.addEventListener("click", () => {
  composerModal.classList.add("open");
  composerModal.querySelector("textarea").focus();
});

document.querySelector("#composerClose").addEventListener("click", () => {
  composerModal.classList.remove("open");
});

composerModal.addEventListener("click", (e) => {
  if (e.target === composerModal) composerModal.classList.remove("open");
});

document.querySelector("#composerPost").addEventListener("click", () => {
  composerModal.classList.remove("open");
  showToast("Highlight posted!");
});

threads.forEach((thread) => {
  thread.addEventListener("click", () => {
    threads.forEach((t) => t.classList.remove("active"));
    thread.classList.add("active");
  });
});

composeSend.addEventListener("click", sendMessage);
composeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && composeInput.value.trim()) sendMessage();
});

function sendMessage() {
  const text = composeInput.value.trim();
  if (!text) return;
  const msg = document.createElement("div");
  msg.className = "message sent";
  msg.textContent = text;
  chatMessages.insertBefore(msg, chatMessages.querySelector(".compose"));
  composeInput.value = "";
  msg.scrollIntoView({ behavior: "smooth" });
}

globalSearch.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;

  const query = globalSearch.value.trim();

  if (!query) return;

  if (/spain|germany|australia|portugal|league|opportunity/i.test(query)) {
    showPage("opportunities");
    opportunitySearch.value = query;
    filterOpportunities();
    return;
  }

  showPage("discover");
  showToast(`Searching for ${query}`);
});
