const planItems = {
  30: [
    ["Reach out to 3 alumni", "Ask for short, specific conversations about product work.", "High impact"],
    ["Complete a product case study", "Choose one product you use and show problem framing, metrics, and tradeoffs.", "High impact"],
    ["Join a professional organization", "Find a product, entrepreneurship, or tech club with active projects.", "Medium impact"],
  ],
  60: [
    ["Apply to 10 targeted internships", "Prioritize roles where marketing, operations, and product overlap.", "High impact"],
    ["Build a portfolio project", "Publish a concise project page with research, decisions, and outcomes.", "High impact"],
    ["Schedule 2 mentor follow-ups", "Turn first conversations into practical feedback on your materials.", "Medium impact"],
  ],
  90: [
    ["Run a mock product interview", "Practice product sense, prioritization, and communication.", "High impact"],
    ["Lead one measurable campus project", "Create proof of ownership, collaboration, and execution.", "High impact"],
    ["Refresh your trajectory snapshot", "Update 4ward with new skills, projects, applications, and conversations.", "Medium impact"],
  ],
};

const planList = document.querySelector("#planList");
const planTabs = document.querySelectorAll(".plan-tab");
const scrollButtons = document.querySelectorAll("[data-scroll-target]");
const dashboardLinks = document.querySelectorAll(".dash-link");
const productNavItems = document.querySelectorAll(".product-nav-item");
const productSections = document.querySelectorAll(".product-section");

function renderPlan(days) {
  if (!planList) return;

  planList.innerHTML = planItems[days]
    .map(
      ([title, body, impact]) => `
        <article class="plan-item">
          <i aria-hidden="true"></i>
          <div>
            <strong>${title}</strong>
            <p>${body}</p>
          </div>
          <span>${impact}</span>
        </article>
      `
    )
    .join("");
}

planTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    planTabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    renderPlan(tab.dataset.plan);
  });
});

scrollButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById(button.dataset.scrollTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

dashboardLinks.forEach((link) => {
  link.addEventListener("click", () => {
    dashboardLinks.forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

productNavItems.forEach((item) => {
  item.addEventListener("click", () => {
    const sectionId = `product-${item.dataset.productSection}`;

    productNavItems.forEach((navItem) => navItem.classList.remove("active"));
    productSections.forEach((section) => section.classList.remove("active"));

    item.classList.add("active");
    document.getElementById(sectionId)?.classList.add("active");

    // Always start the new section at the top, otherwise tapping a section while
    // scrolled down leaves you stranded at the bottom of the new one.
    window.scrollTo({ top: 0, behavior: "instant" });
    // On mobile the nav is a horizontal pill row, so bring the tapped one into view.
    item.scrollIntoView({ inline: "center", block: "nearest" });
  });
});

renderPlan("30");

// Landing-page header: hide when scrolling down, reveal when scrolling up.
// Toggle directly in the listener (cheap) rather than via rAF, so it can't
// get stuck if rAF is throttled in a background tab.
(function autoHideHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  let lastY = window.scrollY;
  const SHOW_NEAR_TOP = 80; // always visible at the very top of the page
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < SHOW_NEAR_TOP) {
      header.classList.remove('header-hidden');
    } else if (y > lastY + 6) {
      header.classList.add('header-hidden');      // scrolling down
    } else if (y < lastY - 6) {
      header.classList.remove('header-hidden');    // scrolling up
    }
    lastY = y;
  }, { passive: true });
})();

// ---------------------------------------------------------------------------
// Profile + helpers
// ---------------------------------------------------------------------------

function readJSON(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function loadProfile() {
  return readJSON('figuredProfile') || readJSON('pathlineProfile');
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Capitalize a name no matter how it was typed: "marley" / "MARLEY" -> "Marley".
// Handles spaces, hyphens, and apostrophes (e.g. "mary-jane o'brien").
function capitalizeName(name) {
  const s = (name || '').trim();
  if (!s) return s;
  return s.toLowerCase().replace(/(^|[\s'\-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

function profileInitials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '4W';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Strip em/en dashes used as punctuation. Voice rule: dashes read as AI.
// Preserve en dashes inside numeric ranges like "$110k–$130k" and ASCII
// hyphens inside compound words like "front-office".
function stripDashes(s) {
  if (typeof s !== 'string') return s;
  return s
    // " — Word" or " – Word" → ". Word" (capitalize next letter)
    .replace(/\s*[—–]\s+([a-zA-Z])/g, (_, c) => '. ' + c.toUpperCase())
    // " — " with no following letter → ". "
    .replace(/\s*[—–]\s+/g, '. ');
}

// Recursively run stripDashes on every string in an object/array.
function stripDashesDeep(x) {
  if (typeof x === 'string') return stripDashes(x);
  if (Array.isArray(x)) return x.map(stripDashesDeep);
  if (x && typeof x === 'object') {
    const out = {};
    for (const k in x) out[k] = stripDashesDeep(x[k]);
    return out;
  }
  return x;
}

function hashProfile(p) {
  const str = JSON.stringify(p);
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return String(h);
}

function computeScores(p) {
  const gpa = parseFloat(p.gpa) || 0;
  const acts = p.activities ? p.activities.split('\n').filter(l => l.trim()).length : 0;
  const exps = p.experience ? p.experience.split('\n').filter(l => l.trim()).length : 0;
  const skills = p.skills ? p.skills.split('\n').filter(l => l.trim()).length : 0;

  const academics = gpa >= 3.5 ? 88 : gpa >= 3.3 ? 78 : gpa >= 3.0 ? 62 : gpa >= 2.5 ? 46 : gpa > 0 ? 28 : 55;
  const experience = exps >= 3 ? 78 : exps === 2 ? 62 : exps === 1 ? 44 : 14;
  const network = acts >= 4 ? 70 : acts === 3 ? 56 : acts === 2 ? 42 : acts === 1 ? 28 : 10;
  const portfolio = skills >= 6 ? 68 : skills >= 4 ? 52 : skills >= 2 ? 38 : skills >= 1 ? 24 : 10;
  const alignment = Math.round(academics * 0.25 + experience * 0.35 + portfolio * 0.2 + network * 0.2);

  return { academics, experience, network, portfolio, alignment };
}

function trimGoal(raw, max) {
  if (!raw) return 'your goal';
  const cleaned = raw.replace(/\n/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  const cut = cleaned.lastIndexOf(' ', max);
  return (cut > 20 ? cleaned.slice(0, cut) : cleaned.slice(0, max)) + '…';
}

// Turn a free-text goal into a noun phrase that's safe to drop mid-sentence.
// Clean, short role goals pass through unchanged ("Software engineer"), so
// fallback copy stays specific. Vague or rambling goals ("something in
// business, not sure yet") become a neutral phrase, so the copy never reads
// broken like "Reach out to 3 people working in Something in business, not
// sure yet."
function goalNoun(goal) {
  const g = (goal || '').trim().replace(/[.…]+$/, '');
  const vague = !g
    || g.length > 30
    || g.includes('?')
    || /\b(not sure|unsure|something|anything|maybe|idk|dunno|no idea|figuring|undecided|open to|don'?t know)\b/i.test(g);
  return vague ? 'the field you are exploring' : g;
}

// ---------------------------------------------------------------------------
// Compensation data by domain (BLS-sourced, updated periodically)
// ---------------------------------------------------------------------------
const COMP = {
  sports:     { entry: '$40k–$52k',        note: 'Entry front-office and ops roles pay low, roughly $40–52k. The path up is through relationships and results. Pay climbs at the director level and above.' },
  product:    { entry: '$75k–$110k',       note: 'Associate PM base runs about $75–110k. Top-tech APM programs reach $120k+, but most PMs enter through ops, data, or engineering first.' },
  finance:    { entry: '$65k–$160k',       note: 'Investment banking analysts start ~$110k base + bonus. Corporate finance and financial planning roles run $65–85k to start.' },
  economics:  { entry: '$55k–$80k',        note: 'Economics grads spread across finance, consulting, analytics, and policy. Pay depends heavily on the path you pick, with finance and consulting at the higher end.' },
  psychology: { entry: '$40k–$55k',        note: 'Entry counseling, research, and HR roles start here. Clinical paths require grad school but raise pay a lot. The major is versatile across people-focused fields.' },
  software:   { entry: '$80k–$120k',       note: 'New-grad software median is about $85k (NACE). Big Tech starts $130–150k+; startups vary widely and often add equity.' },
  marketing:  { entry: '$55k–$75k',        note: 'Marketing coordinators start $50–60k. Brand and growth roles at tech companies run higher. Agency pay is lower to start but builds fast.' },
  consulting: { entry: '$90k–$112k',       note: 'MBB (McKinsey, BCG, Bain) starts ~$112k base for undergrad. Big 4 management consulting runs $75–95k.' },
  design:     { entry: '$70k–$95k',        note: 'Junior UX/product designers at tech companies. Agency and startup roles vary. Senior and staff designers reach $130–180k+.' },
  creative:   { entry: '$45k–$65k',        note: 'Entry animation, illustration, and motion roles run roughly $45–65k. Games and big studios pay more. Your reel and portfolio matter more than pedigree.' },
  founder:    { entry: 'varies',           note: 'Early startup employees (#1–10) typically earn $70–110k + equity. Founders pay themselves last. Upside is in the equity, not the salary.' },
  medicine:   { entry: '$61k → $239k+',   note: 'Residency pays ~$61k. Attending physicians earn $200–350k+ depending on specialty. Medical school debt (~$200k average) is the tradeoff to plan for.' },
  law:        { entry: '$80k–$215k',       note: 'Bimodal market: BigLaw starts at $225k; government and public interest roles run $60–80k. Most lawyers land somewhere in between.' },
  publishing: { entry: '$42k–$50k',        note: 'Editorial assistants at major NYC houses start $42–48k. Pay ramps slowly through assistant editor and associate editor. The first five years are about access and taste, not money.' },
  journalism: { entry: '$35k–$55k',        note: 'Local and trade reporters start $35–45k. National outlets (NYT, WSJ, Bloomberg) pay $60–80k entry. Freelance and contract work varies widely; bylines build leverage faster than salary does.' },
  academia:   { entry: '$30k–$45k',        note: 'PhD stipends typically $28–40k for 5–7 years. Postdocs $55–70k. Tenure-track salaries $70–110k depending on field. Long timeline; mission and autonomy compensate.' },
  nonprofit:  { entry: '$40k–$55k',        note: 'Program associates and coordinators start $40–50k. Senior program officers $75–110k. Executive directors at established orgs $120k+. Pay trails corporate equivalents; mission and impact are the trade.' },
  government: { entry: '$48k–$72k',        note: 'Federal GS-7 starts ~$48k; GS-9 ~$58k; GS-11 ~$72k. State and local vary widely. Benefits and pension are the long-term win; private sector pays more upfront.' },
  generic:    { entry: 'varies by path',   note: 'Compensation depends heavily on industry, role, and location. The Opportunities tab links to current listings with real salary data.' },
};

// Per-domain entry-level title used in LinkedIn searches so a senior in
// publishing isn't getting Simon & Schuster "Assistant Editor" roles that
// require 3 years of experience. Empty string = fall back to the cleaned goal.
const ENTRY_TITLE = {
  sports:     'Sports Operations',
  product:    'Associate Product Manager',
  finance:    'Investment Banking Analyst',
  software:   'Software Engineer',
  marketing:  'Marketing Coordinator',
  consulting: 'Business Analyst',
  design:     'Junior Designer',
  founder:    '',
  medicine:   '',
  law:        'Paralegal',
  publishing: 'Editorial Assistant',
  journalism: 'Editorial Assistant',
  academia:   'Research Assistant',
  nonprofit:  'Program Associate',
  government: 'Pathways Intern',
  generic:    '',
};

function renderComp(p, aiPay) {
  // Prefer the AI-generated, goal-accurate pay; fall back to the static table.
  const c = (aiPay && aiPay.entry) ? aiPay : (COMP[detectDomain(p)] || COMP.generic);
  const entryEl = document.getElementById('compEntry');
  const noteEl  = document.getElementById('compNote');
  const srcEl   = document.getElementById('compSource');
  const gdEl    = document.getElementById('compSourceGlassdoor');
  if (entryEl) entryEl.textContent = c.entry;
  if (noteEl)  noteEl.textContent  = c.note;
  // Link straight to live wage data for their goal so they can verify both sources.
  const kw = (p && p.goal) ? p.goal : (p && p.major) ? p.major : '';
  if (srcEl) srcEl.href = 'https://www.mynextmove.org/find/search?keyword=' + encodeURIComponent(kw);
  // Glassdoor's salary deep-link format is brittle, so route through a search that always resolves.
  if (gdEl) gdEl.href = 'https://www.google.com/search?q=' + encodeURIComponent('glassdoor ' + kw + ' salary');
}

// Niche/custom role keywords → domain. Checked BEFORE the broad domain patterns
// so specific goals like "NBA GM", "sports agent", "game design" resolve cleanly
// instead of hitting a generic bucket.
const NICHE_DOMAIN_MAP = [
  // Sports — specific front-office and ops roles
  [/(general manager|\bgm\b|player development|basketball operations|football operations|scouting|scout|sports agent|athletic director|strength and conditioning|sports analytics|sports management|sports marketing)/, 'sports'],
  // Media / entertainment
  [/(music producer|record label|\ba&r\b|dj|artist manager|tour manager|screenwr|film direct|cinematograph)/, 'marketing'],
  // Gov / law enforcement / military
  [/(fbi|cia|\bmilitary\b|armed forces|intelligence officer|detective|law enforcement|police officer|foreign service|diplomat)/, 'law'],
  // Game design / esports
  [/(game design|game dev|esport|gaming industry)/, 'software'],
  // Fashion
  [/(fashion design|fashion merch|stylist|apparel)/, 'design'],
  // Culinary / hospitality
  [/(chef|culinary|restaurant owner|hospitality manag|hotel manag)/, 'founder'],
  // Acting / theater
  [/(actor|acting|theater|theatre|perform)/, 'marketing'],
  // Architecture
  [/\barchitect\b/, 'design'],
  // Veterinary / dental / optometry → medicine bucket
  [/(veterinar|\bvet\b|dentist|optometr)/, 'medicine'],
  // Pilot / aviation
  [/(pilot|aviation|airline)/, 'software'],
  // Publishing / editorial / books
  [/(publish|imprint|editorial|fiction editor|book editor|literary agent|acquisitions editor|novelist|author)/, 'publishing'],
  // Journalism / writing for news
  [/(journalist|reporter|investigative|news anchor|magazine writer|staff writer|columnist|copywriter|content creator)/, 'journalism'],
  // Research / academia
  [/(research scientist|professor|academia|phd track|grad school|tenure track)/, 'academia'],
  // Nonprofit / mission-driven
  [/(nonprofit|non-profit|ngo|social impact|community organiz|philanthropy|program officer)/, 'nonprofit'],
  // Government / public sector / policy
  [/(public policy|civil service|federal|state department|city hall|legislative aide|congressional|usaid)/, 'government'],
  // Nursing / PA / pharmacy / PT → medicine
  [/(nurs|\bnp\b|\bpa\b|pharmacist|physical therap|occupational therap)/, 'medicine'],
  // Real estate
  [/(real estate|property manag|mortgage|broker)/, 'finance'],
  // Supply chain / logistics
  [/(supply chain|logistics|operations manag|procurement)/, 'consulting'],
  // Accounting / CPA
  [/(accountant|\bcpa\b|audit|tax advisor|controller|cfo)/, 'finance'],
  // HR / people ops
  [/(human resources|\bhr\b|talent acqui|recruiter|people ops)/, 'consulting'],
  // Sales / business development
  [/(sales manager|business development|account executive|revenue)/, 'marketing'],
  // Cybersecurity
  [/(cyber|information security|infosec|penetration test|ethical hack)/, 'software'],
  // Data science / analytics
  [/(data scientist|data analyst|machine learning|ml engineer|ai engineer|analytics)/, 'software'],
];

function detectDomain(p) {
  const g = ((p.goal || '') + ' ' + (p.major || '') + ' ' + (p.skills || '')).toLowerCase();

  // Check niche roles first — more specific wins over broad patterns
  for (const [rx, domain] of NICHE_DOMAIN_MAP) {
    if (rx.test(g)) return domain;
  }

  // Broad domain patterns
  if (/(basketball|nba|wnba|sport|athlet|football|nfl|soccer|baseball|mlb|hockey|nhl|coach|front office|player development)/.test(g)) return 'sports';
  if (/product/.test(g)) return 'product';
  if (/(invest|bank|financ|equity|trading|wealth)/.test(g)) return 'finance';
  if (/(econ|economics|economist)/.test(g)) return 'economics';
  if (/(psycholog|\bpsych\b)/.test(g)) return 'psychology';
  if (/(software|engineer|develop|coding|programmer|computer science)/.test(g)) return 'software';
  if (/(market|brand|advertis)/.test(g)) return 'marketing';
  if (/consult/.test(g)) return 'consulting';
  if (/(animation|animator|vfx|illustrat|storyboard|concept art|motion graphics|game art|3d art)/.test(g)) return 'creative';
  if (/(design|\bux\b|\bui\b)/.test(g)) return 'design';
  if (/(founder|entrepreneur|startup|ceo)/.test(g)) return 'founder';
  if (/(medic|doctor|nurs|health|pre-med|premed|dental)/.test(g)) return 'medicine';
  if (/(law|legal|attorney|paralegal)/.test(g)) return 'law';
  return 'generic';
}

// ---------------------------------------------------------------------------
// Snapshot + tracks (rule-based fallback)
// ---------------------------------------------------------------------------

function generateSnapshot(p, s) {
  const gpa = parseFloat(p.gpa) || 0;
  const expCount = p.experience ? p.experience.split('\n').filter(l => l.trim()).length : 0;
  const actCount = p.activities ? p.activities.split('\n').filter(l => l.trim()).length : 0;
  const skillCount = p.skills ? p.skills.split('\n').filter(l => l.trim()).length : 0;

  const strengths = [];
  if (gpa >= 3.3) strengths.push('strong academics');
  else if (gpa >= 2.8) strengths.push('a solid academic foundation');
  if (expCount >= 2) strengths.push('real-world experience');
  else if (expCount === 1) strengths.push('a start on real experience');
  if (actCount >= 2) strengths.push('community involvement');
  if (skillCount >= 3) strengths.push('a developing skill set');

  const topGap = [
    { label: 'hands-on experience in the field', v: s.experience },
    { label: 'a real professional network', v: s.network },
    { label: 'visible proof of your work', v: s.portfolio },
  ].sort((a, b) => a.v - b.v)[0].label;

  if (strengths.length === 0) return {
    headline: `The path is real. Here's what it actually takes.`,
    body: `Everyone starts somewhere. The students who get there aren't the ones who had everything figured out early — they're the ones who moved deliberately. Your next move matters more than your starting point.`,
  };
  if (strengths.length === 1) return {
    headline: `You've got a foundation. Here's how to build on it.`,
    body: `You're building ${strengths[0]}, which is a real asset. The move that opens the most doors right now is building ${topGap}. That's where to put your energy.`,
  };
  const strengthStr = strengths.slice(0, 2).join(' and ');
  return {
    headline: `You're building something real. Here's what moves the needle.`,
    body: `${strengthStr.charAt(0).toUpperCase() + strengthStr.slice(1)} — those are genuine building blocks. The highest-leverage move right now is building ${topGap}. Do that, and the picture changes fast.`,
  };
}

function buildAdjacentTracks(goal, major, skills) {
  const g = (goal + ' ' + major + ' ' + skills).toLowerCase();
  if (/(basketball|nba|wnba|sport|athlet|football|nfl|soccer|baseball|mlb|hockey|nhl|front office|player development)/.test(g)) return [
    { label: 'Adjacent path', role: 'Sports Analytics', reason: 'Front offices increasingly hire from analytics. Data skills are the most reliable door into team operations.' },
    { label: 'Also worth exploring', role: 'Team Business Operations', reason: 'Partnerships, strategy, and ops roles inside the same organizations — more openings, same building.' },
  ];
  if (g.includes('product')) return [
    { label: 'Adjacent path', role: 'Strategy & Operations', reason: 'Your analytical mindset crosses over directly. Many PMs start in ops.' },
    { label: 'Also worth exploring', role: 'Technical Program Manager', reason: 'If you build any technical fluency, this path opens up immediately.' },
  ];
  if (g.includes('invest') || g.includes('bank') || g.includes('financ')) return [
    { label: 'Adjacent path', role: 'Corporate Finance', reason: 'Similar analytical rigor, broader scope, and a more accessible entry point.' },
    { label: 'Also worth exploring', role: 'Strategy Consulting', reason: 'Same problem-solving muscle, different context. Common crossover.' },
  ];
  if (g.includes('software') || g.includes('engineer') || g.includes('develop')) return [
    { label: 'Adjacent path', role: 'Technical Product Manager', reason: 'Engineering plus product thinking is one of the most valuable combinations in tech.' },
    { label: 'Also worth exploring', role: 'Data Science', reason: 'Strong demand, strong compensation, and a natural extension of technical skills.' },
  ];
  if (g.includes('market') || g.includes('brand')) return [
    { label: 'Adjacent path', role: 'Growth & Demand Generation', reason: 'Performance marketing is where your skills translate to measurable business impact.' },
    { label: 'Also worth exploring', role: 'Product Marketing Manager', reason: 'Bridge between product and marketing. High demand, strong career trajectory.' },
  ];
  if (g.includes('consult')) return [
    { label: 'Adjacent path', role: 'Corporate Strategy', reason: 'In-house strategy uses the same skills with more ownership over execution.' },
    { label: 'Also worth exploring', role: 'Business Operations', reason: 'Ops roles at fast-growing companies run like internal consulting engagements.' },
  ];
  if (g.includes('design') || g.includes('ux')) return [
    { label: 'Adjacent path', role: 'Product Designer', reason: 'Broader ownership over the full product experience, not just visual design.' },
    { label: 'Also worth exploring', role: 'UX Researcher', reason: 'If the user psychology side resonates, research is a distinct and growing field.' },
  ];
  if (g.includes('founder') || g.includes('entrepreneur') || g.includes('startup') || g.includes('ceo')) return [
    { label: 'Adjacent path', role: 'Early-Stage Startup Operator', reason: 'Building at a startup first is the fastest way to learn what founders actually do.' },
    { label: 'Also worth exploring', role: 'Venture Capital', reason: 'See hundreds of companies and understand what works before you build your own.' },
  ];
  if (/(medic|doctor|nurs|health|pre-med|premed|dental)/.test(g)) return [
    { label: 'Adjacent path', role: 'Clinical Research', reason: 'Builds the science credentials and patient exposure that strengthen any medical application.' },
    { label: 'Also worth exploring', role: 'Public Health', reason: 'Same mission at population scale — and a strong complement to a clinical path.' },
  ];
  if (/(law|legal|attorney)/.test(g)) return [
    { label: 'Adjacent path', role: 'Public Policy', reason: 'Same analytical and advocacy muscles, with broad career surface area before or alongside law school.' },
    { label: 'Also worth exploring', role: 'Compliance & Risk', reason: 'Legal thinking inside companies — strong demand and a real pre-law proving ground.' },
  ];
  return [
    { label: 'Adjacent path', role: 'Strategy & Operations', reason: 'Analytical, cross-functional, and a strong foundation for many senior roles.' },
    { label: 'Also worth exploring', role: 'Project & Program Management', reason: 'High demand, transferable across industries, and builds toward leadership.' },
  ];
}

function generateTracks(p, s) {
  if (p.schoolStage === 'highSchool') return generateHighSchoolTracks(p);
  const goal = trimGoal(p.goal, 48);
  const gpa = parseFloat(p.gpa) || 0;
  const expCount = p.experience ? p.experience.split('\n').filter(l => l.trim()).length : 0;
  const skills = (p.skills || '').toLowerCase();
  const major = (p.major || '').toLowerCase();

  const strengths = [];
  if (gpa >= 3.0) strengths.push('your academic record');
  if (expCount >= 1) strengths.push('real-world experience');
  if (skills.length > 0) strengths.push('your developing skill set');

  const primaryReason = strengths.length === 0
    ? 'The path is clear from here. It just needs deliberate action to build the proof.'
    : strengths.length === 1
      ? `${strengths[0].charAt(0).toUpperCase() + strengths[0].slice(1)} gives you a real starting point for this path.`
      : `${strengths[0].charAt(0).toUpperCase() + strengths[0].slice(1)} and ${strengths[1]} are genuine building blocks here.`;

  return [
    { label: 'Your goal', role: goal, reason: primaryReason, primary: true },
    ...buildAdjacentTracks(goal, major, skills),
  ];
}

function generateHighSchoolTracks(p) {
  const interests = (p.goal || p.major || 'your interests').trim();
  const all = `${p.goal || ''} ${p.major || ''} ${p.classesLiked || ''} ${p.activities || ''}`.toLowerCase();
  const tracks = [];
  const push = (label, role, reason) => tracks.push({ label, role, reason, primary: tracks.length === 0 });

  if (/(sport|nba|nfl|athlet|team|basketball|football)/.test(all)) {
    push('Best-fit direction', 'Sports Management', 'Turns your interest in teams into business, operations, events, and athlete-facing work.');
    push('Major to compare', 'Business Administration', 'Keeps the door wide while still building useful management and finance skills.');
    push('Also worth exploring', 'Data Analytics', 'If you like numbers, this can connect sports interest to scouting, strategy, and performance decisions.');
  } else if (/(doctor|nurs|health|bio|medicine|medical|science)/.test(all)) {
    push('Best-fit direction', 'Health Sciences or Biology', 'Gives you a strong base for medicine, nursing, research, or public health.');
    push('Major to compare', 'Psychology', 'Useful if you like people, behavior, health, and helping work.');
    push('Also worth exploring', 'Public Health', 'A strong path if you care about helping people at a community level.');
  } else if (/(computer|code|tech|engineer|math|robot|game)/.test(all)) {
    push('Best-fit direction', 'Computer Science', 'Fits students who like building, solving problems, and learning technical tools.');
    push('Major to compare', 'Data Analytics', 'A practical option if you like patterns, numbers, and business decisions.');
    push('Also worth exploring', 'Information Systems', 'Blends technology with business and is often less theory-heavy than CS.');
  } else if (/(art|design|music|film|write|media|content|creative)/.test(all)) {
    push('Best-fit direction', 'Communications or Media', 'Connects creativity with storytelling, brands, sports, entertainment, or organizations.');
    push('Major to compare', 'Marketing', 'A business-friendly creative path with clear internship options.');
    push('Also worth exploring', 'Design', 'Good if you like making things visual, useful, and polished.');
  } else {
    push('Best-fit direction', trimGoal(interests, 40), 'This is your starting direction. The next step is testing it through classes, clubs, and conversations.');
    push('Major to compare', 'Business Administration', 'Flexible, practical, and useful if you are still deciding.');
    push('Also worth exploring', 'Psychology', 'A broad people-focused path that pairs well with many careers.');
  }
  return tracks;
}

// ---------------------------------------------------------------------------
// Goal-aware fallback content (used until / unless AI is connected)
// ---------------------------------------------------------------------------

const FALLBACK_DOMAINS = {
  sports: () => ({
    gaps: {
      skills: [
        { item: 'Sports analytics tools — Excel deeply, then R or Python', impact: 'High impact' },
        { item: 'Salary cap and roster construction fundamentals', impact: 'High impact' },
        { item: 'Video and scouting basics (Synergy, Hudl)', impact: 'Medium impact' },
        { item: 'Data storytelling — turn numbers into decisions', impact: 'Medium impact' },
      ],
      experience: [
        { item: "Manager or ops role with your school's team — any sport", impact: 'High impact' },
        { item: 'Internship with the athletic department or a local pro or minor-league org', impact: 'High impact' },
        { item: 'One independent scouting or analytics project, published', impact: 'High impact' },
      ],
      exposure: [
        { item: 'Talk to people in front offices — most of them started as student managers', impact: 'High impact' },
        { item: 'Attend a sports analytics conference (Sloan is the big one)', impact: 'Medium impact' },
        { item: 'Follow transactions and roster decisions like coursework', impact: 'Medium impact' },
      ],
      mindset: [
        { item: 'Treat every team interaction as a long interview', impact: 'Foundational' },
        { item: 'The league runs on trust — build a reputation for reliability', impact: 'Foundational' },
        { item: 'Proof beats passion. Show work, not fandom.', impact: 'Foundational' },
      ],
    },
    actions: [
      "Email your school's basketball ops office and offer to help with anything",
      'Start one analytics mini-project using public game data',
      'List 10 people with jobs you want and study how they got there',
      'Join a sports business or sports analytics student group',
    ],
    plan: {
      d30: [
        { title: 'Get inside the building', detail: "Email your school's team ops staff and offer to help — film, stats, logistics, anything.", impact: 'High impact' },
        { title: 'Start an analytics mini-project', detail: 'Pick one question about lineups or player value and answer it with public data.', impact: 'High impact' },
        { title: 'Map 10 career paths', detail: 'Find 10 people in front-office roles and document how each one broke in.', impact: 'Medium impact' },
      ],
      d60: [
        { title: 'Publish your project', detail: 'Put it on a simple page and send it to 5 people working in the industry for feedback.', impact: 'High impact' },
        { title: 'Apply to team and league internships', detail: 'NBA, G League, athletic department, agencies — cast wide inside the industry.', impact: 'High impact' },
        { title: 'Join the community', detail: 'Sports business club, analytics groups, alumni working in sports.', impact: 'Medium impact' },
      ],
      d90: [
        { title: 'Lock a role for next season', detail: 'Student manager, ops assistant, or analytics support — a defined title with real reps.', impact: 'High impact' },
        { title: 'Run 3 informational interviews', detail: 'Front-office staff, scouts, or analytics people. Ask about their path, not for a job.', impact: 'High impact' },
        { title: 'Refresh your trajectory', detail: 'Update 4ward with the new proof and let the picture move.', impact: 'Medium impact' },
      ],
    },
  }),
  product: () => ({
    gaps: {
      skills: [
        { item: 'Product strategy and prioritization frameworks', impact: 'High impact' },
        { item: 'Data and metrics — funnels, retention, A/B basics', impact: 'High impact' },
        { item: 'User research fundamentals', impact: 'Medium impact' },
        { item: 'SQL or spreadsheet fluency', impact: 'Medium impact' },
      ],
      experience: [
        { item: 'Internship in product or an adjacent role', impact: 'High impact' },
        { item: 'Build and publish a real product case study', impact: 'High impact' },
        { item: 'Lead a campus initiative end-to-end', impact: 'Medium impact' },
      ],
      exposure: [
        { item: 'Shadow a PM for a day or do 3 informational interviews', impact: 'High impact' },
        { item: 'Attend product community events', impact: 'Medium impact' },
        { item: 'Read product teardowns weekly', impact: 'Medium impact' },
      ],
      mindset: [
        { item: 'Think in user problems, not features', impact: 'Foundational' },
        { item: 'Get comfortable with ambiguity', impact: 'Foundational' },
        { item: 'Build a bias toward shipping', impact: 'Foundational' },
      ],
    },
    actions: [
      'Reach out to 3 alumni in product roles',
      'Choose a product for your case study',
      'Apply to 10 targeted internships',
      'Join one product or tech community',
    ],
    plan: {
      d30: [
        { title: 'Reach out to 3 alumni', detail: 'Ask for short, specific conversations about product work.', impact: 'High impact' },
        { title: 'Start a product case study', detail: 'Pick one product you use and show problem framing, metrics, and tradeoffs.', impact: 'High impact' },
        { title: 'Learn core product metrics', detail: 'Funnels, retention, and activation — enough to talk specifics.', impact: 'Medium impact' },
      ],
      d60: [
        { title: 'Publish the case study', detail: 'A concise page with research, decisions, and outcomes.', impact: 'High impact' },
        { title: 'Apply to 10 targeted internships', detail: 'Prioritize roles where your background overlaps with product.', impact: 'High impact' },
        { title: 'Join a product community', detail: 'Find a club or online group with active projects.', impact: 'Medium impact' },
      ],
      d90: [
        { title: 'Run a mock product interview', detail: 'Practice product sense, prioritization, and communication.', impact: 'High impact' },
        { title: 'Lead one measurable campus project', detail: 'Create proof of ownership, collaboration, and execution.', impact: 'High impact' },
        { title: 'Refresh your trajectory', detail: 'Update 4ward with new skills, projects, and conversations.', impact: 'Medium impact' },
      ],
    },
  }),
  generic: (goal) => {
    const gn = goalNoun(goal);
    return {
    gaps: {
      skills: [
        { item: 'The core tools the field rewards. Learn what shows up in job postings', impact: 'High impact' },
        { item: 'Data fluency: Excel plus one analytics tool', impact: 'High impact' },
        { item: 'Clear writing and presenting', impact: 'Medium impact' },
        { item: 'One course or certification the field respects', impact: 'Medium impact' },
      ],
      experience: [
        { item: `An internship in or adjacent to ${gn}`, impact: 'High impact' },
        { item: 'One self-directed project that proves real interest', impact: 'High impact' },
        { item: 'A campus role with genuine ownership', impact: 'Medium impact' },
      ],
      exposure: [
        { item: `3 informational interviews with people working in ${gn}`, impact: 'High impact' },
        { item: 'Follow the industry weekly: news, people, moves', impact: 'Medium impact' },
        { item: 'Attend one industry event or conference this term', impact: 'Medium impact' },
      ],
      mindset: [
        { item: 'Proof beats intention. Build visible evidence', impact: 'Foundational' },
        { item: 'Small consistent moves compound', impact: 'Foundational' },
        { item: 'Treat rejection as data, not verdict', impact: 'Foundational' },
      ],
    },
    actions: [
      `Reach out to 3 people working in ${gn}`,
      'Pick one project that proves your interest',
      'Map the 3 most common entry paths into the field',
      'Join one club or community connected to your goal',
    ],
    plan: {
      d30: [
        { title: 'Talk to 3 people doing the job', detail: 'Short, specific conversations. Ask about their path, not for favors.', impact: 'High impact' },
        { title: 'Pick a proof project', detail: `Choose one small project that shows real interest in ${gn}.`, impact: 'High impact' },
        { title: 'Map the entry paths', detail: 'Find how people actually break in: internships, programs, referrals.', impact: 'Medium impact' },
      ],
      d60: [
        { title: 'Finish and publish the project', detail: 'Make it visible: a page, a deck, a repo. Send it to 5 people for feedback.', impact: 'High impact' },
        { title: 'Apply to 10 targeted opportunities', detail: 'Internships, fellowships, or programs aligned with your goal.', impact: 'High impact' },
        { title: 'Join the community', detail: 'One club, one online group, one recurring event.', impact: 'Medium impact' },
      ],
      d90: [
        { title: 'Practice the interview', detail: 'Mock interviews for the roles you want, with honest feedback.', impact: 'High impact' },
        { title: 'Take one leadership rep', detail: 'Own something end-to-end that you can point to.', impact: 'High impact' },
        { title: 'Refresh your trajectory', detail: 'Update 4ward with the new proof and see the picture move.', impact: 'Medium impact' },
      ],
    },
    };
  },
};

function fallbackBridge(p, s, goal) {
  const bits = [];
  if (p.major) bits.push(`${p.major} major`);
  if (p.school) bits.push(`at ${p.school}`);
  if (p.gpa) bits.push(`${p.gpa} GPA`);
  const expCount = p.experience ? p.experience.split('\n').filter(l => l.trim()).length : 0;
  const actCount = p.activities ? p.activities.split('\n').filter(l => l.trim()).length : 0;
  if (expCount) bits.push(`${expCount} real experience ${expCount === 1 ? 'entry' : 'entries'}`);
  if (actCount) bits.push(`${actCount} ${actCount === 1 ? 'activity' : 'activities'}`);

  const topGap = [
    { label: 'hands-on experience', v: s.experience },
    { label: 'a real network in the field', v: s.network },
    { label: 'visible proof of your work', v: s.portfolio },
  ].sort((a, b) => a.v - b.v)[0].label;

  return {
    now: bits.length ? bits.join(', ') + '.' : 'Early in the journey, with the map still being drawn.',
    destination: `${goal.charAt(0).toUpperCase() + goal.slice(1)} — doing work that actually fits where you want to be.`,
    bridge: `The connector is ${topGap}: build it deliberately over the next 90 days and the distance closes fast.`,
  };
}

const FOCUS_NOTE = {
  focus: 'Highest-leverage area right now.',
  building: 'In motion — keep stacking reps.',
  strength: 'Already working for you. Maintain it.',
};

// Turn the four scored areas into priority labels instead of grades.
// Lowest area is always a "Focus here first" so there's always a next move.
function computeFocus(s) {
  const areas = [
    { area: 'Academic Progress', v: s.academics },
    { area: 'Relevant Experience', v: s.experience },
    { area: 'In-Demand Skills', v: s.portfolio },
    { area: 'Network Strength', v: s.network },
  ];
  const lowest = Math.min(...areas.map(a => a.v));
  const rank = { focus: 0, building: 1, strength: 2 };
  return areas.map((a) => {
    let status = a.v >= 65 ? 'strength' : a.v >= 42 ? 'building' : 'focus';
    if (a.v === lowest) status = 'focus';
    return { area: a.area, status, note: FOCUS_NOTE[status] };
  }).sort((a, b) => rank[a.status] - rank[b.status]);
}

// A real timeline built from the student's own inputs — phase labels, not
// fabricated months. Only includes entries we actually have data for.
function fallbackTimeline(p) {
  const term = searchTerm(p.goal);
  const acts = (p.activities || '').split('\n').map(l => l.trim()).filter(Boolean);
  const exps = (p.experience || '').split('\n').map(l => l.trim()).filter(Boolean);
  const out = [];

  if (p.major || p.school) {
    out.push({ when: 'The start', text: `Started as a ${p.major || 'student'}${p.school ? ' at ' + p.school : ''}.` });
  }

  const built = [];
  if (exps.length) built.push(exps[0]);
  if (acts.length) built.push(acts[0]);
  if (built.length) {
    const extra = (exps.length + acts.length) - built.length;
    out.push({ when: "What you've built", text: built.join(' · ') + (extra > 0 ? `, plus ${extra} more.` : '.') });
  }

  out.push({ when: 'Right now', text: `Moving from exploration into positioning for ${term}.` });

  const semMatch = (p.timeLeft || '').match(/\d+/);
  const semN = semMatch ? parseInt(semMatch[0], 10) : null;
  out.push({ when: 'This term', text: `Build one piece of real proof and start outreach in ${term}.` });
  if (semN && semN > 1) {
    out.push({ when: 'By graduation', text: `${semN} semesters to turn momentum into a ${term} offer — each one counts.` });
  } else {
    out.push({ when: 'The goal', text: `Step into ${term} with proof, a network, and a clear story.` });
  }
  return out;
}

function fallbackContent(p, s) {
  if (p.schoolStage === 'highSchool') return highSchoolFallbackContent(p, s);
  const domain = detectDomain(p);
  const goal = trimGoal(p.goal, 48);
  const snap = generateSnapshot(p, s);
  const base = (FALLBACK_DOMAINS[domain] || FALLBACK_DOMAINS.generic)(goal);
  return {
    headline: snap.headline,
    body: snap.body,
    tracks: generateTracks(p, s),
    gaps: base.gaps,
    actions: base.actions,
    plan: base.plan,
    bridge: fallbackBridge(p, s, goal),
    focus: computeFocus(s),
    timeline: fallbackTimeline(p),
  };
}

function highSchoolFallbackContent(p, s) {
  const interests = trimGoal(p.goal || p.major || 'your next direction', 48);
  const tracks = generateHighSchoolTracks(p);
  const topTrack = tracks[0]?.role || interests;
  const priority = p.priorityConcern || 'Finding a career direction';
  const cost = p.costComfort || '';
  const support = p.supportLevel || '';
  const collegePath = p.collegeInterest || 'a college path that fits';
  const priorityAction = /paying|cost/i.test(priority)
    ? 'Compare 5 affordable colleges and write down total cost, aid, and scholarship options'
    : /grade/i.test(priority)
      ? 'Ask a teacher or counselor which class needs the clearest grade plan this month'
      : /college/i.test(priority)
        ? 'Build a first college list with reach, target, likely, and affordable options'
        : /major/i.test(priority)
          ? `Compare ${topTrack} with two nearby majors and write what each one leads to`
          : /activities|recruited/i.test(priority)
            ? 'Choose one activity, sport, job, or project where you can show real progress this semester'
            : `Research 3 colleges with strong ${topTrack} options`;
  const supportAction = /alone|start/i.test(support)
    ? 'Ask one counselor, teacher, coach, or trusted adult to help you plan the next step'
    : 'Talk to one counselor, teacher, coach, or trusted adult about this direction';
  const affordabilityNote = /major concern/i.test(cost)
    ? 'Affordability has to be part of fit, not something you check at the end.'
    : 'Fit should include cost, support, location, and whether the major is strong.';
  return {
    headline: `You have room to explore, and ${topTrack} is worth testing.`,
    body: `You do not need a final answer yet. Your current priority is ${priority.toLowerCase()}. Your job right now is to use classes, activities, college research, and small real-world tests to learn what actually fits you.`,
    tracks,
    gaps: {
      skills: [
        { item: 'Talk to people in majors that sound interesting', impact: 'High impact' },
        { item: 'Learn what classes each major actually requires', impact: 'High impact' },
        { item: 'Build one small project tied to your interests', impact: 'Medium impact' },
      ],
      experience: [
        { item: 'Join or lead one activity connected to your direction', impact: 'High impact' },
        { item: 'Try a job, volunteer role, shadow day, or summer program', impact: 'High impact' },
        { item: 'Visit or research colleges with the majors you are considering', impact: 'Medium impact' },
      ],
      exposure: [
        { item: 'Compare 5 colleges by fit, cost, support, and major strength', impact: 'High impact' },
        { item: 'Ask a counselor which courses match your interests', impact: 'High impact' },
        { item: 'Watch student videos or day-in-the-life major examples', impact: 'Medium impact' },
      ],
      mindset: [
        { item: 'Exploration is progress, not being behind', impact: 'Foundational' },
        { item: 'College fit matters more than name alone', impact: 'Foundational' },
        { item: 'Pick the next test, not your whole life', impact: 'Foundational' },
      ],
    },
    actions: [
      priorityAction,
      supportAction,
      `Research how ${topTrack} shows up in real college majors and careers`,
      'Write down 3 things you want college to help you figure out',
    ],
    plan: {
      d30: [
        { title: 'Handle the top concern first', detail: priorityAction, impact: 'High impact' },
        { title: 'Get one adult in the loop', detail: supportAction, impact: 'High impact' },
        { title: 'Research colleges by fit', detail: `${affordabilityNote} Compare schools by ${collegePath.toLowerCase()}, support, distance, size, and major strength.`, impact: 'Medium impact' },
      ],
      d60: [
        { title: 'Test one direction', detail: 'Do one project, job shadow, club role, or volunteer shift tied to the path.', impact: 'High impact' },
        { title: 'Build a school list', detail: 'Sort colleges into reach, target, likely, and affordable options.', impact: 'High impact' },
        { title: 'Ask real students', detail: 'Message or talk to 2 students about their major and campus life.', impact: 'Medium impact' },
      ],
      d90: [
        { title: 'Pick your next classes intentionally', detail: 'Choose courses that test your interests and strengthen applications.', impact: 'High impact' },
        { title: 'Draft your direction story', detail: 'Write a short explanation of what you are exploring and why.', impact: 'High impact' },
        { title: 'Refresh your direction', detail: 'Update 4ward with what you learned and compare the new fit.', impact: 'Medium impact' },
      ],
    },
    bridge: {
      now: `${p.year || 'High school'} student${p.school ? ' at ' + p.school : ''}, exploring ${interests}.`,
      destination: `${collegePath} with a major direction that fits how you learn, what you care about, and what your family can actually sustain.`,
      bridge: `The connector is testing your interests before you commit: classes, conversations, college research, support, cost reality, and one real project.`,
    },
    focus: [
      { area: 'Major Exploration', status: /major|career|not sure/i.test(priority) ? 'focus' : 'building', note: 'Choose what to test next.' },
      { area: 'College Fit', status: /college|cost|paying/i.test(priority) ? 'focus' : 'building', note: affordabilityNote },
      { area: 'Real-World Exposure', status: 'building', note: 'Use activities to test interests.' },
      { area: 'Support System', status: /alone|start/i.test(support) ? 'focus' : 'building', note: support || 'Know who is helping you make decisions.' },
      { area: 'Academic Progress', status: /grade/i.test(priority) ? 'focus' : s.academics >= 55 ? 'strength' : 'building', note: s.academics >= 55 ? 'Already helping your options.' : 'Keep grades moving steadily.' },
    ],
    timeline: [
      { when: 'Right now', text: `Exploring ${interests} while still keeping options open.` },
      { when: 'This semester', text: 'Use classes, activities, and conversations to test which direction feels real.' },
      { when: 'College search', text: 'Compare schools by fit, affordability, support, and strength in your possible majors.' },
      { when: 'Next step', text: `Build one piece of proof connected to ${topTrack}.` },
    ],
  };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function setText(sel, text) {
  const el = document.querySelector(sel);
  if (el && text) el.textContent = text;
}

function renderTracks(tracks) {
  const list = document.getElementById('tracksList');
  if (!list || !tracks) return;
  list.innerHTML = tracks.map((t, i) => `
    <div class="track-item${t.primary || i === 0 ? ' primary' : ''}">
      <div class="track-label">${esc(t.label)}</div>
      <h4>${esc(t.role)}</h4>
      <p>${esc(t.reason)}</p>
    </div>
  `).join('');
}

function renderGapCards(gaps) {
  if (!gaps) return;
  const map = { skills: 'gapSkills', experience: 'gapExperience', exposure: 'gapExposure', mindset: 'gapMindset' };
  Object.entries(map).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (!el || !gaps[key]) return;
    el.innerHTML = gaps[key].map((g) => `
      <div class="gap-cat-row"><p>${esc(g.item)}</p><em>${esc(g.impact)}</em></div>
    `).join('');
  });
}

// --- Over-time loop: persistent progress + logged wins ---
function loadChecked() {
  try { return new Set(JSON.parse(localStorage.getItem('figuredChecked')) || []); } catch { return new Set(); }
}
function saveChecked(set) {
  localStorage.setItem('figuredChecked', JSON.stringify([...set]));
}
function loadWins() {
  try { return JSON.parse(localStorage.getItem('figuredWins')) || []; } catch { return []; }
}
function saveWins(wins) {
  localStorage.setItem('figuredWins', JSON.stringify(wins));
}

function renderActions(actions) {
  const el = document.getElementById('actionQueue');
  if (!el || !actions) return;
  const checked = loadChecked();
  const done = actions.filter((a) => checked.has(a)).length;
  const pct = actions.length ? Math.round((done / actions.length) * 100) : 0;
  const allDone = actions.length > 0 && done === actions.length;
  el.innerHTML = `
    <div class="action-head">
      <span>Highest-impact next actions</span>
      <em class="action-count">${done}/${actions.length} done</em>
    </div>
    <div class="action-progress"><i style="width:${pct}%"></i></div>
    ${actions.map((a) => `
      <label class="action-item${checked.has(a) ? ' done' : ''}">
        <input type="checkbox" data-action="${esc(a)}"${checked.has(a) ? ' checked' : ''} /> ${esc(a)}
      </label>`).join('')}
    ${allDone ? `
      <div class="action-complete">
        <p>Nice work, you cleared the list. Ready for your next set?</p>
        <button class="primary-button action-next" type="button" data-next-actions>Get my next set →</button>
      </div>` : ''}
    <button class="mini-button action-log" type="button" data-log-win>+ Log a win</button>
  `;
  el.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const set = loadChecked();
      const label = cb.getAttribute('data-action');
      if (cb.checked) set.add(label); else set.delete(label);
      saveChecked(set);
      cb.closest('.action-item').classList.toggle('done', cb.checked);
      const d = actions.filter((a) => set.has(a)).length;
      el.querySelector('.action-count').textContent = `${d}/${actions.length} done`;
      el.querySelector('.action-progress i').style.width = (actions.length ? Math.round((d / actions.length) * 100) : 0) + '%';
      renderTodayMove(actions);
      // Re-render so the "next set" prompt appears/disappears as completion changes.
      if ((d === actions.length) !== allDone) renderActions(actions);
    });
  });

  const nextBtn = el.querySelector('[data-next-actions]');
  if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
      if (!aiAvailable() || !FigAI.hasKey()) { nextBtn.textContent = 'Connect AI (top right) to get more'; return; }
      nextBtn.disabled = true;
      nextBtn.textContent = 'Building your next set…';
      try {
        const p = currentProfile || DEMO_PROFILE;
        const fresh = await FigAI.generateMoreActions(p, [...loadChecked(), ...actions]);
        // Clear the checks for the finished set so the new list starts fresh.
        const set = loadChecked();
        actions.forEach((a) => set.delete(a));
        saveChecked(set);
        if (aiContent) aiContent.actions = fresh;
        renderActions(fresh);
        renderTodayMove(fresh);
      } catch (e) {
        nextBtn.disabled = false;
        nextBtn.textContent = 'That did not go through. Try again';
      }
    });
  }
}

function renderTodayMove(actions) {
  const card = document.getElementById('todayMove');
  if (!card) return;
  const titleEl = card.querySelector('#todayMoveAction');
  const ctxEl = card.querySelector('#todayMoveContext');
  const btn = card.querySelector('[data-today-done]');
  if (!actions || !actions.length) {
    titleEl.textContent = "Set your action plan to see today's move.";
    ctxEl.textContent = '';
    btn.style.display = 'none';
    card.classList.remove('today-move--done');
    return;
  }
  const checked = loadChecked();
  const next = actions.find((a) => !checked.has(a));
  if (!next) {
    titleEl.textContent = "You've cleared every action.";
    ctxEl.textContent = "Log a win below to mark what changed.";
    btn.style.display = 'none';
    card.classList.add('today-move--done');
    return;
  }
  card.classList.remove('today-move--done');
  titleEl.textContent = next;
  ctxEl.textContent = "Pulled from your highest-impact actions.";
  btn.style.display = '';
  btn.onclick = () => {
    const set = loadChecked();
    set.add(next);
    saveChecked(set);
    const cbs = document.querySelectorAll('#actionQueue input[data-action]');
    const cb = Array.from(cbs).find((c) => c.getAttribute('data-action') === next);
    if (cb && !cb.checked) {
      cb.checked = true;
      cb.dispatchEvent(new Event('change'));
    } else {
      renderTodayMove(actions);
    }
  };
}

function renderAppPlan(plan) {
  if (!plan) return;
  // Each month is shown as its weeks: d30 = weeks 1-4, d60 = 5-8, d90 = 9-12.
  const phases = [
    { key: 'd30', id: 'plan30', start: 1 },
    { key: 'd60', id: 'plan60', start: 5 },
    { key: 'd90', id: 'plan90', start: 9 },
  ];
  phases.forEach(({ key, id, start }) => {
    const el = document.getElementById(id);
    if (!el || !plan[key]) return;
    el.innerHTML = plan[key].map((item, j) => `
      <div class="plan-mini">
        <span class="plan-week">Week ${start + j}</span>
        <p>${esc(item.title)}</p>
        <small>${esc(item.detail)}</small>
      </div>
    `).join('');
  });
}

function renderBridge(bridge) {
  if (!bridge) return;
  setText('#bridgeNow', bridge.now);
  setText('#bridgeGoal', bridge.destination);
  setText('#bridgeHow', bridge.bridge);
}

const FOCUS_LABEL = { focus: 'Focus here first', building: 'Building', strength: 'Strength' };

function renderFocus(focus) {
  const el = document.getElementById('focusList');
  if (!el || !focus) return;
  const rank = { focus: 0, building: 1, strength: 2 };
  const ordered = [...focus].sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));
  el.innerHTML = ordered.map((f) => {
    const status = FOCUS_LABEL[f.status] ? f.status : 'building';
    return `
    <div class="focus-row">
      <div><p>${esc(f.area)}</p><small>${esc(f.note || FOCUS_NOTE[status])}</small></div>
      <em class="focus-pill ${status}">${FOCUS_LABEL[status]}</em>
    </div>`;
  }).join('');
}

