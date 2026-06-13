const events = [
  {
    id: "latin-social",
    name: "Latin Social NYC",
    date: "Saturday, June 14",
    shortDate: "Jun 14",
    time: "9:00 PM - 2:00 AM",
    location: "La Terraza, Queens",
    area: "Queens, NY",
    styles: ["Salsa", "Bachata", "Merengue"],
    going: 128,
    price: "$18",
    photo: "photo-1",
    level: "Beginner-friendly",
    dress: "Smart casual",
    organizer: "Latin Connect Collective",
    music: "Salsa, Bachata, Merengue",
    pin: "pin-red",
    x: 60,
    y: 38
  },
  {
    id: "bachata-lab",
    name: "Beginner Bachata Lab",
    date: "Today",
    shortDate: "Tonight",
    time: "7:30 PM - 9:00 PM",
    location: "Brooklyn Dance Loft",
    area: "Brooklyn, NY",
    styles: ["Bachata"],
    going: 42,
    price: "$12",
    photo: "photo-2",
    level: "Beginner-friendly",
    dress: "Comfortable shoes",
    organizer: "Bachata Room BK",
    music: "Modern Bachata",
    pin: "pin-blue",
    x: 28,
    y: 31
  },
  {
    id: "zouk-room",
    name: "Kizomba & Zouk Room",
    date: "Tonight",
    shortDate: "Tonight",
    time: "8:30 PM - 12:30 AM",
    location: "Studio 38",
    area: "Manhattan, NY",
    styles: ["Kizomba", "Zouk"],
    going: 76,
    price: "$20",
    photo: "photo-3",
    level: "All levels",
    dress: "Elegant casual",
    organizer: "Urban Flow Social",
    music: "Kizomba, Zouk, Tarraxinha",
    pin: "pin-gold",
    x: 42,
    y: 58
  },
  {
    id: "swing-night",
    name: "Swing Community Night",
    date: "Sunday, June 15",
    shortDate: "Jun 15",
    time: "6:00 PM - 10:00 PM",
    location: "Riverside Hall",
    area: "Harlem, NY",
    styles: ["Swing", "Country Swing"],
    going: 91,
    price: "Free",
    photo: "photo-4",
    level: "All levels",
    dress: "Casual",
    organizer: "City Swing Friends",
    music: "Swing, Country Swing",
    pin: "pin-red",
    x: 72,
    y: 66
  }
];

const posts = [
  { name: "Iris Rivera", meta: "Brooklyn - Salsa, Bachata", avatar: "IR", photo: "photo-5", text: "Friday recap: first time dancing merengue with the whole group. Warm floor, kind leads, great music.", likes: 48 },
  { name: "Dario Miles", meta: "Queens - West Coast Swing", avatar: "DM", photo: "photo-4", text: "Short practice clip from the all-level swing room. Loved seeing beginners jump in.", likes: 31 }
];

const messages = [
  { from: "Latin Connect Group", avatar: "LC", tone: "red", time: "Now", body: "Meet by the front table at 9:15?" },
  { from: "Ana & Marcus", avatar: "AM", tone: "blue", time: "12m", body: "We are going to the beginner lab too." },
  { from: "Queens Salsa Friends", avatar: "QS", tone: "gold", time: "1h", body: "New playlist is up for Saturday." }
];

const state = {
  route: "discover",
  filter: "All Styles",
  query: "",
  selectedEventId: "latin-social",
  goingIds: new Set(),
  likedPosts: new Set(),
  selectedMessage: 0
};

const root = document.querySelector("#app-root");
const statusEl = document.querySelector("#prototype-status");
const navButtons = [...document.querySelectorAll(".app-nav button")];

function eventById(id) {
  return events.find((event) => event.id === id) || events[0];
}

function filteredEvents() {
  const query = state.query.trim().toLowerCase();
  return events.filter((event) => {
    const matchesStyle = state.filter === "All Styles" || event.styles.includes(state.filter);
    const haystack = `${event.name} ${event.area} ${event.styles.join(" ")}`.toLowerCase();
    return matchesStyle && (!query || haystack.includes(query));
  });
}

function setRoute(route) {
  state.route = route;
  render();
}

function setStatus(message) {
  statusEl.textContent = message;
}

function iconButton(label, content = "") {
  return `<button class="compose-button" aria-label="${label}">${content || "+"}</button>`;
}

function appHeader(kicker, title, action = iconButton("Create")) {
  return `
    <header class="app-header live-header">
      <div>
        <span class="location">${kicker}</span>
        <h2>${title}</h2>
      </div>
      ${action}
    </header>
  `;
}

