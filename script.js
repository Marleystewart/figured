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
  sports:     { entry: '$35k–$55k',        note: 'Entry front-office and ops roles pay notoriously low. The path up is through relationships and results. Pay jumps sharply at the director level and above.' },
  product:    { entry: '$95k–$125k',       note: 'APM programs at top companies pay $110–130k. Most PMs enter through adjacent roles like ops, engineering, or data first.' },
  finance:    { entry: '$65k–$160k',       note: 'Investment banking analysts start ~$110k base + bonus. Corporate finance and financial planning roles run $65–85k to start.' },
  software:   { entry: '$110k–$135k',      note: 'Median new-grad SWE total comp at large tech companies. Big Tech starts at $150k+; startups vary widely but often include equity.' },
  marketing:  { entry: '$55k–$75k',        note: 'Marketing coordinators start $50–60k. Brand and growth roles at tech companies run higher. Agency pay is lower to start but builds fast.' },
  consulting: { entry: '$90k–$112k',       note: 'MBB (McKinsey, BCG, Bain) starts ~$112k base for undergrad. Big 4 management consulting runs $75–95k.' },
  design:     { entry: '$70k–$95k',        note: 'Junior UX/product designers at tech companies. Agency and startup roles vary. Senior and staff designers reach $130–180k+.' },
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