let activeTimeline = [];

// Classify a phase label so the timeline can mark past / now / upcoming nodes.
function timelinePhase(when) {
  const w = (when || '').toLowerCase();
  if (/(right now|now|today|this term|currently)/.test(w)) return 'now';
  if (/(next|by |future|eventually|graduation|long term|ahead|will|goal)/.test(w)) return 'future';
  return 'past';
}

function renderTimeline(timeline) {
  const el = document.getElementById('growthTimeline');
  if (!el) return;
  if (timeline) activeTimeline = timeline;
  const wins = loadWins();
  if (!wins.length && !activeTimeline.length) return; // keep static fallback

  const items = [];
  // The AI arc is the backbone (oldest to newest).
  activeTimeline.forEach((t) => {
    items.push({ when: t.when, text: t.text, cls: 'tl-' + timelinePhase(t.when) });
  });
  // Logged wins are real, recent milestones — show them as their own marked nodes.
  wins.forEach((w) => {
    items.push({ when: w.date, text: w.text, cls: 'tl-win' });
  });

  if (!items.length) {
    el.innerHTML = '<div class="tl-item tl-now"><span class="tl-marker"></span><div class="tl-body"><span class="tl-when">Right now</span><p>Your path starts here. Log your first win to begin the record.</p></div></div>';
    return;
  }
  el.innerHTML = items.map((it) => `
    <div class="tl-item ${it.cls}">
      <span class="tl-marker"></span>
      <div class="tl-body"><span class="tl-when">${esc(it.when)}</span><p>${esc(it.text)}</p></div>
    </div>`).join('');
}