function renderDiscover() {
  const list = filteredEvents();
  setStatus(`${list.length} event${list.length === 1 ? "" : "s"} match ${state.filter}`);
  root.innerHTML = `
    ${appHeader("New York, NY", "Discover", '<button class="avatar-button" data-route-target="profile" aria-label="Open profile">M</button>')}
    <label class="search">
      <span aria-hidden="true">⌕</span>
      <input data-search value="${state.query || "Dance socials near me"}" aria-label="Search events" />
    </label>
    <div class="chip-row" aria-label="Dance style filters">
      ${["All Styles", "Salsa", "Bachata", "Merengue", "Kizomba", "Zouk", "Swing", "Country Swing"].map((style) => `
        <button class="chip ${state.filter === style ? "active" : ""}" data-filter="${style}">${style}</button>
      `).join("")}
    </div>
    <section class="today-strip" aria-label="Tonight summary">
      <div><strong>${list.length}</strong><span>matches</span></div>
      <div><strong>${list.reduce((sum, event) => sum + event.going + (state.goingIds.has(event.id) ? 1 : 0), 0)}</strong><span>dancers going</span></div>
      <div><strong>${list.filter((event) => event.level.includes("Beginner")).length}</strong><span>beginner socials</span></div>
    </section>
    <section class="event-list live-list">
      ${list.map((event, index) => renderEventCard(event, index === 0)).join("") || '<div class="empty-state">No events match that search yet.</div>'}
    </section>
  `;
}

function renderEventCard(event, featured = false) {
  const going = event.going + (state.goingIds.has(event.id) ? 1 : 0);
  return `
    <article class="event-card ${featured ? "featured" : "compact-card"}" data-open-event="${event.id}" tabindex="0">
      <div class="photo ${event.photo}"></div>
      <div class="event-copy">
        <div class="event-topline"><span>${event.date}</span><strong>${going} Going</strong></div>
        <h3>${event.name}</h3>
        <p>${event.time}</p>
        <p>${event.area}</p>
        <div class="style-tags">${event.styles.map((style) => `<span>${style}</span>`).join("")}</div>
      </div>
    </article>
  `;
}

function renderDetails() {
  const event = eventById(state.selectedEventId);
  const isGoing = state.goingIds.has(event.id);
  setStatus(`Viewing ${event.name}`);
  root.innerHTML = `
    <div class="hero photo ${event.photo}">
      <button class="round-button" data-route-target="discover" aria-label="Back">‹</button>
      <button class="round-button" data-save-event aria-label="Save">♡</button>
    </div>
    <section class="detail-body live-detail-body">
      <div class="title-row">
        <div>
          <p class="eyebrow">${event.level} social</p>
          <h2>${event.name}</h2>
        </div>
        <span class="price">${event.price}</span>
      </div>
      <div class="info-stack">
        <div class="info-item"><span>${event.date}</span><strong>${event.time}</strong></div>
        <div class="info-item"><span>Location</span><strong>${event.location}</strong></div>
      </div>
      <div class="map-preview" data-route-target="events"><div class="mini-pin red-pin"></div><p>Open map</p></div>
      <section class="organizer"><div class="mini-avatar">LC</div><div><span>Organizer</span><strong>${event.organizer}</strong></div></section>
      <div class="detail-grid">
        <article><span>Music</span><strong>${event.music}</strong></article>
        <article><span>Dress code</span><strong>${event.dress}</strong></article>
        <article><span>Level</span><strong>${event.level}</strong></article>
        <article><span>Price</span><strong>${event.price}</strong></article>
      </div>
      <section class="attendees"><div><h3>${event.going + (isGoing ? 1 : 0)} going</h3><p>${isGoing ? "You're on the list" : "Friends and dancers nearby"}</p></div><div class="face-row"><span>A</span><span>J</span><span>R</span><span>+9</span></div></section>
    </section>
    <div class="sticky-cta"><button data-going="${event.id}">${isGoing ? "You're Going" : "I'm Going"}</button></div>
  `;
}

function renderMap() {
  const selected = eventById(state.selectedEventId);
  setStatus(`Map centered near ${selected.area}`);
  root.innerHTML = `
    <header class="map-top">
      <label class="search small-search"><span aria-hidden="true">⌕</span><input value="Tonight near Queens" aria-label="Map search" /></label>
      <button class="map-filter">Filters</button>
    </header>
    <section class="map-canvas" aria-label="Interactive event map preview">
      <div class="street s1"></div><div class="street s2"></div><div class="street s3"></div><div class="street s4"></div>
      ${events.map((event) => `<button class="pin ${event.pin} ${event.id === selected.id ? "selected-pin" : ""}" data-map-event="${event.id}" style="left: ${event.x}%; top: ${event.y}%;">${event.price}</button>`).join("")}
      <div class="user-dot" style="left: 50%; top: 49%;"></div>
    </section>
    <article class="floating-event" data-open-event="${selected.id}">
      <div class="photo ${selected.photo}"></div>
      <div>
        <span>${selected.shortDate} - ${selected.time.split(" - ")[0]}</span>
        <h3>${selected.name}</h3>
        <p>${selected.area}</p>
        <strong>${selected.going + (state.goingIds.has(selected.id) ? 1 : 0)} Going</strong>
      </div>
    </article>
  `;
}