function renderComp(p) {
  const c = COMP[detectDomain(p)] || COMP.generic;
  const entryEl = document.getElementById('compEntry');
  const noteEl  = document.getElementById('compNote');
  if (entryEl) entryEl.textContent = c.entry;
  if (noteEl)  noteEl.textContent  = c.note;
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
  if (/(software|engineer|develop|coding|programmer|computer science)/.test(g)) return 'software';
  if (/(market|brand|advertis)/.test(g)) return 'marketing';
  if (/consult/.test(g)) return 'consulting';
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
    });
  });
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
  const map = { d30: 'plan30', d60: 'plan60', d90: 'plan90' };
  Object.entries(map).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (!el || !plan[key]) return;
    el.innerHTML = plan[key].map((item) => `
      <div class="plan-mini">
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

function renderTimeline(timeline) {
  const el = document.getElementById('growthTimeline');
  if (!el) return;
  if (timeline) activeTimeline = timeline;
  const wins = loadWins();
  if (!wins.length && !activeTimeline.length) return; // keep static fallback
  let html = '';
  if (wins.length) {
    html += wins.map((w) => `
      <p class="timeline-win"><strong>${esc(w.date)}</strong> ${esc(w.text)}</p>`).join('');
  }
  if (activeTimeline.length) {
    html += activeTimeline.map((t) => `
      <p><strong>${esc(t.when)}</strong> ${esc(t.text)}</p>`).join('');
  }
  el.innerHTML = html || '<p><strong>Right now</strong> Your path starts here. Log your first win to begin the record.</p>';
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
function showRefiningCue() {
  const snap = document.querySelector('.snapshot-wide');
  if (!snap || snap.querySelector('.refining-cue')) return;
  const cue = document.createElement('div');
  cue.className = 'refining-cue';
  cue.innerHTML = '<span class="refining-dot"></span> Personalizing your trajectory…';
  snap.appendChild(cue);
}

function hideRefiningCue() {
  document.querySelectorAll('.refining-cue').forEach((el) => el.remove());
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

function searchTerm(goal) {
  if (!goal) return 'Internships';
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
function handshakeURL(keyword) {
  if (keyword) return 'https://app.joinhandshake.com/search?query=' + encodeURIComponent(keyword) + '&category=JOB';
  return 'https://app.joinhandshake.com/';
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

// Field-aware archetypes shown when no real mentor has opted in yet.
function mentorArchetypes(term) {
  return [
    {
      name: `Someone working in ${term}`,
      sub: 'A few years ahead of you',
      why: `The fastest way to learn what the ${term} path actually looks like day to day.`,
      search: term,
    },
    {
      name: `A senior leader in ${term}`,
      sub: 'On the hiring side',
      why: `People who hire and lead in ${term} can tell you what actually moves the needle.`,
      search: `senior ${term}`,
    },
    {
      name: `A recent grad now in ${term}`,
      sub: '1–3 years out of school',
      why: 'Closest to where you are now — they remember exactly how they broke in.',
      search: `${term} recent graduate`,
    },
  ];
}

function initialsFor(m) {
  if (m.initials) return m.initials;
  const words = (m.name || '?').replace(/[^a-zA-Z ]/g, '').trim().split(/\s+/);
  return ((words[0]?.[0] || '') + (words[1]?.[0] || '')).toUpperCase() || '★';
}

function renderMentors(term) {
  const grid = document.getElementById('mentorGrid');
  if (!grid) return;
  const mentors = loadOptedInMentors().concat(mentorArchetypes(term));
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
  showRefiningCue();
  try {
    const data = await FigAI.generateInsights(profile);
    aiContent = data;
    localStorage.setItem('figuredAiContent', JSON.stringify({ hash: h, data }));
    applyContent(data, { refined: true });
    setAiPill('live');
  } catch (e) {
    console.error('4ward AI:', e);
    // AI failed — restore the honest rule-based version so nothing stays blank.
    if (currentProfile && currentScores) applyContent(fallbackContent(currentProfile, currentScores));
    setAiPill('error', e.message);
  } finally {
    hideRefiningCue();
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
  return `You are 4ward — a personal career trajectory mentor inside the 4ward app, talking with ${name}, a ${p.year || 'college'} ${p.major || ''} student${p.school ? ' at ' + p.school : ''}.

Their full profile:
${JSON.stringify(p, null, 2)}${insightNote}

Guardrails:
- Stay on ${name}'s path: their goal, gaps, plan, skills, networking, opportunities, applications, decisions. If asked about anything else (homework, trivia, other topics), redirect to their path in one sentence.
- Voice: honest without being brutal. Mentor, not machine. Specific to ${name}'s real profile. Never generic.
- Never suggest a less ambitious path. Every gap is framed as "here's what it takes", never as a verdict.
- Length: 60 to 100 words. One paragraph by default. Two short paragraphs only if you genuinely shift from diagnosis to action. Depth beats volume: cut every word that doesn't carry weight.
- NEVER use em dashes or dashes as punctuation. Use periods, commas, semicolons, or just two short sentences. Em dashes read as AI and break the human voice.
- Plain text only. No markdown, no headings, no asterisks, no bullet points.
- End on action. Vary how you close: sometimes a concrete next move, sometimes a sharp question, sometimes one honest sentence of belief. Never the same shape twice in a row.

Profile-update signal:
If, during the conversation, ${name} reveals a clear, concrete shift to a profile field (goal, major, year, school, skills, activities, experience), include exactly one line at the very end of your reply, after your normal ending, formatted exactly as:
[[update field=<fieldname> value="<new value>" why="<short reason>"]]
Only emit this when the shift is a real profile-level realization (e.g., "I actually want to do scouting, not coaching"), not a passing thought or a hypothetical. If you're unsure, do not emit. The line is hidden from ${name} — they'll see a confirmation card asking whether to update. Never reference the marker in your prose.`;
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
    el.textContent = cleaned;
    chatHistory.push({ role: 'assistant', content: cleaned });
    const proposed = parseUpdateMarker(full);
    if (proposed) renderUpdateCard(proposed);
  } catch (e) {
    chatHistory.pop();
    el.textContent = 'Hmm — ' + e.message;
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
  setText('.student-avatar', profileInitials(name));
  setText('.profile-meta', [p.major, p.year].filter(Boolean).join(' · '));
  setText('.profile-pocket span', `Goal: ${p.goal || '—'}`);

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
  const internKw = entryTitle ? entryTitle : `${term} Intern`;
  const entryKw  = entryTitle || term;
  const setHref = (id, url) => { const el = document.getElementById(id); if (el) el.href = url; };

  // Card titles + subtitles follow the real goal, not "Product Intern".
  setText('#oppTitle1', `${term} Internships`);
  setText('#oppTitle2', entryTitle ? `Entry-level: ${entryTitle}` : `Entry-level ${term}`);
  setText('#oppTitle3', `${term} Fellowships & Programs`);
  setText('#oppTitle4', `${term} mentors & alumni`);

  // Internship — LinkedIn f_E=1 filter strips out full-time roles that share
  // the keyword (e.g., senior Assistant Editor jobs polluting "Publishing Intern").
  setHref('oppLink1', linkedinJobsURL(internKw, 1));
  setHref('oppLink1b', indeedURL(`${term} Intern`));
  setHref('oppLink1c', googleJobsURL(`${term} intern`));
  // Entry-level — f_E=2 limits to entry-level postings; use the real role
  // title when we know it so we get actual entry roles, not adjacent ones.
  setHref('oppLink2', linkedinJobsURL(entryKw, 2));
  setHref('oppLink2b', indeedURL(`Entry level ${entryKw}`));
  setHref('oppLink2c', googleJobsURL(`entry level ${entryKw}`));
  // Fellowship / programs
  setHref('oppLink3', linkedinJobsURL(`${term} Fellowship`));
  setHref('oppLink3b', indeedURL(`${term} Fellowship student`));
  setHref('oppLink3c', googleJobsURL(`${term} fellowship program`));
  // Networking — Google surfaces real people better than logged-out LI search
  setHref('oppLink4', googleLinkedinURL(`${term} professional`));
  setHref('oppHandshake4', handshakeURL(term));

  // Connections tab
  setHref('connLinkedinLink', googleLinkedinURL(term));
  setHref('peerLinkedinLink', googleLinkedinURL(`${term} student`));
  setHref('peerHandshakeLink', handshakeURL(term));
  renderMentors(term);

  maybeRunAI(p);
}

// Connections tab switching
const connTabs = document.querySelectorAll('.conn-tab');
const connPanels = document.querySelectorAll('.conn-panel');
connTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    connTabs.forEach(t => t.classList.remove('active'));
    connPanels.forEach(panel => panel.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('conn-' + tab.dataset.conn)?.classList.add('active');
  });
});

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
    const first = document.querySelector('#growthTimeline .timeline-win');
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
  renderTimeline(null);

  const profile = loadProfile();
  currentProfile = profile || DEMO_PROFILE;
  if (profile) {
    applyProfile(profile);
  } else {
    currentScores = computeScores(DEMO_PROFILE);
    const nudge = document.getElementById('onboardingNudge');
    if (nudge) nudge.style.display = 'flex';
    setAiPill(aiAvailable() && FigAI.hasKey() ? 'idle' : 'off');
  }
}