function applyContent(c, opts = {}) {
  c = stripDashesDeep(c);
  document.querySelector('.snapshot-wide')?.classList.remove('thinking');
  setText('.snapshot-wide h2', c.headline);
  setText('.snapshot-wide p', c.body);
  renderTracks(c.tracks);
  renderGapCards(c.gaps);
  renderActions(c.actions);
  renderTodayMove(c.actions);
  renderAppPlan(c.plan);
  renderBridge(c.bridge);
  renderCurrentPath(c.bridge);
  renderFocus(c.focus);
  renderTimeline(c.timeline);
  renderExploreTree(currentProfile || DEMO_PROFILE, c.explore);
  renderComp(currentProfile || DEMO_PROFILE, c.pay);
  // When the detailed Claude version replaces the instant draft, fade the hero
  // cards in so the upgrade lands smoothly instead of snapping.
  if (opts.refined) {
    const snap = document.querySelector('.snapshot-wide');
    const tracks = document.getElementById('tracksList');
    [snap, tracks].forEach((el) => {
      if (!el) return;
      el.classList.remove('just-refined');
      void el.offsetWidth; // restart the animation
      el.classList.add('just-refined');
    });
  }
}

// A quiet "we're sharpening this" cue on the instant draft while Claude writes
// the real analysis. No mention of AI — it reads as personalization, not a
// machine status light.
// On-brand one-liner stats rotated under the cue while Claude generates. They
// double as a quiet marketing impression. Honest mentor voice, no hype, no em
// dashes (voice rule).
const REFINING_STATS = [
  'Students who define a specific goal land internships 2.3x faster.',
  'Only 23% of college seniors say their career advisor\'s advice was useful.',
  'The average student takes 11 weeks to land their first internship. Most don\'t know where to start.',
  'Students with weak networks rate their college experience 28% lower.',
  'A single peer introduction outperforms 50 cold applications.',
  'Most students never use their school\'s career center. The ones who do are 4x more likely to land their first job before graduating.',
];

let refiningStatTimer = null;

function showRefiningCue() {
  const snap = document.querySelector('.snapshot-wide');
  if (!snap || snap.querySelector('.refining-cue')) return;
  const cue = document.createElement('div');
  cue.className = 'refining-cue';
  cue.innerHTML =
    '<div class="refining-lede"><span class="refining-dot"></span> Personalizing your trajectory…</div>' +
    '<div class="refining-stat"></div>';
  snap.appendChild(cue);

  const statEl = cue.querySelector('.refining-stat');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Randomize the start so repeat runs do not always open on the same line.
  let i = Math.floor(Math.random() * REFINING_STATS.length);
  const setStat = () => { statEl.textContent = REFINING_STATS[i % REFINING_STATS.length]; };

  // First stat in immediately (fade it up if motion is allowed).
  setStat();
  if (!reduceMotion) requestAnimationFrame(() => statEl.classList.add('is-visible'));
  else statEl.classList.add('is-visible');

  refiningStatTimer = setInterval(() => {
    i += 1;
    if (reduceMotion) { setStat(); return; }
    // Cross-fade: fade out, swap text, fade back in.
    statEl.classList.remove('is-visible');
    setTimeout(() => {
      setStat();
      statEl.classList.add('is-visible');
    }, 250);
  }, 4500);
}

function hideRefiningCue() {
  if (refiningStatTimer) {
    clearInterval(refiningStatTimer);
    refiningStatTimer = null;
  }
  document.querySelectorAll('.refining-cue').forEach((el) => el.remove());
}

// When the AI personalization fails, replace the silent fallback with a clear
// "we couldn't personalize, try again" banner so the user is never stuck
// wondering what happened. The rule-based draft is still on screen behind it.
// We also surface the underlying error message in a small details line so
// the user (and we, looking at screenshots) can see what actually failed —
// "Overloaded", "invalid model", an HTTP status, etc. No more guessing.
function showRefiningError(message) {
  const snap = document.querySelector('.snapshot-wide');
  if (!snap || snap.querySelector('.refining-error')) return;
  const safeMsg = esc(String(message || '').trim()).slice(0, 240);
  const el = document.createElement('div');
  el.className = 'refining-error';
  el.innerHTML = `
    <div class="refining-error-row">
      <span>Couldn't personalize right now.</span>
      <button type="button" class="refining-retry">Try again</button>
    </div>
    ${safeMsg ? `<div class="refining-error-detail">${safeMsg}</div>` : ''}
  `;
  snap.appendChild(el);
  el.querySelector('.refining-retry').addEventListener('click', () => {
    if (currentProfile) maybeRunAI(currentProfile, true);
  });
}

function hideRefiningError() {
  document.querySelectorAll('.refining-error').forEach((el) => el.remove());
}

function renderCurrentPath(bridge) {
  if (!bridge) return;
  setText('#currentPathCopy', bridge.bridge || bridge.now || '');
}

// Will a fresh AI generation run for this profile (vs. cached or no key)?
function aiWillGenerate(p) {
  if (!aiAvailable() || !FigAI.hasKey()) return false;
  const cached = readJSON('figuredAiContent');
  return !(cached && cached.hash === hashProfile(p) && cached.data);
}

// Show a "thinking" state on the AI-driven cards instead of the weaker
// rule-based version, so the student goes loading -> great, not okay -> great.
function setAiThinking() {
  const snap = document.querySelector('.snapshot-wide');
  if (snap) {
    snap.classList.add('thinking');
    const h2 = snap.querySelector('h2');
    const p = snap.querySelector('p');
    if (h2) h2.textContent = 'Reading your trajectory…';
    if (p) p.innerHTML = '<span class="skeleton-line"></span><span class="skeleton-line"></span><span class="skeleton-line short"></span>';
  }
  setTracksThinking();
}

function setTracksThinking() {
  const list = document.getElementById('tracksList');
  if (!list) return;
  list.innerHTML = [0, 1, 2].map((i) => `
    <div class="track-item skeleton${i === 0 ? ' primary' : ''}">
      <div class="skeleton-line tiny"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>`).join('');
}

// "Show more options" on the Paths card — broadly transferable adjacents that
// rotate in when there's no AI to generate fresh, profile-specific ones.
const GENERIC_ADJACENTS = [
  { role: 'Strategy & Operations', reason: 'Analytical and cross-functional. A strong base for many senior roles.' },
  { role: 'Project & Program Management', reason: 'High demand, transferable across industries, builds toward leadership.' },
  { role: 'Data & Analytics', reason: 'Turning numbers into decisions is valuable in almost every field.' },
  { role: 'Business Development', reason: 'Relationships and deal-making open doors in any industry.' },
  { role: 'Early-Stage Startup Operator', reason: 'The fastest way to learn every part of a business at once.' },
];

let fallbackTrackOffset = 0;

function rotateFallbackTracks(p, s) {
  const goal = trimGoal(p.goal, 48);
  const domainAdj = buildAdjacentTracks(goal, (p.major || '').toLowerCase(), (p.skills || '').toLowerCase());
  const seen = new Set();
  const pool = [];
  domainAdj.concat(GENERIC_ADJACENTS).forEach((a) => {
    const key = a.role.toLowerCase();
    if (!seen.has(key)) { seen.add(key); pool.push(a); }
  });
  fallbackTrackOffset = (fallbackTrackOffset + 2) % pool.length;
  const a = pool[fallbackTrackOffset % pool.length];
  const b = pool[(fallbackTrackOffset + 1) % pool.length];
  const primary = generateTracks(p, s)[0];
  return [
    primary,
    { label: 'Adjacent path', role: a.role, reason: a.reason },
    { label: 'Also worth exploring', role: b.role, reason: b.reason },
  ];
}

// Gap Analyzer "More" — fetch a fresh set of gaps from AI, avoiding repeats.
function gapItemsShown() {
  const out = [];
  ['gapSkills', 'gapExperience', 'gapExposure', 'gapMindset'].forEach((id) => {
    document.querySelectorAll('#' + id + ' .gap-cat-row p').forEach((p) => out.push(p.textContent));
  });
  return out;
}
function initGapsRefresh() {
  const btn = document.getElementById('gapsRefresh');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (btn.classList.contains('spinning')) return;
    if (!aiAvailable() || !FigAI.hasKey()) {
      btn.classList.add('spinning');
      setTimeout(() => btn.classList.remove('spinning'), 360);
      return;
    }
    btn.classList.add('spinning');
    try {
      const p = currentProfile || DEMO_PROFILE;
      const fresh = await FigAI.generateMoreGaps(p, gapItemsShown());
      renderGapCards(fresh);
      if (aiContent) aiContent.gaps = fresh;
    } catch (e) {
      console.error('More gaps:', e);
    } finally {
      btn.classList.remove('spinning');
    }
  });
}

function initTracksRefresh() {
  const btn = document.getElementById('tracksRefresh');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (btn.classList.contains('spinning') || !currentProfile) return;

    if (aiAvailable() && FigAI.hasKey()) {
      btn.classList.add('spinning');
      setTracksThinking();
      try {
        const existing = (aiContent && aiContent.tracks ? aiContent.tracks : []).map((t) => t.role);
        const fresh = await FigAI.generateMorePaths(currentProfile, existing);
        renderTracks(fresh);
        if (aiContent) aiContent.tracks = fresh;
      } catch (e) {
        console.error('More paths:', e);
        renderTracks(generateTracks(currentProfile, currentScores));
      } finally {
        btn.classList.remove('spinning');
      }
    } else {
      // No AI key — rotate through transferable adjacents for variety
      btn.classList.add('spinning');
      renderTracks(rotateFallbackTracks(currentProfile, currentScores));
      setTimeout(() => btn.classList.remove('spinning'), 360);
    }
  });
}

// ---------------------------------------------------------------------------
// Job-search deep links
// ---------------------------------------------------------------------------

// Distill a free-text goal ("become an nba player, investment banker") into a
// clean keyword a job board can actually search ("Investment Banking").
const GOAL_ACRONYMS = { nba: 'NBA', nfl: 'NFL', wnba: 'WNBA', mlb: 'MLB', nhl: 'NHL', ux: 'UX', ui: 'UI', hr: 'HR', pm: 'PM', vc: 'VC', ai: 'AI', it: 'IT', qa: 'QA', ceo: 'CEO', cfo: 'CFO', cto: 'CTO' };

// Correct "a" vs "an" for a word, so card copy reads right whatever the goal is.
function articleFor(word) {
  return /^[aeiou]/i.test(String(word || '').trim()) ? 'an' : 'a';
}