function renderCommunity() {
  setStatus("Community feed with photos, recaps, and short videos");
  root.innerHTML = `
    ${appHeader("Vibra Community", "Community")}
    <div class="story-row" aria-label="Community stories">
      ${["Socials", "Recaps", "Classes", "Friends"].map((label, index) => `<button class="story-button"><span class="story-photo photo-${index + 1}"></span><strong>${label}</strong></button>`).join("")}
    </div>
    <section class="live-feed">
      ${posts.map((post, index) => `
        <article class="post-card">
          <header><div class="mini-avatar ${index === 1 ? "blue" : ""}">${post.avatar}</div><div><strong>${post.name}</strong><span>${post.meta}</span></div></header>
          <div class="post-media photo ${post.photo}"></div>
          <div class="post-actions"><button data-like="${index}">${state.likedPosts.has(index) ? "Liked" : "Like"} (${post.likes + (state.likedPosts.has(index) ? 1 : 0)})</button><button>Comment</button><button>Share</button></div>
          <p><strong>${post.text.split(":")[0]}:</strong>${post.text.includes(":") ? post.text.slice(post.text.indexOf(":") + 1) : ` ${post.text}`}</p>
        </article>
      `).join("")}
    </section>
  `;
}

function renderMessages() {
  const selected = messages[state.selectedMessage];
  setStatus(`Reading ${selected.from}`);
  root.innerHTML = `
    ${appHeader("Chats", "Messages")}
    <label class="search"><span aria-hidden="true">⌕</span><input value="Search dancers or groups" aria-label="Search messages" /></label>
    <section class="message-list">
      ${messages.map((message, index) => `
        <article class="message ${index === state.selectedMessage ? "unread" : ""}" data-message="${index}">
          <div class="mini-avatar ${message.tone}">${message.avatar}</div>
          <div><div><strong>${message.from}</strong><span>${message.time}</span></div><p>${message.body}</p></div>
        </article>
      `).join("")}
    </section>
    <section class="group-card">
      <h3>${selected.from}</h3>
      <p>${selected.body}</p>
      <button data-reply>Reply</button>
    </section>
  `;
}

function renderProfile() {
  setStatus("Dancer profile with styles, city, friends, and upcoming events");
  root.innerHTML = `
    <div class="profile-hero photo photo-6"><button class="round-button" aria-label="Settings">⚙</button></div>
    <section class="profile-card">
      <div class="profile-photo">MR</div>
      <h2>Marley Rivera</h2>
      <p>Intermediate social dancer - Queens, NY</p>
      <div class="profile-stats"><div><strong>24</strong><span>Events</span></div><div><strong>318</strong><span>Friends</span></div><div><strong>5</strong><span>Styles</span></div></div>
      <div class="style-tags profile-tags"><span>Salsa</span><span>Bachata</span><span>Merengue</span><span>Kizomba</span><span>West Coast Swing</span></div>
      <p class="bio">Here for warm rooms, clear rhythms, and community-first dance floors. Always happy to dance with beginners.</p>
    </section>
    <section class="upcoming">
      <div class="section-title"><h3>Upcoming events</h3><a data-route-target="discover">See all</a></div>
      ${events.slice(0, 2).map((event, index) => `<article data-open-event="${event.id}"><div class="date-box ${index === 1 ? "blue-box" : ""}"><strong>${event.shortDate.replace("Jun ", "")}</strong><span>Jun</span></div><div><strong>${event.name}</strong><p>${event.time.split(" - ")[0]} - ${event.area}</p></div></article>`).join("")}
    </section>
  `;
}

function render() {
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.route === state.route));
  if (state.route === "discover") renderDiscover();
  if (state.route === "details") renderDetails();
  if (state.route === "events") renderMap();
  if (state.route === "community") renderCommunity();
  if (state.route === "messages") renderMessages();
  if (state.route === "profile") renderProfile();
}

document.addEventListener("click", (event) => {
  const routeButton = event.target.closest("[data-route], [data-route-target]");
  const filterButton = event.target.closest("[data-filter]");
  const openEvent = event.target.closest("[data-open-event]");
  const mapEvent = event.target.closest("[data-map-event]");
  const goingButton = event.target.closest("[data-going]");
  const likeButton = event.target.closest("[data-like]");
  const messageButton = event.target.closest("[data-message]");
  const replyButton = event.target.closest("[data-reply]");

  if (routeButton) setRoute(routeButton.dataset.route || routeButton.dataset.routeTarget);
  if (filterButton) {
    state.filter = filterButton.dataset.filter;
    render();
  }
  if (openEvent) {
    state.selectedEventId = openEvent.dataset.openEvent;
    state.route = "details";
    render();
  }
  if (mapEvent) {
    state.selectedEventId = mapEvent.dataset.mapEvent;
    render();
  }
  if (goingButton) {
    const id = goingButton.dataset.going;
    state.goingIds.has(id) ? state.goingIds.delete(id) : state.goingIds.add(id);
    render();
  }
  if (likeButton) {
    const index = Number(likeButton.dataset.like);
    state.likedPosts.has(index) ? state.likedPosts.delete(index) : state.likedPosts.add(index);
    render();
  }
  if (messageButton) {
    state.selectedMessage = Number(messageButton.dataset.message);
    render();
  }
  if (replyButton) {
    replyButton.textContent = "Reply ready";
    setStatus("Reply composer opened");
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-search]")) {
    state.query = event.target.value.replace("Dance socials near me", "").trim();
    renderDiscover();
  }
});

render();