function searchTerm(goal) {
  // Empty or placeholder goals fall back to a generic job search instead of
  // leaking strings like "your goal" into LinkedIn / Indeed / Handshake URLs.
  if (!goal) return 'Internships';
  const lowered = String(goal).trim().toLowerCase();
  if (!lowered || lowered === 'your goal' || lowered === 'goal') return 'Internships';
  let g = goal.toLowerCase().replace(/\n/g, ' ').trim();
  // strip "I want to", "become a", "work as", "a career in", etc.
  g = g
    .replace(/^(i\s+(want|wanna|would like|hope|plan|aim|aspire)\s+to\s+)/, '')
    .replace(/^(become|be|work|get|getting|land|pursue|study|major|going)\s+(an?\s+|in\s+|as\s+|a\s+career\s+(in|as)\s+|into\s+)?/, '')
    .replace(/^(a\s+career\s+(in|as)|career\s+(in|as)|job\s+as|role\s+as|working\s+as|interested\s+in)\s+/, '')
    .replace(/^(an?|the)\s+/, '');
  // a sentence with several goals — take the first clear one
  g = g.split(/\s*(?:,|\/|;|·| and | or | then | but )\s*/)[0];
  g = g.replace(/[.!?]+$/, '').trim();
  // strip hedge words students often type ("animation maybe", "hopefully finance",
  // "marketing i guess") so the goal always reads as a clean job title.
  g = g.replace(/\b(maybe|perhaps|possibly|probably|hopefully|ideally|honestly|kinda|sorta|prob)\b/g, ' ');
  g = g.replace(/\bi\s+(think|guess|hope|feel|mean|dunno)\b/g, ' ');
  g = g.replace(/\bor\s+(something|so|whatever)\b/g, ' ');
  g = g.replace(/\s+/g, ' ').trim();
  if (!g) return 'Internships';
  // title-case, then fix known acronyms
  g = g.replace(/\b[\w']+/g, (w) => GOAL_ACRONYMS[w] || (w.charAt(0).toUpperCase() + w.slice(1)));
  return g.length > 48 ? g.slice(0, 48).trim() : g;
}

// LinkedIn experience-level codes: 1=Internship, 2=Entry, 3=Associate, 4=Mid-Senior
function linkedinJobsURL(keyword, expLevel) {
  let url = 'https://www.linkedin.com/jobs/search/?keywords=' + encodeURIComponent(keyword) + '&location=United%20States';
  if (expLevel) url += '&f_E=' + expLevel;
  return url;
}
function linkedinPeopleURL(keyword) {
  return 'https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent(keyword);
}
// A Google search for "linkedin <who>" surfaces the real profile faster than
// LinkedIn's own logged-out people search — used as the find-a-person fallback.
function googleLinkedinURL(who) {
  return 'https://www.google.com/search?q=' + encodeURIComponent('linkedin ' + who);
}
function indeedURL(keyword) {
  return 'https://www.indeed.com/jobs?q=' + encodeURIComponent(keyword) + '&l=United+States';
}
function googleJobsURL(keyword) {
  return 'https://www.google.com/search?q=' + encodeURIComponent(keyword + ' jobs') + '&ibp=htl;jobs';
}
// Each school has its own Handshake subdomain (e.g. trinity.joinhandshake.com).
// When we know it, link there so the student lands in their own school's
// posting feed instead of the generic login page. Falls back to app.joinhandshake.com
// when the school isn't mapped or there's no profile yet.
const HANDSHAKE_SUBDOMAIN = {
  // NESCAC + small liberal arts. Trinity College in Hartford uses "trincoll"
  // on Handshake (matches their email domain), not "trinity".
  'trinity college': 'trincoll',
  'trinity college hartford': 'trincoll',
  'trinity, hartford, ct': 'trincoll',
  'amherst college': 'amherst',
  'bowdoin college': 'bowdoin',
  'bates college': 'bates',
  'colby college': 'colby',
  'hamilton college': 'hamilton',
  'middlebury college': 'middlebury',
  'wesleyan university': 'wesleyan',
  'williams college': 'williams',
  'connecticut college': 'conncoll',
  'tufts university': 'tufts',
  'pomona college': 'pomona',
  'swarthmore college': 'swarthmore',
  'haverford college': 'haverford',
  'carleton college': 'carleton',
  'macalester college': 'macalester',
  'davidson college': 'davidson',
  'reed college': 'reed',
  'vassar college': 'vassar',
  'bard college': 'bard',
  'holy cross': 'holycross',
  'college of the holy cross': 'holycross',
  'skidmore college': 'skidmore',
  'colgate university': 'colgate',
  'oberlin college': 'oberlin',
  'kenyon college': 'kenyon',
  'grinnell college': 'grinnell',
  'wellesley college': 'wellesley',
  'smith college': 'smith',
  'mount holyoke college': 'mtholyoke',
  'bryn mawr college': 'brynmawr',
  'barnard college': 'barnard',
  'occidental college': 'oxy',
  'whitman college': 'whitman',
  'sarah lawrence college': 'sarahlawrence',
  'bucknell university': 'bucknell',
  'lafayette college': 'lafayette',
  'dickinson college': 'dickinson',
  'lehigh university': 'lehigh',
  'gettysburg college': 'gettysburg',
  'franklin & marshall college': 'fandm',
  'claremont mckenna college': 'cmc',
  'harvey mudd college': 'hmc',
  'pitzer college': 'pitzer',
  'scripps college': 'scrippscollege',
  // Ivies + top privates
  'harvard university': 'harvard',
  'yale university': 'yale',
  'princeton university': 'princeton',
  'columbia university': 'columbia',
  'university of pennsylvania': 'upenn',
  'brown university': 'brown',
  'dartmouth college': 'dartmouth',
  'cornell university': 'cornell',
  'stanford university': 'stanford',
  'massachusetts institute of technology': 'mit',
  'mit': 'mit',
  'california institute of technology': 'caltech',
  'caltech': 'caltech',
  'duke university': 'duke',
  'university of chicago': 'uchicago',
  'northwestern university': 'northwestern',
  'johns hopkins university': 'jhu',
  'vanderbilt university': 'vanderbilt',
  'rice university': 'rice',
  'washington university in st. louis': 'wustl',
  'emory university': 'emory',
  'carnegie mellon university': 'cmu',
  'university of notre dame': 'nd',
  'georgetown university': 'georgetown',
  'new york university': 'nyu',
  'university of southern california': 'usc',
  'boston university': 'bu',
  'boston college': 'bc',
  'brandeis university': 'brandeis',
  'wake forest university': 'wfu',
  'case western reserve university': 'cwru',
  'tulane university': 'tulane',
  'northeastern university': 'northeastern',
  'george washington university': 'gwu',
  'american university': 'american',
  'syracuse university': 'syracuse',
  'fordham university': 'fordham',
  'villanova university': 'villanova',
  // HBCUs
  'spelman college': 'spelman',
  'morehouse college': 'morehouse',
  'howard university': 'howard',
  'hampton university': 'hampton',
  'tuskegee university': 'tuskegee',
  'xavier university of louisiana': 'xula',
  'florida a&m university': 'famu',
  'north carolina a&t state university': 'ncat',
  'morgan state university': 'morgan',
  'tennessee state university': 'tnstate',
  'jackson state university': 'jsums',
  'clark atlanta university': 'cau',
  // Big publics
  'university of california, berkeley': 'berkeley',
  'university of california, los angeles': 'ucla',
  'university of california, san diego': 'ucsd',
  'university of california, davis': 'ucdavis',
  'university of california, irvine': 'uci',
  'university of california, santa barbara': 'ucsb',
  'university of michigan': 'umich',
  'university of michigan ann arbor': 'umich',
  'university of virginia': 'virginia',
  'university of north carolina at chapel hill': 'unc',
  'university of texas at austin': 'utexas',
  'university of florida': 'ufl',
  'university of washington': 'uw',
  'university of wisconsin-madison': 'wisc',
  'university of illinois urbana-champaign': 'illinois',
  'university of minnesota': 'umn',
  'ohio state university': 'osu',
  'university of georgia': 'uga',
  'pennsylvania state university': 'psu',
  'university of maryland': 'umd',
  'rutgers university': 'rutgers',
  'university of massachusetts amherst': 'umass',
  'indiana university bloomington': 'iu',
  'purdue university': 'purdue',
  'university of iowa': 'uiowa',
  'iowa state university': 'iastate',
  'michigan state university': 'msu',
  'arizona state university': 'asu',
  'university of arizona': 'arizona',
  'university of colorado boulder': 'colorado',
  'university of connecticut': 'uconn',
  'texas a&m university': 'tamu',
  'university of pittsburgh': 'pitt',
  'temple university': 'temple',
  'florida state university': 'fsu',
  'georgia institute of technology': 'gatech',
  'virginia tech': 'vt',
  'clemson university': 'clemson',
  'auburn university': 'auburn',
  'university of alabama': 'alabama',
  'louisiana state university': 'lsu',
  'university of tennessee': 'utk',
  'university of kentucky': 'uky',
  'university of south carolina': 'sc',
  'university of oregon': 'uoregon',
  'oregon state university': 'oregonstate',
  // Other commonly attended schools
  'rensselaer polytechnic institute': 'rpi',
  'worcester polytechnic institute': 'wpi',
  'stevens institute of technology': 'stevens',
  'university of rochester': 'rochester',
  'rochester institute of technology': 'rit',
  'santa clara university': 'scu',
  'loyola marymount university': 'lmu',
  'university of san diego': 'sandiego',
  'university of san francisco': 'usfca',
  'gonzaga university': 'gonzaga',
  'creighton university': 'creighton',
  'saint louis university': 'slu',
  'marquette university': 'marquette',
  'baylor university': 'baylor',
  'texas christian university': 'tcu',
  'brigham young university': 'byu',
  'elon university': 'elon',
  'high point university': 'highpoint',
  'pepperdine university': 'pepperdine',
  'southern methodist university': 'smu',
  'babson college': 'babson',
  'bentley university': 'bentley',
  'bryant university': 'bryant',
  'quinnipiac university': 'qu',
  'fairfield university': 'fairfield',
  'sacred heart university': 'sacredheart',
  'providence college': 'providence',
  // Art and design schools
  'rhode island school of design': 'risd',
  'pratt institute': 'pratt',
  'parsons school of design': 'parsons',
  'school of the art institute of chicago': 'saic',
  'savannah college of art and design': 'scad',
  'maryland institute college of art': 'mica',
  'berklee college of music': 'berklee',
  'juilliard school': 'juilliard',
  'new england conservatory': 'necmusic',
};

function handshakeSubdomain(profile) {
  const raw = String(profile?.school || '').trim().toLowerCase();
  if (!raw) return '';
  if (HANDSHAKE_SUBDOMAIN[raw]) return HANDSHAKE_SUBDOMAIN[raw];
  // Derive a subdomain. Replace every non-alphanumeric with a space so commas,
  // periods, ampersands etc. can't end up in the hostname (DNS NXDOMAINs on
  // them). Then drop stopwords and take the FIRST significant token, which
  // matches the real Handshake pattern (pomona, williams, hamilton, etc.).
  const stopwords = new Set(['college', 'university', 'institute', 'school', 'of', 'the', 'at', 'and']);
  const tokens = raw
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !stopwords.has(t));
  const first = tokens[0] || '';
  // Hostnames must be at least 3 chars to be useful; anything shorter (e.g. a
  // single "of" surviving) gets the generic Handshake login instead of a
  // broken subdomain.
  return first.length >= 3 ? first : '';
}

function handshakeURL(keyword, profile) {
  const sub = handshakeSubdomain(profile);
  const base = sub ? `https://${sub}.joinhandshake.com` : 'https://app.joinhandshake.com';
  if (keyword) return base + '/job-search/?query=' + encodeURIComponent(keyword);
  return base + '/';
}

// ---------------------------------------------------------------------------
// Mentors — real opted-in profiles link directly; everyone else falls back to
// a search. A mentor who joins 4ward and shares their profile becomes one
// object in MENTORS_OPTED_IN with a `linkedin` URL, and the card links straight
// to it. This is the consent model: we only deep-link a real person when they
// have said yes and given us the URL.
// ---------------------------------------------------------------------------

// Opted-in mentors come from the mentor intake form (mentor.html), stored in
// localStorage. In production this would be a shared database; in this
// prototype a mentor who joins in this browser shows up in the app here.
function loadOptedInMentors() {
  let stored = [];
  try { stored = JSON.parse(localStorage.getItem('figuredMentors')) || []; } catch { stored = []; }
  return Array.isArray(stored) ? stored.filter(m => m && m.name && m.linkedin) : [];
}

function initialsFor(m) {
  if (m.initials) return m.initials;
  const words = (m.name || '?').replace(/[^a-zA-Z ]/g, '').trim().split(/\s+/);
  return ((words[0]?.[0] || '') + (words[1]?.[0] || '')).toUpperCase() || '★';
}

function renderMentors(term) {
  const grid = document.getElementById('mentorGrid');
  if (!grid) return;
  // Only ever show real, opted-in mentors. Never invent a "someone" — a real
  // user with no connections yet should see an honest empty state, not fake people.
  const mentors = loadOptedInMentors();
  if (mentors.length === 0) {
    grid.innerHTML = `
      <div class="conn-empty">
        <h3>No connections yet</h3>
        <p>This fills in as mentors join 4ward. Until then, use "Find more on LinkedIn" above to start reaching out to people on your path.</p>
      </div>`;
    return;
  }
  grid.innerHTML = mentors.map((m) => {
    const opted = Boolean(m.linkedin);
    const href = opted ? m.linkedin : googleLinkedinURL(m.search || m.name);
    const cta = opted ? 'View profile →' : 'Find on LinkedIn →';
    return `
      <article class="product-card mentor-app-card">
        <div class="mentor-avatar">${esc(initialsFor(m))}</div>
        <h3>${esc(m.name)}</h3>
        <p>${esc(m.sub || '')}</p>
        ${opted ? '<span class="opted-badge">✓ On 4ward</span>' : ''}
        <small>${esc(m.why || '')}</small>
        <a class="opp-link${opted ? ' opted' : ''}" href="${href}" target="_blank" rel="noopener">${cta}</a>
      </article>`;
  }).join('');
}

// Peers mirror mentors: real students who opted in via peer.html, stored in
// localStorage. Honest empty state until students join. No fake profiles.
function loadOptedInPeers() {
  let stored = [];
  try { stored = JSON.parse(localStorage.getItem('figuredPeers')) || []; } catch { stored = []; }
  return Array.isArray(stored) ? stored.filter(p => p && p.name) : [];
}

function renderPeers() {
  const grid = document.getElementById('peerGrid');
  if (!grid) return;
  const peers = loadOptedInPeers();
  if (peers.length === 0) {
    grid.innerHTML = `
      <div class="conn-empty">
        <h3>No students yet</h3>
        <p>This fills in as students join 4ward. Be the first on your path: add yourself so others a step behind can reach out to you.</p>
      </div>`;
    return;
  }
  grid.innerHTML = peers.map((m) => {
    const linked = Boolean(m.linkedin);
    return `
      <article class="product-card mentor-app-card">
        <div class="mentor-avatar">${esc(initialsFor(m))}</div>
        <h3>${esc(m.name)}</h3>
        <p>${esc(m.sub || '')}</p>
        <span class="opted-badge">✓ On 4ward</span>
        <small>${esc(m.why || '')}</small>
        ${linked ? `<a class="opp-link opted" href="${esc(m.linkedin)}" target="_blank" rel="noopener">View profile →</a>` : ''}
      </article>`;
  }).join('');
}

// ---------------------------------------------------------------------------
// Networking — "Who to meet" archetypes.
// We never invent a named person. Instead we describe the KIND of person worth
// meeting on this path, why they matter, what to ask, and a message to send.
// The cards are a self-contained reference, not a directory of real people.
// ---------------------------------------------------------------------------
function networkArchetypes(term, p) {
  // Always run the goal through the cleaner so hedge words ("maybe") and odd
  // grammar never reach the cards, no matter how this is called.
  const goal = searchTerm(term) || 'your field';
  const hasSchool = Boolean(p && p.school);
  const school = hasSchool ? p.school : 'your school';
  const first = (p && p.firstName) ? p.firstName : 'a student';
  // The cards are pure reference, not a directory: who to look for, why they
  // matter, what to ask, and a message to send. No outbound links to break.
  return [
    {
      tag: 'Alumni',
      role: `${goal} professional from ${school}`,
      sub: `2–4 years into the exact role you want`,
      why: `They walked the same path from the same place, so their advice maps directly onto your situation. Shared-school connections reply far more often.`,
      questions: [
        'How did you land your first internship in this field?',
        'What skills mattered most early on?',
        'What would you do differently if you were starting now?',
      ],
      message: `Hi, I'm ${first}, currently at ${school} working toward ${goal}. I saw you came through ${school} and are now in the field. Would you be open to a 15-minute call? I'd love to hear how you got started.`,
    },
    {
      tag: 'Upperclassman',
      role: `A senior who landed ${articleFor(goal)} ${goal} internship`,
      sub: `One or two years ahead of you on campus`,
      why: `They just went through the exact recruiting cycle you're about to face. The timelines, the deadlines, the people who interviewed them. All still fresh.`,
      questions: [
        'When did you start applying, and where?',
        'What did the interview process actually look like?',
        'Which campus resources actually helped?',
      ],
      message: `Hey, I'm ${first}, also at ${school} and exploring ${goal}. I saw you interned in the space. Could I grab 15 minutes to hear how you approached recruiting? Would really appreciate it.`,
    },
    {
      tag: 'Professional',
      role: `Someone hiring or working in ${goal} now`,
      sub: `Mid-level person at a company you'd target`,
      why: `They know what teams are actually looking for this year and can tell you whether your plan matches reality. Great for an informational chat, not a job ask.`,
      questions: [
        'What separates strong early candidates from the rest?',
        'What does a typical first year in this role look like?',
        'Where do you wish more students focused their time?',
      ],
      message: `Hi, I'm ${first}, a student working toward ${goal}. I'm trying to understand the field from people actually in it. Would you be open to a short informational chat? No ask beyond your perspective.`,
    },
    {
      tag: 'On campus',
      role: `A professor or club leader in this area`,
      sub: `Already at ${school}, easy to reach`,
      why: `The lowest-friction connection on this list. Office hours and club meetings are built-in invitations, and they often know the alumni you can't find yourself.`,
      questions: [
        'Which alumni in this field could I reach out to?',
        'What experience would strengthen my path right now?',
        'Are there projects or research I could join?',
      ],
      message: `Hi Professor, I'm ${first}, exploring a path toward ${goal}. I'd love to stop by office hours to ask for advice on building the right experience. When works best?`,
    },
  ];
}

function renderNetwork(term, p) {
  const grid = document.getElementById('networkGrid');
  if (!grid) return;
  const cards = networkArchetypes(term, p);
  grid.innerHTML = cards.map((c, i) => {
    const initials = c.tag.slice(0, 2).toUpperCase();
    return `
      <article class="product-card network-card">
        <div class="network-top">
          <div class="network-avatar">${esc(initials)}</div>
          <span class="network-tag">${esc(c.tag)}</span>
        </div>
        <h3>${esc(c.role)}</h3>
        <p class="network-sub">${esc(c.sub)}</p>
        <div class="network-why"><strong>Why meet</strong><p>${esc(c.why)}</p></div>
        <div class="network-block">
          <strong>Questions to ask</strong>
          <ul>${c.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ul>
        </div>
        <div class="network-block network-msg">
          <strong>Message to send</strong>
          <p data-msg="${esc(c.message)}">${esc(c.message)}</p>
          <div class="network-actions">
            <button class="mini-button" type="button" data-copy-msg="${i}">Copy message</button>
            <button class="mini-button mini-ghost" type="button" data-track-name="${esc(c.role)}" data-track-role="${esc(c.tag)} · ${esc(c.sub)}">+ Track</button>
          </div>
        </div>
      </article>`;
  }).join('');
}

// Copy-message buttons (delegated so re-renders keep working)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-copy-msg]');
  if (!btn) return;
  const msg = btn.closest('.network-msg')?.querySelector('[data-msg]')?.dataset.msg || '';
  navigator.clipboard?.writeText(msg).then(() => {
    const original = btn.textContent;
    btn.textContent = 'Copied ✓';
    setTimeout(() => { btn.textContent = original; }, 1600);
  });
});

// ---------------------------------------------------------------------------
// Outreach tracker. The #1 thing career centers do: help students track who
// they're reaching out to. Students add contacts and move them along a simple
// status: To reach out -> Reached out -> Replied -> Met. Saved in localStorage.
// ---------------------------------------------------------------------------
const OUTREACH_STATUSES = ['To reach out', 'Reached out', 'Replied', 'Met'];

function loadOutreach() {
  try { const v = JSON.parse(localStorage.getItem('figuredOutreach')); return Array.isArray(v) ? v : []; }
  catch { return []; }
}
function saveOutreach(list) {
  try { localStorage.setItem('figuredOutreach', JSON.stringify(list)); } catch (e) { /* ignore */ }
}

function renderOutreach() {
  const listEl = document.getElementById('outreachList');
  const summaryEl = document.getElementById('outreachSummary');
  if (!listEl) return;
  const list = loadOutreach();

  if (summaryEl) {
    if (!list.length) {
      summaryEl.textContent = '';
    } else {
      const counts = OUTREACH_STATUSES.map((s) => list.filter((c) => c.status === s).length);
      summaryEl.textContent = `${list.length} contact${list.length === 1 ? '' : 's'} · ${counts[0]} to reach out · ${counts[2]} replied · ${counts[3]} met`;
    }
  }

  if (!list.length) {
    listEl.innerHTML = `
      <div class="conn-empty">
        <h3>No one tracked yet</h3>
        <p>Add the people you want to connect with above, or add someone straight from "Who to meet". Then move them along as you reach out and hear back.</p>
      </div>`;
    return;
  }

  listEl.innerHTML = list.map((c) => {
    const cls = 'st-' + String(c.status || '').toLowerCase().replace(/[^a-z]+/g, '-');
    const opts = OUTREACH_STATUSES.map((s) => `<option value="${esc(s)}"${s === c.status ? ' selected' : ''}>${esc(s)}</option>`).join('');
    return `
      <div class="outreach-row" data-id="${esc(c.id)}">
        <div class="outreach-who">
          <span class="outreach-dot ${cls}"></span>
          <div>
            <p>${esc(c.name)}</p>
            ${c.role ? `<small>${esc(c.role)}</small>` : ''}
          </div>
        </div>
        <div class="outreach-controls">
          <select class="outreach-status" data-id="${esc(c.id)}" aria-label="Status">${opts}</select>
          <button class="outreach-remove" type="button" data-remove="${esc(c.id)}" aria-label="Remove">&times;</button>
        </div>
      </div>`;
  }).join('');
}

function addOutreach(name, role) {
  const n = (name || '').trim();
  if (!n) return false;
  const list = loadOutreach();
  // Skip exact duplicates so "Track" from an archetype can't pile up.
  if (list.some((c) => c.name === n && (c.role || '') === (role || '').trim())) { renderOutreach(); return true; }
  list.unshift({ id: 'o' + Date.now() + Math.random().toString(36).slice(2, 6), name: n, role: (role || '').trim(), status: OUTREACH_STATUSES[0] });
  saveOutreach(list);
  renderOutreach();
  return true;
}

(function initOutreach() {
  const addBtn = document.getElementById('outreachAddBtn');
  const nameEl = document.getElementById('outreachName');
  const roleEl = document.getElementById('outreachRole');
  if (!addBtn || !nameEl) return;

  const submit = () => {
    if (addOutreach(nameEl.value, roleEl ? roleEl.value : '')) {
      nameEl.value = ''; if (roleEl) roleEl.value = '';
      nameEl.focus();
    }
  };
  addBtn.addEventListener('click', submit);
  [nameEl, roleEl].forEach((el) => el && el.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); }));

  // Status change + remove (delegated).
  document.addEventListener('change', (e) => {
    const sel = e.target.closest('.outreach-status');
    if (!sel) return;
    const list = loadOutreach();
    const c = list.find((x) => x.id === sel.dataset.id);
    if (c) { c.status = sel.value; saveOutreach(list); renderOutreach(); }
  });
  document.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-remove]');
    if (!rm) return;
    saveOutreach(loadOutreach().filter((x) => x.id !== rm.dataset.remove));
    renderOutreach();
  });

  // "Track" buttons on the Who-to-meet archetype cards.
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-track-name]');
    if (!t) return;
    addOutreach(t.dataset.trackName, t.dataset.trackRole || '');
    const original = t.textContent;
    t.textContent = 'Added to outreach ✓';
    setTimeout(() => { t.textContent = original; }, 1600);
  });

  renderOutreach();
})();

// ---------------------------------------------------------------------------
// Explore tree. A discovery map: how a broad field fans out into specific
// niches (the "leaves") a student may never have heard of. Not a promotion
// ladder. Keyed off detectDomain with a generic fallback.
// ---------------------------------------------------------------------------
const EXPLORE_TREES = {
  sports: { field: 'Sports', branches: [
    { name: 'Team Operations', leaves: ['Scouting', 'Player Development', 'Analytics', 'Salary Cap'] },
    { name: 'Team Business', leaves: ['Ticket Sales', 'Sponsorship', 'Partnerships'] },
    { name: 'Media & Content', leaves: ['Broadcasting', 'Social Media', 'Sports Journalism'] },
  ]},
  product: { field: 'Product', branches: [
    { name: 'Building Products', leaves: ['Product Manager', 'Product Ops', 'Growth PM'] },
    { name: 'Design & Research', leaves: ['UX Design', 'User Research', 'Product Design'] },
    { name: 'Data & Strategy', leaves: ['Product Analyst', 'Data Science', 'Product Strategy'] },
  ]},
  finance: { field: 'Finance', branches: [
    { name: 'Markets', leaves: ['Investment Banking', 'Sales & Trading', 'Equity Research'] },
    { name: 'Investing', leaves: ['Asset Management', 'Private Equity', 'Venture Capital'] },
    { name: 'Inside Companies', leaves: ['Corporate Finance', 'FP&A', 'Treasury'] },
  ]},
  economics: { field: 'Economics', branches: [
    { name: 'Finance & Markets', leaves: ['Investment Banking', 'Asset Management', 'Corporate Finance'] },
    { name: 'Data & Analytics', leaves: ['Economic Analyst', 'Data Analyst', 'Business Intelligence'] },
    { name: 'Policy & Research', leaves: ['Economic Consulting', 'Policy Analyst', 'Research Associate'] },
  ]},
  psychology: { field: 'Psychology', branches: [
    { name: 'Clinical & Counseling', leaves: ['Counselor', 'Clinical Psychologist', 'Social Worker'] },
    { name: 'Research & Academia', leaves: ['Research Assistant', 'Behavioral Researcher', 'Grad School'] },
    { name: 'People & Product', leaves: ['HR / People Ops', 'UX Research', 'Talent & Recruiting'] },
  ]},
  software: { field: 'Software', branches: [
    { name: 'Building', leaves: ['Frontend', 'Backend', 'Mobile', 'Full-Stack'] },
    { name: 'Data & AI', leaves: ['Data Engineering', 'Data Science', 'ML Engineering'] },
    { name: 'Systems', leaves: ['DevOps', 'Security', 'Cloud / Infra'] },
  ]},
  marketing: { field: 'Marketing', branches: [
    { name: 'Brand & Story', leaves: ['Brand Marketing', 'Content', 'PR & Comms'] },
    { name: 'Growth', leaves: ['Performance / Ads', 'SEO', 'Lifecycle / Email'] },
    { name: 'Insight', leaves: ['Market Research', 'Marketing Analytics'] },
  ]},
  consulting: { field: 'Consulting', branches: [
    { name: 'Strategy', leaves: ['Management Consulting', 'Corporate Strategy'] },
    { name: 'Specialized', leaves: ['Tech Consulting', 'Operations', 'Human Capital'] },
    { name: 'Boutique', leaves: ['Economic Consulting', 'Sustainability'] },
  ]},
  design: { field: 'Design', branches: [
    { name: 'Digital Product', leaves: ['UX Design', 'UI Design', 'Product Design'] },
    { name: 'Brand & Visual', leaves: ['Brand Design', 'Graphic Design', 'Art Direction'] },
    { name: 'Emerging', leaves: ['Motion Design', 'Design Research', '3D / AR'] },
  ]},
  creative: { field: 'Creative', branches: [
    { name: 'Animation & Motion', leaves: ['2D Animation', '3D Animation', 'Motion Graphics', 'Rigging'] },
    { name: 'Art & Story', leaves: ['Concept Art', 'Storyboarding', 'Illustration'] },
    { name: 'Where it lives', leaves: ['Film & TV', 'Games', 'Advertising', 'Studios'] },
  ]},
  founder: { field: 'Startups', branches: [
    { name: 'Start it', leaves: ['Founder', 'Co-Founder', 'Solo / Indie'] },
    { name: 'Build it early', leaves: ['Founding Engineer', 'Early PM', 'Growth Lead'] },
    { name: 'Fuel it', leaves: ['Venture Capital', 'Accelerators', 'Angel Investing'] },
  ]},
  medicine: { field: 'Medicine & Health', branches: [
    { name: 'Clinical', leaves: ['Physician', 'Nursing', 'Physician Assistant'] },
    { name: 'Behind the care', leaves: ['Public Health', 'Health Policy', 'Hospital Admin'] },
    { name: 'Science & Industry', leaves: ['Biotech', 'Clinical Research', 'Med Devices'] },
  ]},
  law: { field: 'Law', branches: [
    { name: 'Practice', leaves: ['Corporate Law', 'Litigation', 'IP Law'] },
    { name: 'Public', leaves: ['Public Interest', 'Government', 'Policy'] },
    { name: 'Adjacent', leaves: ['Compliance', 'Legal Tech', 'Mediation'] },
  ]},
};

function buildGenericExplore(p) {
  const goal = (p && p.goal) ? p.goal : 'your field';
  return { field: goal, branches: [
    { name: 'The obvious path', leaves: ['Entry roles', 'Internships', 'The role you named'] },
    { name: 'Adjacent paths', leaves: ['Related roles', 'Crossover fields', 'Specialist tracks'] },
    { name: 'Roles you may not know', leaves: ['Operations', 'Strategy', 'Analytics'] },
  ]};
}

function renderExploreTree(p, aiExplore) {
  const wrap = document.getElementById('exploreTree');
  if (!wrap) return;
  // Prefer the AI-generated, profile-accurate tree; fall back to the static map.
  const valid = aiExplore && aiExplore.field && Array.isArray(aiExplore.branches) && aiExplore.branches.length;
  const tree = valid ? aiExplore : (EXPLORE_TREES[detectDomain(p || {})] || buildGenericExplore(p));
  const titleEl = document.getElementById('exploreTitle');
  if (titleEl) titleEl.textContent = `${tree.field} is bigger than one job.`;

  wrap.innerHTML = `
    <div class="xtree">
      <div class="xtree-root"><span class="xtree-root-dot"></span>${esc(tree.field)}</div>
      <div class="xtree-branches">
        ${tree.branches.map((b) => `
          <div class="xtree-branch">
            <div class="xtree-branch-node">${esc(b.name)}</div>
            <div class="xtree-leaves">
              ${b.leaves.map((l) => `<span class="xtree-leaf">${esc(l)}</span>`).join('')}
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Résumé review (dashboard). Upload a résumé, get the full honest breakdown:
// an overall read, how it holds up area-by-area (labels, never scores), weak
// verbs to swap, bullet rewrites, and keywords missing for the student's goal.
// ---------------------------------------------------------------------------
const RESUME_STATUS_CLASS = { strong: 'strong', building: 'building', 'needs work': 'needs', missing: 'missing' };

function renderResumeAnalysis(a) {
  const empty = document.getElementById('resumeEmpty');
  const wrap = document.getElementById('resumeAnalysis');
  if (!wrap) return;
  if (!a || !a.summary) { if (empty) empty.hidden = false; wrap.hidden = true; return; }
  if (empty) empty.hidden = true;
  wrap.hidden = false;

  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  set('resumeSummary', esc(a.summary));

  set('resumeReview', (a.review || []).map((r) => {
    const cls = RESUME_STATUS_CLASS[String(r.status || '').toLowerCase()] || 'building';
    return `<div class="resume-review-row">
      <div><p>${esc(r.area)}</p><small>${esc(r.note)}</small></div>
      <em class="resume-pill ${cls}">${esc(r.status)}</em>
    </div>`;
  }).join('') || '<p class="resume-none">No issues flagged.</p>');

  set('resumeVerbs', (a.verbSwaps || []).length
    ? (a.verbSwaps || []).map((v) => `<div class="resume-verb"><span class="verb-from">${esc(v.from)}</span><span class="verb-arrow">→</span><span class="verb-to">${esc(v.to)}</span></div>`).join('')
    : '<p class="resume-none">Your verbs are already active. Nice.</p>');

  set('resumeKeywords', (a.keywords || []).length
    ? (a.keywords || []).map((k) => `<span class="resume-kw">${esc(k)}</span>`).join('')
    : '<p class="resume-none">You already cover the key terms for your goal.</p>');

  set('resumeRewrites', (a.rewrites || []).length
    ? (a.rewrites || []).map((r) => `<div class="resume-rewrite">
        <div class="rw-before"><span>Before</span><p>${esc(r.before)}</p></div>
        <div class="rw-after"><span>After</span><p>${esc(r.after)}</p></div>
      </div>`).join('')
    : '<p class="resume-none">No bullets needed rewriting.</p>');
}

(function dashboardResume() {
  const btn = document.getElementById('appResumeBtn');
  const fileInput = document.getElementById('appResumeFile');
  const statusEl = document.getElementById('appResumeStatus');
  const emptyAi = document.getElementById('resumeEmptyAi');
  if (!btn || !fileInput) return;

  const setStatus = (msg, kind) => {
    if (!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.className = 'resume-app-status' + (kind ? ' ' + kind : '');
  };

  const guidelinesEl = document.getElementById('resumeGuidelines');
  const templateBtn = document.getElementById('resumeTemplateBtn');
  const templateInput = document.getElementById('resumeTemplateFile');
  const templateNameEl = document.getElementById('resumeTemplateName');

  // The uploaded school template, kept for the session and reused on each parse.
  let resumeTemplate = null;

  // Show any analysis saved from a previous upload (here or in onboarding).
  renderResumeAnalysis(readJSON('figuredResumeAnalysis'));
  const aiReady = () => (typeof FigAI !== 'undefined') && FigAI.hasKey();
  if (emptyAi) emptyAi.style.display = aiReady() ? 'none' : '';

  // Remember the student's pasted guidelines between visits.
  try {
    const savedGuide = localStorage.getItem('figuredResumeGuidelines');
    if (savedGuide && guidelinesEl) guidelinesEl.value = savedGuide;
  } catch (e) { /* ignore */ }
  if (guidelinesEl) guidelinesEl.addEventListener('input', () => {
    try { localStorage.setItem('figuredResumeGuidelines', guidelinesEl.value); } catch (e) { /* ignore */ }
  });

  // Upload the school's résumé template/sample to check the résumé against.
  if (templateBtn && templateInput) {
    templateBtn.addEventListener('click', () => templateInput.click());
    templateInput.addEventListener('change', () => {
      const file = templateInput.files[0];
      if (!file) return;
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const data = isPdf ? (String(reader.result).split(',')[1] || '') : String(reader.result);
        resumeTemplate = { data, mediaType: isPdf ? 'application/pdf' : 'text/plain' };
        if (templateNameEl) templateNameEl.textContent = 'Using: ' + file.name;
      };
      if (isPdf) reader.readAsDataURL(file); else reader.readAsText(file);
      templateInput.value = '';
    });
  }

  btn.addEventListener('click', () => {
    if (!aiReady()) { setStatus('Connect AI (top right) first, then upload.', 'error'); return; }
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = async () => {
      const data = isPdf ? (String(reader.result).split(',')[1] || '') : String(reader.result);
      const mediaType = isPdf ? 'application/pdf' : 'text/plain';
      const goal = (currentProfile || DEMO_PROFILE).goal || '';
      const opts = {
        goal,
        guidelines: guidelinesEl ? guidelinesEl.value.trim() : '',
        template: resumeTemplate,
      };
      // Opus does a deep review, so this runs in the background. Tell the student
      // they can keep using the app; the result renders here whenever it finishes.
      setStatus('Analyzing your résumé in depth. Keep using the app, your breakdown appears here when it is ready (about a minute).', 'loading');
      let a = null;
      for (let attempt = 0; attempt < 2 && !a; attempt++) {
        try {
          a = await FigAI.parseResume(data, mediaType, opts);
        } catch (e) {
          if (attempt === 0) {
            setStatus('Still working on it, trying once more…', 'loading');
          } else {
            setStatus('That did not go through. Tap "Upload résumé" to try again.', 'error');
          }
        }
      }
      if (a) {
        try { localStorage.setItem('figuredResumeAnalysis', JSON.stringify(a)); } catch (e) { /* ignore */ }
        try { localStorage.setItem('figuredResumeFeedback', JSON.stringify(a.feedback || [])); } catch (e) { /* ignore */ }
        renderResumeAnalysis(a);
        setStatus('Done. Your breakdown is below.', 'ok');
      }
      fileInput.value = '';
    };
    if (isPdf) reader.readAsDataURL(file); else reader.readAsText(file);
  });
})();

// ---------------------------------------------------------------------------
// AI orchestration
// ---------------------------------------------------------------------------

let currentProfile = null;
let currentScores = null;
let aiContent = null;

const DEMO_PROFILE = {
  firstName: 'Alex', year: 'Junior', major: 'Business Administration',
  school: 'State University', gpa: '3.45', timeLeft: '3 semesters',
  activities: 'Marketing Club\nCase Competition Team',
  experience: 'Marketing intern, Acme Co. (Summer 2024)',
  goal: 'Product Manager', skills: 'Excel\nPublic speaking\nSQL basics',
};

const aiAvailable = () => typeof FigAI !== 'undefined';

function setAiPill(state, detail) {
  const btn = document.getElementById('aiStatusBtn');
  const dot = document.getElementById('aiDot');
  if (!btn) return;
  btn.dataset.state = state;
  const labels = {
    off: 'Connect AI',
    idle: 'AI connected',
    loading: 'AI: thinking…',
    live: 'AI insights live',
    error: 'AI error — retry',
  };
  btn.textContent = labels[state] || labels.off;
  if (detail) btn.title = detail; else btn.removeAttribute('title');
  if (dot) dot.dataset.state = state;
}

async function maybeRunAI(profile, force = false) {
  if (!aiAvailable() || !FigAI.hasKey()) { setAiPill('off'); return; }
  const h = hashProfile(profile);
  const cached = readJSON('figuredAiContent');
  if (!force && cached && cached.hash === h && cached.data) {
    aiContent = cached.data;
    applyContent(cached.data);
    setAiPill('live');
    return;
  }

  setAiPill('loading');
  // The instant rule-based draft is already on screen. Mark it as "personalizing"
  // so the upgrade reads as the analysis getting sharper, not a glitchy reload.
  hideRefiningError();
  showRefiningCue();
  try {
    const data = await FigAI.generateInsights(profile);
    aiContent = data;
    localStorage.setItem('figuredAiContent', JSON.stringify({ hash: h, data }));
    applyContent(data, { refined: true });
    setAiPill('live');
    hideRefiningCue();
  } catch (e) {
    console.error('4ward AI:', e);
    // AI failed. Keep the rule-based draft on screen but tell the user clearly
    // and give them a retry button so they're never stuck wondering what
    // happened. Silent fallbacks were leaving people confused.
    if (currentProfile && currentScores) applyContent(fallbackContent(currentProfile, currentScores));
    setAiPill('error', e.message);
    hideRefiningCue();
    showRefiningError(e && (e.message || e.toString()));
  }
}

// ---------------------------------------------------------------------------
// Connect Claude modal
// ---------------------------------------------------------------------------

function initKeyModal() {
  const modal = document.getElementById('keyModal');
  if (!modal) return;
  const input = document.getElementById('keyInput');
  const save = document.getElementById('keySave');
  const cancel = document.getElementById('keyCancel');
  const regen = document.getElementById('keyRegenerate');
  const disconnect = document.getElementById('keyDisconnect');

  const open = () => {
    const connected = aiAvailable() && FigAI.hasKey();
    input.value = '';
    input.placeholder = connected ? 'Connected — paste a new key to replace' : 'sk-ant-…';
    regen.hidden = !connected;
    disconnect.hidden = !connected;
    modal.hidden = false;
    input.focus();
  };
  const close = () => { modal.hidden = true; };

  document.getElementById('aiStatusBtn')?.addEventListener('click', open);
  cancel.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  save.addEventListener('click', () => {
    const val = input.value.trim();
    if (val) {
      FigAI.setKey(val);
      close();
      maybeRunAI(currentProfile, true);
    } else if (aiAvailable() && FigAI.hasKey()) {
      close();
    } else {
      input.focus();
    }
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') save.click(); });

  regen.addEventListener('click', () => { close(); maybeRunAI(currentProfile, true); });
  disconnect.addEventListener('click', () => {
    FigAI.setKey('');
    localStorage.removeItem('figuredAiContent');
    aiContent = null;
    close();
    setAiPill('off');
    if (currentProfile && currentScores) applyContent(fallbackContent(currentProfile, currentScores));
  });

  window.openKeyModal = open;
}

// ---------------------------------------------------------------------------
// Ask 4ward chat
// ---------------------------------------------------------------------------

const chatHistory = [];
let chatBusy = false;
let chatOpened = false;

function chatSystemPrompt() {
  const p = currentProfile || DEMO_PROFILE;
  const name = p.firstName || 'this student';
  let insightNote = '';
  if (aiContent) {
    insightNote = `\n\nTheir current 4ward insights:\nHeadline: ${aiContent.headline}\nRead: ${aiContent.body}\nTop actions: ${(aiContent.actions || []).join('; ')}`;
  }
  return `You are 4ward's career advisor: the most connected, best-informed person ${name} could sit across from. You combine a top university career-center director, a seasoned recruiter across sports, entertainment, finance, and tech, an executive coach, and a well-networked alumni mentor. You are talking with ${name}, a ${p.year || 'college'} ${p.major || ''} student${p.school ? ' at ' + p.school : ''} aiming for ${p.goal || 'their goal'}.

Their full profile:
${JSON.stringify(p, null, 2)}${insightNote}

HOW YOU THINK (you did the research before they asked):
- You know what the real pipeline into their goal looks like: which programs and organizations develop talent, the actual sequence of roles, the unwritten rules, what separates a good candidate from a great one.
- You know the kinds of players that matter: which teams, firms, agencies, or organizations build people in this space, and what they look for.
- You think in sequence: internship to full-time to pivot. Give ambitious, realistic, ordered roadmaps.
- You proactively name what most students on this path get wrong, even when they did not ask.

HOW YOU ANSWER:
- Specific, never generic. Never say "network more" without naming who to reach out to, where to find them, and what to say. Never say "get experience" without naming real types of programs, organizations, or roles.
- Direct and honest. If something is competitive, say so. If their path has gaps, name them. Respect them enough to tell the truth.
- Match their ambition. Map the real path. Do not water it down.
- Adaptive length: for a quick question, answer in one tight paragraph, about 60 to 100 words. For "how do I get into X" or a roadmap, go longer and lay out the ordered steps. Let the question set the length. Depth over filler.

HONESTY GUARDRAIL (you have no live internet access):
- Name real, durable organizations, programs, and role types you are confident exist. Those are safe.
- Do NOT state application deadlines, dates, or who is "hiring right now" as fact. You cannot see live postings. Point them to the source instead, for example "check that team's careers page for current timing," and tell them to verify time-sensitive details.
- Never invent a program, person, or deadline. If you are unsure whether something still exists or is current, say "look into" rather than stating it as fact.
- Subjective calls, like which shop has the best culture or insider feel, are your read, not fact. Frame them as what people in the space say.

VOICE AND FORMAT:
- Honest without being brutal. A mentor, not a machine. Always specific to ${name}'s real profile.
- Never suggest a less ambitious path. Every gap is framed as "here is what it takes," never as a verdict.
- You may use **bold** for key names, programs, or moves, and short bullet lists, with each item on its own line starting with "- ", for ordered steps. No headings.
- NEVER use em dashes or dashes as punctuation. Use periods, commas, semicolons, or two short sentences. Em dashes read as AI and break the human voice.
- Stay on ${name}'s path: goal, gaps, plan, skills, networking, opportunities, applications, decisions. If asked about anything off-path (homework, trivia, unrelated topics), redirect to their path in one sentence.
- End on a concrete next move: one specific thing they can do in the next 48 hours, like a name to search on LinkedIn, a page to check, or an email to draft. Vary how you close.

PROFILE-UPDATE SIGNAL:
If, during the conversation, ${name} reveals a clear, concrete shift to a profile field (goal, major, year, school, skills, activities, experience), include exactly one line at the very end of your reply, after your normal ending, formatted exactly as:
[[update field=<fieldname> value="<new value>" why="<short reason>"]]
Only emit this when the shift is a real profile-level realization (e.g., "I actually want to do scouting, not coaching"), not a passing thought or a hypothetical. If you are unsure, do not emit. The line is hidden from ${name}, they will see a confirmation card asking whether to update. Never reference the marker in your prose.`;
}

function addBubble(role, text, typing = false) {
  const wrap = document.getElementById('chatMessages');
  const el = document.createElement('div');
  el.className = `chat-bubble ${role}`;
  if (typing) {
    el.innerHTML = '<span class="typing-dots"><i></i><i></i><i></i></span>';
  } else {
    el.textContent = text;
  }
  wrap.appendChild(el);
  wrap.scrollTop = wrap.scrollHeight;
  return el;
}

// Minimal, safe markdown for chat bubbles. Escapes HTML first, then renders only
// a tiny subset: bold, line breaks, and "- " bullet lists. No raw HTML ever
// reaches the DOM. Applied only to the final reply, after the marker is stripped.
function renderChatMarkdown(text) {
  const inline = (s) => s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  const blocks = [];
  let para = [];
  let list = [];
  const flushPara = () => { if (para.length) { blocks.push('<div class="cb-p">' + para.join('<br>') + '</div>'); para = []; } };
  const flushList = () => { if (list.length) { blocks.push('<ul class="cb-ul">' + list.join('') + '</ul>'); list = []; } };
  esc(text).split('\n').forEach((raw) => {
    const bullet = raw.match(/^\s*[-•]\s+(.+)$/);
    if (bullet) { flushPara(); list.push('<li>' + inline(bullet[1]) + '</li>'); }
    else if (raw.trim() === '') { flushPara(); flushList(); }
    else { flushList(); para.push(inline(raw)); }
  });
  flushPara();
  flushList();
  return blocks.join('');
}

// Hidden marker the chat uses to propose a profile change. See chatSystemPrompt.
const UPDATE_MARKER_RE = /\[\[update\s+field=([A-Za-z]+)\s+value="([^"]*)"\s+why="([^"]*)"\]\]/;

function parseUpdateMarker(text) {
  if (!text) return null;
  const m = text.match(UPDATE_MARKER_RE);
  if (!m) return null;
  return { field: m[1], value: m[2], why: m[3] };
}

function stripUpdateMarker(text) {
  if (!text) return text;
  return text.replace(UPDATE_MARKER_RE, '').replace(/\s+$/, '');
}

const UPDATE_FIELD_LABEL = {
  goal: 'Goal', major: 'Major', school: 'School', year: 'Year',
  skills: 'Skills', activities: 'Activities', experience: 'Experience',
};

function renderUpdateCard({ field, value, why }) {
  const wrap = document.getElementById('chatMessages');
  const card = document.createElement('div');
  card.className = 'chat-update-card';
  const label = UPDATE_FIELD_LABEL[field] || field;
  card.innerHTML = `
    <div class="cuc-head">Update your trajectory?</div>
    <div class="cuc-change"><span class="cuc-field">${esc(label)}</span> → <strong>${esc(value)}</strong></div>
    ${why ? `<div class="cuc-why">${esc(why)}</div>` : ''}
    <div class="cuc-actions">
      <button class="primary-button cuc-yes" type="button">Update my trajectory</button>
      <button class="ghost-button cuc-no" type="button">Keep thinking</button>
    </div>
  `;
  wrap.appendChild(card);
  wrap.scrollTop = wrap.scrollHeight;

  card.querySelector('.cuc-yes').addEventListener('click', () => {
    applyProfileUpdate(field, value);
    card.classList.add('cuc-done-state');
    card.innerHTML = `<div class="cuc-done">Got it. Your trajectory just shifted. Close this to see it.</div>`;
  });
  card.querySelector('.cuc-no').addEventListener('click', () => {
    card.remove();
  });
}

function applyProfileUpdate(field, value) {
  const p = currentProfile || loadProfile() || {};
  p[field] = value;
  currentProfile = p;
  localStorage.setItem('figuredProfile', JSON.stringify(p));
  applyProfile(p);
}

function renderChips() {
  const wrap = document.getElementById('chatChips');
  if (!wrap || !currentScores) return;
  const p = currentProfile || DEMO_PROFILE;
  const goal = trimGoal(p.goal, 40);
  const lowest = [
    { label: 'experience', v: currentScores.experience },
    { label: 'network', v: currentScores.network },
    { label: 'visible proof', v: currentScores.portfolio },
  ].sort((a, b) => a.v - b.v)[0].label;

  const chips = [
    `Why is ${lowest} my biggest gap?`,
    'What should I do this month?',
    `What would it actually take to get into ${goal}?`,
    'Who should I be talking to right now?',
  ];
  wrap.innerHTML = chips.map((c) => `<button type="button" class="chat-chip">${esc(c)}</button>`).join('');
  wrap.querySelectorAll('.chat-chip').forEach((btn) => {
    btn.addEventListener('click', () => sendChat(btn.textContent));
  });
}

async function sendChat(text) {
  const msg = (text || '').trim();
  if (!msg || chatBusy) return;
  if (!aiAvailable() || !FigAI.hasKey()) { window.openKeyModal?.(); return; }

  document.getElementById('chatChips').innerHTML = '';
  addBubble('user', msg);
  chatHistory.push({ role: 'user', content: msg });

  const el = addBubble('assistant', '', true);
  chatBusy = true;
  const sendBtn = document.getElementById('chatSend');
  const input = document.getElementById('chatInput');
  sendBtn.disabled = true;

  try {
    const full = await FigAI.chatStream(
      chatSystemPrompt(),
      chatHistory.slice(-16),
      (t) => {
        el.textContent = stripUpdateMarker(t);
        const wrap = document.getElementById('chatMessages');
        wrap.scrollTop = wrap.scrollHeight;
      }
    );
    const cleaned = stripUpdateMarker(full);
    el.innerHTML = renderChatMarkdown(cleaned);
    chatHistory.push({ role: 'assistant', content: cleaned });
    const proposed = parseUpdateMarker(full);
    if (proposed) renderUpdateCard(proposed);
  } catch (e) {
    chatHistory.pop();
    el.textContent = 'Hmm, ' + e.message;
    el.classList.add('chat-error');
  } finally {
    chatBusy = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

function initChat() {
  const panel = document.getElementById('chatPanel');
  if (!panel) return;
  const overlay = document.getElementById('chatOverlay');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');

  const open = () => {
    panel.classList.add('open');
    overlay.classList.add('show');
    if (!chatOpened) {
      chatOpened = true;
      const p = currentProfile || DEMO_PROFILE;
      const name = p.firstName || 'there';
      const connected = aiAvailable() && FigAI.hasKey();
      addBubble('assistant', connected
        ? `Hey ${name} — I've got your full profile in front of me. Ask me anything about your path.`
        : `Hey ${name} — connect Claude (top right) and I can answer questions about your specific path, gaps, and next moves.`);
      renderChips();
    }
    input.focus();
  };
  const close = () => {
    panel.classList.remove('open');
    overlay.classList.remove('show');
  };

  document.getElementById('ask4wardBtn')?.addEventListener('click', open);
  document.getElementById('ask4wardTop')?.addEventListener('click', open);
  document.getElementById('chatClose')?.addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input.value;
    input.value = '';
    sendChat(val);
  });
}

// ---------------------------------------------------------------------------
// Profile application + boot
// ---------------------------------------------------------------------------

function applyProfile(p) {
  const s = computeScores(p);
  currentScores = s;
  const name = p.firstName ? capitalizeName(p.firstName) : 'you';

  const hour = new Date().getHours();
  const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  setText('.product-topbar h1', `Good ${period}, ${name}.`);
  setText('.profile-pocket strong', name);
  // Keep the browser tab title in sync with the real student, not the demo name.
  document.title = (p.firstName && name !== 'you') ? `4ward | ${name}` : '4ward';
  setText('.student-avatar', profileInitials(name));
  if (p.schoolStage === 'highSchool') {
    setText('.profile-meta', [p.year, p.major ? `Exploring: ${p.major}` : 'Exploring majors'].filter(Boolean).join(' · '));
    setText('.profile-pocket span', `Direction: ${p.goal || 'Not set'}`);
  } else {
    setText('.profile-meta', [p.major, p.year].filter(Boolean).join(' · '));
    setText('.profile-pocket span', `Goal: ${p.goal || 'Not set'}`);
  }

  const schoolEl = document.querySelector('.profile-school');
  if (schoolEl) {
    schoolEl.textContent = p.school || '';
    schoolEl.style.display = p.school ? '' : 'none';
  }

  applyContent(fallbackContent(p, s));
  renderComp(p);

  // Distil the free-text goal into a clean keyword the job boards can search.
  const term = searchTerm(p.goal);
  const domain = detectDomain(p);
  // Per-domain real entry-level title (e.g., "Editorial Assistant" for publishing).
  // Falls back to the cleaned goal when no override exists.
  const entryTitle = ENTRY_TITLE[domain] || '';
  const setHref = (id, url) => { const el = document.getElementById(id); if (el) el.href = url; };

  // Title the cards by the clean FIELD, not the raw goal. This keeps them broad
  // and useful (per student feedback) and avoids echoing a messy goal verbatim,
  // which read like spelling errors (e.g. "Animation Maybe Internships").
  const FIELD_LABEL = {
    sports: 'Sports', product: 'Product', finance: 'Finance', economics: 'Economics',
    psychology: 'Psychology', software: 'Software', marketing: 'Marketing', consulting: 'Consulting',
    creative: 'Creative', design: 'Design', founder: 'Startup', medicine: 'Healthcare',
    law: 'Legal', publishing: 'Publishing', journalism: 'Journalism', academia: 'Research',
    nonprofit: 'Nonprofit', government: 'Government',
  };
  const titleCase = (s) => (s || '').replace(/\b\w/g, (c) => c.toUpperCase());
  const field = FIELD_LABEL[domain] || titleCase(term) || 'Your field';
  // Broad, clean search keywords (avoid jamming a messy goal into the query).
  const internKw = entryTitle || `${field} intern`;
  const entryKw  = entryTitle || field;

  // Card titles + subtitles follow the clean field, broad and readable.
  setText('#oppTitle1', `${field} internships`);
  setText('#oppTitle2', `Entry-level ${field} roles`);
  setText('#oppTitle3', `${field} fellowships & programs`);
  setText('#oppTitle4', `${field} mentors & alumni`);

  // Internship — LinkedIn f_E=1 filter strips out full-time roles that share
  // the keyword (e.g., senior Assistant Editor jobs polluting "Publishing Intern").
  setHref('oppLink1', linkedinJobsURL(internKw, 1));
  setHref('oppLink1b', indeedURL(`${field} Intern`));
  setHref('oppLink1c', googleJobsURL(`${field} intern`));
  setHref('oppLink1d', handshakeURL(`${field} intern`, p));
  // Entry-level — f_E=2 limits to entry-level postings; use the real role
  // title when we know it so we get actual entry roles, not adjacent ones.
  setHref('oppLink2', linkedinJobsURL(entryKw, 2));
  setHref('oppLink2b', indeedURL(`Entry level ${entryKw}`));
  setHref('oppLink2c', googleJobsURL(`entry level ${entryKw}`));
  setHref('oppLink2d', handshakeURL(entryKw, p));
  // Fellowship / programs
  setHref('oppLink3', linkedinJobsURL(`${field} Fellowship`));
  setHref('oppLink3b', indeedURL(`${field} Fellowship student`));
  setHref('oppLink3c', googleJobsURL(`${field} fellowship program`));
  setHref('oppLink3d', handshakeURL(`${field} fellowship`, p));
  // Networking — Google surfaces real people better than logged-out LI search
  setHref('oppLink4', googleLinkedinURL(`${field} professional`));
  setHref('oppHandshake4', handshakeURL(field, p));

  // Connections tab
  setHref('connLinkedinLink', googleLinkedinURL(term));
  renderMentors(term);
  renderPeers();
  renderNetwork(term, p);
  renderExploreTree(p);

  maybeRunAI(p);
}

// Connections tab switching
const connTabs = document.querySelectorAll('.conn-tab');
const connPanels = document.querySelectorAll('.conn-panel');
// The "Who to meet" tab is a pure reference (no outbound links), so we hide the
// "Find more on LinkedIn" header button there and show it for Mentors/Peers.
function syncConnHeaderLink(activeTab) {
  const link = document.getElementById('connLinkedinLink');
  // Only the Mentors tab uses the LinkedIn search; hide it on the others.
  if (link) link.style.display = (activeTab === 'mentors') ? '' : 'none';
}
connTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    connTabs.forEach(t => t.classList.remove('active'));
    connPanels.forEach(panel => panel.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('conn-' + tab.dataset.conn)?.classList.add('active');
    syncConnHeaderLink(tab.dataset.conn);
  });
});
// "Who to meet" is the default tab, so hide the header link on load.
syncConnHeaderLink(document.querySelector('.conn-tab.active')?.dataset.conn);

function initWinModal() {
  const modal = document.getElementById('winModal');
  if (!modal) return;
  const input = document.getElementById('winInput');
  const open = () => { input.value = ''; modal.hidden = false; setTimeout(() => input.focus(), 20); };
  const close = () => { modal.hidden = true; };

  // Delegated so it works for every "Log a win" button, including re-rendered ones
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-log-win]')) open();
  });
  document.getElementById('winCancel').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  document.getElementById('winSave').addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    const wins = loadWins();
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    wins.unshift({ date, text });
    saveWins(wins);
    close();
    renderTimeline(null);
    // Take them to the Timeline so they see it land
    const tab = document.querySelector('[data-product-section="timeline"]');
    if (tab) { tab.click(); tab.scrollIntoView({ inline: 'center', block: 'nearest' }); }
    const first = document.querySelector('#growthTimeline .tl-win');
    if (first) first.classList.add('just-added');
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) document.getElementById('winSave').click();
  });
}

if (document.querySelector('.product-main')) {
  const dateEl = document.getElementById('topbarDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  initKeyModal();
  initChat();
  initWinModal();
  initTracksRefresh();
  initGapsRefresh();
  renderTimeline(null);

  const profile = loadProfile();
  currentProfile = profile || DEMO_PROFILE;
  if (profile) {
    applyProfile(profile);
  } else {
    currentScores = computeScores(DEMO_PROFILE);
    renderNetwork(DEMO_PROFILE.goal, DEMO_PROFILE);
    renderComp(DEMO_PROFILE);
    renderPeers();
    renderExploreTree(DEMO_PROFILE);
    const nudge = document.getElementById('onboardingNudge');
    if (nudge) nudge.style.display = 'flex';
    setAiPill(aiAvailable() && FigAI.hasKey() ? 'idle' : 'off');
  }
}

// --- Landing-page scroll reveals -------------------------------------------
// One calm motion language for the whole marketing page: elements fade up and
// settle as they enter the viewport, with a slight stagger inside grids. We
// reveal once (no re-animating on scroll-up) and fully respect reduced motion.
// Guarded to the landing page (only it has the #how section) so the app and
// onboarding are untouched.
(function initScrollReveals() {
  if (!document.getElementById('how')) return;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // On phones the sections collapse into accordions, so scroll-fade would fight
  // the expand animation (and could leave collapsed content stuck invisible).
  // Reveal everything up front there; keep the fade-up as a desktop delight.
  const isMobile = window.matchMedia && window.matchMedia('(max-width: 760px)').matches;
  const instant = reduceMotion || isMobile || !('IntersectionObserver' in window);

  // Groups that should stagger their direct children, plus standalone blocks.
  const groupSelectors = ['.steps-grid', '.gap-grid', '.mentor-grid', '.opportunity-grid', '.trajectory-cards', '.dashboard-grid'];
  const soloSelectors = ['.section-heading', '.roadmap-panel', '.plan-panel', '.cta-band'];

  const targets = [];
  soloSelectors.forEach((sel) => document.querySelectorAll(sel).forEach((el) => { el.classList.add('reveal'); targets.push(el); }));
  groupSelectors.forEach((sel) => document.querySelectorAll(sel).forEach((grid) => {
    [...grid.children].forEach((child, i) => {
      child.classList.add('reveal');
      child.style.setProperty('--reveal-delay', (i % 6) * 70 + 'ms');
      targets.push(child);
    });
  }));

  if (instant) {
    targets.forEach((el) => el.classList.add('in'));
    const rm = document.querySelector('.roadmap');
    if (rm) rm.classList.add('lit');
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

  targets.forEach((el) => io.observe(el));

  // Signature moment: the trajectory roadmap draws its line and lights up its
  // stages in sequence once it scrolls into view.
  const roadmap = document.querySelector('.roadmap');
  if (roadmap) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      roadmap.classList.add('lit');
    } else {
      const rio = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('lit');
          rio.unobserve(entry.target);
        });
      }, { threshold: 0.45 });
      rio.observe(roadmap);
    }
  }
})();

// --- Mobile section accordions ---------------------------------------------
// The marketing page is a long scroll on a phone. Below the hero, each section
// collapses behind a tappable heading (first one open, the rest closed) so the
// page reads as a tidy list you can expand. Desktop is untouched: the collapse
// styling is mobile-only, so even after we restructure the DOM it renders as a
// normal full-length page on wider screens.
(function initMobileSections() {
  if (!document.getElementById('how')) return; // landing page only
  const mq = window.matchMedia('(max-width: 760px)');
  const ids = ['how', 'trajectory', 'gaps', 'actions', 'opportunities', 'mentors', 'dashboard'];
  let built = false;

  function build() {
    if (built) return;
    built = true;

    ids.forEach((id, idx) => {
      const section = document.getElementById(id);
      if (!section) return;
      section.classList.add('collapsible');

      let header = section.querySelector(':scope > .section-heading');
      if (!header) {
        // The dashboard preview has no heading of its own; give it one to tap.
        header = document.createElement('div');
        header.className = 'section-heading synthetic';
        header.innerHTML = '<p class="eyebrow">Preview</p><h2>See the dashboard</h2>';
        section.insertBefore(header, section.firstChild);
      }

      // Wrap everything except the header so we can animate its height.
      const body = document.createElement('div');
      body.className = 'section-body';
      const inner = document.createElement('div');
      inner.className = 'section-body-inner';
      [...section.children].forEach((child) => { if (child !== header) inner.appendChild(child); });
      body.appendChild(inner);
      section.appendChild(body);

      const open = idx === 0;
      section.classList.toggle('open', open);
      header.setAttribute('role', 'button');
      header.setAttribute('tabindex', '0');
      header.setAttribute('aria-expanded', open ? 'true' : 'false');

      const toggle = () => {
        const nowOpen = !section.classList.contains('open');
        section.classList.toggle('open', nowOpen);
        header.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
      };
      header.addEventListener('click', toggle);
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  }

  if (mq.matches) build();
  // Build lazily if the viewport later crosses into mobile (e.g. rotation).
  // We never tear down: the collapse CSS only applies on mobile, so the wrapped
  // structure is harmless at desktop widths.
  if (mq.addEventListener) mq.addEventListener('change', (e) => { if (e.matches) build(); });
})();

// --- Header hamburger menu -------------------------------------------------
// Replaces the flat nav: a three-line button drops a compact panel of links.
// Closes on link click, outside click, or Escape. When a link points at a
// collapsible section (mobile accordions), we open that section so the user
// lands on real content, not just a collapsed header.
(function initNavMenu() {
  const toggle = document.getElementById('navToggle');
  const panel = document.getElementById('navPanel');
  if (!toggle || !panel) return;

  const setOpen = (open) => {
    panel.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!panel.classList.contains('open'));
  });

  panel.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) {
        const sec = document.getElementById(href.slice(1));
        if (sec && sec.classList.contains('collapsible') && !sec.classList.contains('open')) {
          sec.classList.add('open');
          const h = sec.querySelector(':scope > .section-heading');
          if (h) h.setAttribute('aria-expanded', 'true');
        }
      }
      setOpen(false);
    });
  });

  document.addEventListener('click', (e) => {
    if (!panel.classList.contains('open')) return;
    if (panel.contains(e.target) || toggle.contains(e.target)) return;
    setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
})();
