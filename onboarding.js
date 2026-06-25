const steps = document.querySelectorAll('.ob-step');
const dots = document.querySelectorAll('.ob-dot');
const backBtn = document.getElementById('obBack');
const nextBtn = document.getElementById('obNext');
const stageIntro = document.getElementById('stageIntro');
const progress = document.querySelector('.ob-progress');
const actions = document.querySelector('.ob-actions');
let current = 1;
let schoolStage = 'college';
let didPrefillStage = false;
let stageChosen = false;

const HIGH_SCHOOL_SUBJECTS = [
  'Art and design',
  'Biology',
  'Business',
  'Chemistry',
  'Coding or computer science',
  'Communications',
  'Creative writing',
  'Data and statistics',
  'Engineering',
  'English',
  'Entrepreneurship',
  'Environmental science',
  'Finance',
  'Foreign languages',
  'Health and medicine',
  'History',
  'Law and government',
  'Marketing',
  'Math',
  'Music',
  'Psychology',
  'Science',
  'Social media or content',
  'Sports',
  'Technology',
  'Theater or performing arts',
];

const GPA_OPTIONS = {
  college: ['3.7-4.0', '3.3-3.69', '3.0-3.29', '2.5-2.99', 'Below 2.5'],
  highSchool: ['Mostly A grades', 'A/B grades', 'Mostly B grades', 'B/C grades', 'Mostly C grades', 'Not sure'],
};

const copyByStage = {
  college: {
    eyebrow1: 'Step 1 of 4',
    step1Title: "Let's start with you.",
    step1Desc: 'No fluff. Just enough to build your real profile.',
    firstNamePlaceholder: 'Alex',
    yearLabel: 'Year',
    yearOptions: ['Freshman', 'Sophomore', 'Junior', 'Senior'],
    majorLabel: 'Major',
    majorPlaceholder: 'Start typing, e.g. Business Administration',
    schoolLabel: 'School',
    schoolPlaceholder: 'Start typing, e.g. Harvard',
    heading2: 'Now, your record.',
    step2Desc: 'Honest inputs mean honest outputs. This stays between us.',
    gpaLabel: 'GPA',
    gpaPlaceholder: '3.45 or a range like 3.3-3.69',
    timeLeftLabel: 'Time left in school',
    timeLeftOptions: ['1 semester', '2 semesters', '3 semesters', '4+ semesters'],
    activitiesLabel: 'Activities & clubs',
    activitiesPlaceholder: 'Marketing Club\nCase Competition Team\nStudent Government',
    experienceLabel: 'Work & internship experience',
    experiencePlaceholder: 'Marketing intern, Acme Co. (Summer 2024)\nPart-time barista, 2023-present',
    goalHeading: 'Where you want to go.',
    goalDesc: 'Be specific. "Something in business" doesn\'t build a trajectory.',
    goalLabel: 'Career goal',
    goalPlaceholder: 'I want to work in NBA basketball operations, front office, scouting, analytics. I love how teams use data to find under-valued players and want to build that kind of edge.',
    goalHint: 'Be honest and specific. The more you tell us about what you actually want, the more honest the trajectory we can show you.',
    skillsLabel: 'Skills you already have',
    skillsPlaceholder: 'Excel\nPublic speaking\nProject management\nPython',
    buildText: 'Build my trajectory',
  },
  highSchool: {
    eyebrow1: 'Step 1 of 4',
    step1Title: 'First, where are you starting from?',
    step1Desc: 'This version helps you explore majors, college fit, and possible careers.',
    firstNamePlaceholder: 'Marley',
    yearLabel: 'Grade',
    yearOptions: ['9th grade', '10th grade', '11th grade', '12th grade'],
    majorLabel: 'Subjects or fields you like',
    majorPlaceholder: 'Sports, business, psychology, biology, design, computer science',
    schoolLabel: 'High school',
    schoolPlaceholder: 'Your high school',
    heading2: 'What seems to fit you?',
    step2Desc: 'Tell us what you like, what you do, and where you might want to explore.',
    gpaLabel: 'Grades right now',
    gpaPlaceholder: 'Choose a range, like A/B grades',
    timeLeftLabel: 'Time until graduation',
    timeLeftOptions: ['Less than 1 year', '1 year', '2 years', '3+ years'],
    activitiesLabel: 'Activities, sports, work, or responsibilities',
    activitiesPlaceholder: 'Basketball team\nPart-time job\nStudent council\nHelping at home\nVolunteering',
    experienceLabel: 'Jobs, projects, volunteering, or responsibilities',
    experiencePlaceholder: 'Babysitting\nVarsity basketball captain\nHelped run a school event\nBuilt a small online store',
    goalHeading: 'What future sounds interesting?',
    goalDesc: 'You do not need a final career. A rough direction is enough.',
    goalLabel: 'Possible major, career, or direction',
    goalPlaceholder: 'I like sports and business. I might want sports management, marketing, analytics, or something around teams.',
    goalHint: 'Say what sounds interesting, what kind of life you want, or what you want college to help you figure out.',
    skillsLabel: 'Strengths or things people say you are good at',
    skillsPlaceholder: 'Talking to people\nMath\nLeadership\nWriting\nDesign\nHelping teammates',
    buildText: 'Build my direction',
  },
};

function setTextById(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setPlaceholder(id, text) {
  const el = document.getElementById(id);
  if (el) el.placeholder = text;
}

function setOptions(selectId, options, selected = '', label = 'Select') {
  const el = document.getElementById(selectId);
  if (!el) return;
  el.innerHTML = `<option value="">${label}</option>` + options.map((option) => `<option>${option}</option>`).join('');
  if (selected) el.value = selected;
}

function fillList(id, source) {
  const list = document.getElementById(id);
  if (!list || !Array.isArray(source)) return;
  list.innerHTML = source.map((s) => `<option value="${String(s).replace(/"/g, '&quot;')}"></option>`).join('');
}

function isHighSchool() {
  return schoolStage === 'highSchool';
}

function applyStage(stage) {
  schoolStage = stage === 'highSchool' || stage === 'high-school' ? 'highSchool' : 'college';
  const c = copyByStage[schoolStage];
  document.querySelectorAll('.ob-stage-card').forEach((btn) => {
    const active = btn.dataset.stage === (isHighSchool() ? 'high-school' : 'college');
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });

  setTextById('eyebrow1', c.eyebrow1);
  setPlaceholder('firstName', c.firstNamePlaceholder);
  const step1 = document.querySelector('[data-step="1"]');
  if (step1) {
    const h2 = step1.querySelector('h2');
    const desc = step1.querySelector('.ob-desc');
    if (h2) h2.textContent = c.step1Title;
    if (desc) desc.textContent = c.step1Desc;
  }
  setTextById('yearLabelText', c.yearLabel);
  setTextById('majorLabelText', c.majorLabel);
  setPlaceholder('major', c.majorPlaceholder);
  setTextById('schoolLabelText', c.schoolLabel);
  setPlaceholder('school', c.schoolPlaceholder);
  setTextById('gpaLabelText', c.gpaLabel);
  setOptions('gpa', GPA_OPTIONS[schoolStage], document.getElementById('gpa')?.value || '', isHighSchool() ? 'Choose a range' : 'Select range');
  setTextById('heading2', c.heading2);
  const step2Desc = document.querySelector('[data-step="2"] .ob-desc');
  if (step2Desc) step2Desc.textContent = c.step2Desc;
  setTextById('timeLeftLabelText', c.timeLeftLabel);
  setTextById('activitiesLabelText', c.activitiesLabel);
  setPlaceholder('activities', c.activitiesPlaceholder);
  setTextById('experienceLabelText', c.experienceLabel);
  setPlaceholder('experience', c.experiencePlaceholder);
  setTextById('goalHeading', c.goalHeading);
  setTextById('goalDesc', c.goalDesc);
  setTextById('goalLabelText', c.goalLabel);
  setPlaceholder('goal', c.goalPlaceholder);
  setTextById('goalHint', c.goalHint);
  setTextById('skillsLabelText', c.skillsLabel);
  setPlaceholder('skills', c.skillsPlaceholder);
  setOptions('year', c.yearOptions, document.getElementById('year')?.value || '');
  setOptions('timeLeft', c.timeLeftOptions, document.getElementById('timeLeft')?.value || '');
  const major = document.getElementById('major');
  const school = document.getElementById('school');
  if (major) major.setAttribute('list', isHighSchool() ? 'subjectList' : 'majorList');
  if (school) {
    if (isHighSchool()) school.removeAttribute('list');
    else school.setAttribute('list', 'schoolList');
  }
  document.querySelectorAll('.hs-only').forEach((el) => { el.hidden = !isHighSchool(); });
  if (current === steps.length) nextBtn.textContent = c.buildText;
  personalize();
}

// Populate the school + major autocomplete dropdowns from schools.js / majors.js.
(function fillDatalists() {
  const escape = (s) => s.replace(/"/g, '&quot;');
  const fill = (id, source, sort) => {
    const list = document.getElementById(id);
    if (!list || !Array.isArray(source)) return;
    // Source files keep their category grouping for maintenance. Sort a copy
    // here so the dropdown shows A to Z. localeCompare keeps it case-insensitive.
    const items = sort ? [...source].sort((a, b) => a.localeCompare(b)) : source;
    list.innerHTML = items.map((s) => `<option value="${escape(s)}"></option>`).join('');
  };
  fill('schoolList', window.SCHOOLS, true);
  fill('majorList', window.MAJORS, true);
  fill('subjectList', HIGH_SCHOOL_SUBJECTS);
})();

// Capitalize a name no matter how it's typed: "marley"/"MARLEY" -> "Marley".
function capitalizeName(name) {
  const s = (name || '').trim();
  if (!s) return s;
  return s.toLowerCase().replace(/(^|[\s'\-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

// Flag obvious junk in the career goal (keyboard mashing, no real words) so a
// student who types nonsense to "test it" gets told to write a real goal.
function looksLikeGibberish(text) {
  const t = (text || '').trim();
  if (t.length < 3) return true;
  const letters = t.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 3) return true;
  const vowels = (letters.match(/[aeiou]/gi) || []).length;
  if (vowels / letters.length < 0.18) return true; // real words carry vowels
  if (/(asdf|sdfg|dfgh|fghj|ghjk|hjkl|qwer|wert|erty|rtyu|tyui|yuio|uiop|zxcv|xcvb|cvbn|vbnm)/i.test(t)) return true;
  if (/(.)\1{3,}/.test(t)) return true; // same char 4+ times
  // needs at least one 2+ letter word that contains a vowel
  if (!t.split(/\s+/).some((w) => /[a-z]{2,}/i.test(w) && /[aeiou]/i.test(w))) return true;
  return false;
}

function firstName() {
  const v = (document.getElementById('firstName').value || '').trim();
  return v ? v.split(/\s+/)[0] : '';
}

// Personalize the eyebrows once we know their name — feels like a conversation
function personalize() {
  const name = firstName();
  const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  if (isHighSchool()) {
    set('eyebrow2', name ? `Let's find your fit, ${name}` : 'Step 2 of 4');
    set('eyebrow3', name ? `Now your real-world signals, ${name}` : 'Step 3 of 4');
    set('eyebrow4', name ? `Last one, ${name}` : 'Step 4 of 4');
  } else {
    set('eyebrow2', name ? `Nice to meet you, ${name}` : 'Step 2 of 4');
    set('eyebrow3', name ? `You're doing great, ${name}` : 'Step 3 of 4');
    set('eyebrow4', name ? `Last one, ${name}` : 'Step 4 of 4');
  }
}

function goTo(n) {
  personalize();
  if (!stageChosen) return;
  steps.forEach(s => { s.classList.remove('active'); s.classList.remove('entering'); });
  dots.forEach(d => d.classList.remove('active'));
  const step = steps[n - 1];
  step.classList.add('active');
  // retrigger the enter animation
  void step.offsetWidth;
  step.classList.add('entering');
  dots[n - 1].classList.add('active');
  backBtn.style.visibility = n > 1 ? 'visible' : 'hidden';
  nextBtn.textContent = n === steps.length ? copyByStage[schoolStage].buildText : 'Continue';
  current = n;
}

function showStageIntro() {
  stageChosen = false;
  stageIntro?.classList.add('active');
  document.querySelectorAll('.intro-stage-card').forEach((btn) => {
    btn.classList.remove('active');
    btn.setAttribute('aria-pressed', 'false');
  });
  steps.forEach(s => { s.classList.remove('active'); s.classList.remove('entering'); });
  dots.forEach(d => d.classList.remove('active'));
  if (progress) progress.hidden = true;
  if (actions) actions.hidden = true;
}

function startForm(stage) {
  applyStage(stage);
  stageChosen = true;
  stageIntro?.classList.remove('active');
  if (progress) progress.hidden = false;
  if (actions) actions.hidden = false;
  goTo(1);
}

// "Edit profile" prefills the form; "Build My Path" (?fresh=1) starts blank.
const searchParams = new URLSearchParams(location.search);
const ONBOARD_MODE = searchParams.get('edit') === '1' ? 'edit' : 'fresh';
const requestedStage = searchParams.get('stage');

(function prefill() {
  if (ONBOARD_MODE !== 'edit') return; // fresh start — leave the form blank
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const existing = read('figuredProfile') || read('pathlineProfile');
  if (!existing) return;
  applyStage(existing.schoolStage === 'highSchool' ? 'highSchool' : 'college');
  didPrefillStage = true;
  stageChosen = true;
  const fill = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
  fill('firstName', existing.firstName === 'You' ? '' : existing.firstName);
  fill('year', existing.year);
  fill('major', existing.major);
  fill('school', existing.school);
  fill('gpa', existing.gpa);
  fill('timeLeft', existing.timeLeft);
  fill('activities', existing.activities);
  fill('experience', existing.experience);
  fill('goal', existing.goal === 'your goal' ? '' : existing.goal);
  fill('skills', existing.skills);
  fill('classesLiked', existing.classesLiked);
  fill('collegeInterest', existing.collegeInterest);
  fill('priorityConcern', existing.priorityConcern);
  fill('collegePrefs', existing.collegePrefs);
  fill('costComfort', existing.costComfort);
  fill('supportLevel', existing.supportLevel);
  fill('worries', existing.worries);
})();

document.querySelectorAll('.ob-stage-card').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('intro-stage-card')) startForm(btn.dataset.stage);
    else applyStage(btn.dataset.stage);
  });
});

backBtn.addEventListener('click', () => {
  if (current > 1) {
    goTo(current - 1);
    return;
  }
  // College-only for now: no stage chooser to fall back to from step 1.
});

nextBtn.addEventListener('click', () => {
  if (current < steps.length) {
    goTo(current + 1);
    return;
  }
  // Final step: a real goal is required. 4ward can't build a trajectory toward
  // nothing — without one, the AI gets a profile with goal: "your goal" and
  // either errors or returns generic content nobody can act on. Two checks:
  // (1) something is there, (2) it isn't keyboard-mashing.
  const goalEl = document.getElementById('goal');
  const goalError = document.getElementById('goalError');
  const goalVal = (goalEl?.value || '').trim();
  if (!goalVal) {
    if (goalError) {
      goalError.textContent = "Tell us where you want to go — even a rough direction is enough. 4ward can't build a trajectory toward nothing.";
      goalError.hidden = false;
    }
    goalEl?.focus();
    return;
  }
  if (looksLikeGibberish(goalVal)) {
    if (goalError) {
      goalError.textContent = "That doesn't look like a real goal yet. Tell us honestly where you want to go — even a rough direction works.";
      goalError.hidden = false;
    }
    goalEl?.focus();
    return;
  }
  if (goalError) goalError.hidden = true;
  const firstNameValue = document.getElementById('firstName').value.trim();
  const profile = {
    schoolStage,
    // Placeholder text is a visual hint, not a saved value. Without this both
    // stages fall back to 'You' so an empty name field never silently saves
    // the placeholder ("Marley") as the student's actual name.
    firstName: firstNameValue || 'You',
    year: document.getElementById('year').value,
    major: document.getElementById('major').value.trim(),
    school: document.getElementById('school').value.trim(),
    gpa: document.getElementById('gpa').value.trim(),
    timeLeft: document.getElementById('timeLeft').value,
    activities: document.getElementById('activities').value.trim(),
    experience: document.getElementById('experience').value.trim(),
    goal: document.getElementById('goal').value.trim() || 'your goal',
    skills: document.getElementById('skills').value.trim(),
    classesLiked: document.getElementById('classesLiked')?.value.trim() || '',
    collegeInterest: document.getElementById('collegeInterest')?.value || '',
    priorityConcern: document.getElementById('priorityConcern')?.value || '',
    collegePrefs: document.getElementById('collegePrefs')?.value.trim() || '',
    costComfort: document.getElementById('costComfort')?.value || '',
    supportLevel: document.getElementById('supportLevel')?.value || '',
    worries: document.getElementById('worries')?.value.trim() || '',
  };
  localStorage.setItem('figuredProfile', JSON.stringify(profile));
  // A changed profile means stale insights — clear so the app regenerates.
  localStorage.removeItem('figuredAiContent');
  // A fresh "Build My Path" is a clean slate — don't inherit the last
  // person's logged wins, checked actions, or résumé feedback.
  if (ONBOARD_MODE !== 'edit') {
    localStorage.removeItem('figuredWins');
    localStorage.removeItem('figuredChecked');
    localStorage.removeItem('figuredResumeFeedback');
  }

  // A short, personal "building your trajectory" moment before the handoff
  const overlay = document.getElementById('buildingOverlay');
  const name = profile.firstName === 'You' ? '' : capitalizeName(profile.firstName);
  const head = document.getElementById('buildingHeadline');
  if (head) head.textContent = name ? `Building your trajectory, ${name}…` : 'Building your trajectory…';

  const goApp = () => { window.location.href = './app.html'; };

  if (overlay) {
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('show'));
    startBuildGame();
  }

  // Overlap the AI generation with this interstitial: generate the trajectory
  // here and cache it in the same shape the dashboard reads, so the dashboard
  // opens already-done instead of waiting for the whole call after a fixed
  // delay. This collapses two waits (interstitial + dashboard thinking) into
  // one honest screen.
  // The dashboard owns trajectory generation now. It paints the instant draft
  // immediately, then personalizes it with Claude in place (with a "Personalizing
  // your trajectory" cue and a smooth fade to the detailed version). So the build
  // screen is just a short, snappy branded beat with Path Dash, not a place we
  // wait on a ~30s API call. Generating only on the dashboard means a single
  // call, no abandoned request, and no duplicate generation.
  const BUILD_SHOW = overlay ? 3400 : 0;
  setTimeout(goApp, BUILD_SHOW);
});

// djb2 hash, identical to script.js hashProfile — must match so the dashboard
// recognizes the insights we pre-generated here as a cache hit for this profile.
function hashProfile(p) {
  const str = JSON.stringify(p);
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return String(h);
}

// High school onboarding is paused while we focus on college. Fresh sessions
// start directly in college mode and skip the stage chooser; ?stage=highSchool
// deep links are ignored. The HS code paths (copyByStage.highSchool, .hs-only
// fields, the stage intro screen) stay in place so we can re-enable later by
// restoring the chooser branch. Existing saved HS profiles still load in edit
// mode via prefill() so no one's data breaks.
if (!didPrefillStage) {
  startForm('college');
} else {
  stageIntro?.classList.remove('active');
  if (progress) progress.hidden = false;
  if (actions) actions.hidden = false;
  goTo(1);
}

function startBuildGame() {
  const canvas = document.getElementById('buildGame');
  const scoreEl = document.getElementById('buildGameScore');
  if (!canvas || canvas.dataset.running === '1') return;
  canvas.dataset.running = '1';

  const ctx = canvas.getContext('2d');
  const state = {
    width: canvas.width,
    height: canvas.height,
    ground: canvas.height - 36,
    player: { x: 54, y: canvas.height - 72, size: 28, vy: 0 },
    blockers: [],
    sparks: [],
    speed: 2.45,
    score: 0,
    best: Number(localStorage.getItem('figuredBuildGameBest') || 0),
    last: performance.now(),
    nextBlocker: 1650,
    alive: true,
  };

  function jump() {
    if (!state.alive) {
      resetGame();
      return;
    }
    if (state.player.y >= state.ground - state.player.size - 1) {
      state.player.vy = -12.6;
    }
  }

  function resetGame() {
    state.blockers = [];
    state.sparks = [];
    state.speed = 2.45;
    state.score = 0;
    state.nextBlocker = 1450;
    state.player.y = state.ground - state.player.size;
    state.player.vy = 0;
    state.alive = true;
  }

  const onKey = (event) => {
    if (event.code === 'Space' && !document.getElementById('buildingOverlay')?.hidden) {
      event.preventDefault();
      jump();
    }
  };

  canvas.addEventListener('pointerdown', jump);
  document.addEventListener('keydown', onKey);

  function addSpark(x, y) {
    state.sparks.push({ x, y, r: 2 + Math.random() * 3, life: 1 });
  }

  function drawRoundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  function tick(now) {
    const overlay = document.getElementById('buildingOverlay');
    if (!overlay || overlay.hidden) {
      document.removeEventListener('keydown', onKey);
      return;
    }

    const dt = Math.min(32, now - state.last);
    state.last = now;
    ctx.clearRect(0, 0, state.width, state.height);

    const sky = ctx.createLinearGradient(0, 0, 0, state.height);
    sky.addColorStop(0, '#eef6f0');
    sky.addColorStop(1, '#f7f4ea');
    ctx.fillStyle = sky;
    drawRoundedRect(0, 0, state.width, state.height, 18);

    ctx.fillStyle = 'rgba(47, 90, 79, 0.14)';
    ctx.fillRect(0, state.ground, state.width, 2);
    ctx.fillStyle = 'rgba(47, 90, 79, 0.12)';
    for (let i = 0; i < 8; i++) {
      const x = ((i * 90) - (state.score * 0.35 % 90));
      ctx.fillRect(x, state.ground + 16, 44, 3);
    }

    if (state.alive) {
      state.score += dt * 0.01;
      state.speed = Math.min(5.7, 2.45 + state.score * 0.01);
      state.nextBlocker -= dt * state.speed;
      if (state.nextBlocker <= 0) {
        const h = 18 + Math.random() * 22;
        state.blockers.push({ x: state.width + 20, y: state.ground - h, w: 14 + Math.random() * 10, h });
        state.nextBlocker = 1120 + Math.random() * 760;
      }

      state.player.vy += 0.58;
      state.player.y += state.player.vy;
      const floor = state.ground - state.player.size;
      if (state.player.y > floor) {
        state.player.y = floor;
        state.player.vy = 0;
      }
    }

    state.blockers.forEach((b) => { b.x -= state.speed; });
    state.blockers = state.blockers.filter((b) => b.x + b.w > -10);

    const p = state.player;
    state.blockers.forEach((b) => {
      const hit = state.alive && p.x < b.x + b.w && p.x + p.size > b.x && p.y < b.y + b.h && p.y + p.size > b.y;
      if (hit) {
        state.alive = false;
        state.best = Math.max(state.best, Math.floor(state.score));
        localStorage.setItem('figuredBuildGameBest', String(state.best));
        for (let i = 0; i < 16; i++) addSpark(p.x + p.size / 2, p.y + p.size / 2);
      }
    });

    ctx.fillStyle = '#315b50';
    drawRoundedRect(p.x, p.y, p.size, p.size, 8);
    ctx.fillStyle = '#f6f2e8';
    ctx.fillRect(p.x + 8, p.y + 8, 5, 5);
    ctx.fillRect(p.x + 18, p.y + 8, 5, 5);

    state.blockers.forEach((b) => {
      ctx.fillStyle = '#c56f3f';
      drawRoundedRect(b.x, b.y, b.w, b.h, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(b.x + 4, b.y + 6, Math.max(3, b.w - 8), 3);
    });

    state.sparks.forEach((s) => {
      s.x += (Math.random() - 0.5) * 5;
      s.y += (Math.random() - 0.5) * 5;
      s.life -= 0.04;
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.fillStyle = '#d6a23f';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    state.sparks = state.sparks.filter((s) => s.life > 0);

    ctx.fillStyle = '#2f5a4f';
    ctx.font = '700 12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`Best ${state.best}`, 16, 24);
    if (!state.alive) {
      ctx.fillStyle = 'rgba(246, 242, 232, 0.92)';
      drawRoundedRect(148, 58, 224, 72, 14);
      ctx.fillStyle = '#1f2d28';
      ctx.font = '800 16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Tap to try again', 200, 91);
      ctx.font = '600 12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Your path is still building.', 195, 112);
    }

    if (scoreEl) scoreEl.textContent = String(Math.floor(state.score));
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// --- Résumé upload: read it, prefill the profile, review it ---
(function resumeUpload() {
  const btn = document.getElementById('resumeBtn');
  const fileInput = document.getElementById('resumeFile');
  if (!btn || !fileInput || typeof FigAI === 'undefined') return;

  const statusEl = document.getElementById('resumeStatus');
  const feedbackEl = document.getElementById('resumeFeedback');
  const keyAsk = document.getElementById('resumeKeyAsk');
  let pending = null;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function setStatus(msg, kind) {
    statusEl.hidden = false;
    statusEl.className = 'resume-status' + (kind ? ' ' + kind : '');
    statusEl.textContent = msg;
  }

  function mergeLines(existing, arr) {
    const cur = (existing || '').split('\n').map((s) => s.trim()).filter(Boolean);
    const seen = new Set(cur.map((s) => s.toLowerCase()));
    (arr || []).forEach((item) => {
      const t = (item || '').trim();
      if (t && !seen.has(t.toLowerCase())) { cur.push(t); seen.add(t.toLowerCase()); }
    });
    return cur.join('\n');
  }

  function fillFromResume(data) {
    const setIfEmpty = (id, val) => { const el = document.getElementById(id); if (el && val && !el.value.trim()) el.value = val; };
    setIfEmpty('major', data.major);
    setIfEmpty('school', data.school);
    const exp = document.getElementById('experience'); if (exp) exp.value = mergeLines(exp.value, data.experience);
    const act = document.getElementById('activities'); if (act) act.value = mergeLines(act.value, data.activities);
    const sk = document.getElementById('skills'); if (sk) sk.value = mergeLines(sk.value, data.skills);
  }

  // Onboarding shows only a short pointer — the full breakdown lives in the
  // dashboard Résumé tab, so we don't duplicate it here.
  function renderFeedback() {
    feedbackEl.hidden = false;
    feedbackEl.innerHTML = '<div class="resume-fb-row"><strong>Full résumé review is ready</strong><p>Finish setting up, then open the Résumé tab in your dashboard for the complete breakdown: how it reads, weak verbs to swap, bullet rewrites, and keywords for your goal.</p></div>';
  }

  async function runParse() {
    if (!pending) return;
    keyAsk.hidden = true;
    setStatus('Reading your résumé…', 'loading');
    feedbackEl.hidden = true;
    try {
      const goal = document.getElementById('goal')?.value.trim() || '';
      const data = await FigAI.parseResume(pending.data, pending.mediaType, { goal });
      fillFromResume(data);
      // Save the full analysis so it flows straight into the dashboard Résumé tab.
      try { localStorage.setItem('figuredResumeAnalysis', JSON.stringify(data)); } catch (e) { /* ignore */ }
      try { localStorage.setItem('figuredResumeFeedback', JSON.stringify(data.feedback || [])); } catch (e) { /* ignore */ }
      const filled = [data.experience, data.activities, data.skills].reduce((n, a) => n + (a ? a.length : 0), 0);
      setStatus(`Done — read your résumé and filled in ${filled} item${filled === 1 ? '' : 's'}. Edit anything below.`, 'ok');
      renderFeedback();
    } catch (e) {
      setStatus('Could not read that résumé: ' + e.message, 'error');
    }
  }

  btn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (isPdf) {
        pending = { data: String(reader.result).split(',')[1] || '', mediaType: 'application/pdf', name: file.name };
      } else {
        pending = { data: String(reader.result), mediaType: 'text/plain', name: file.name };
      }
      if (!FigAI.hasKey()) {
        keyAsk.hidden = false;
        setStatus('Résumé ready — enable AI below to read it.', '');
        document.getElementById('resumeKey').focus();
        return;
      }
      runParse();
    };
    if (isPdf) reader.readAsDataURL(file); else reader.readAsText(file);
  });

  document.getElementById('resumeKeySave').addEventListener('click', () => {
    const v = document.getElementById('resumeKey').value.trim();
    if (!v) { document.getElementById('resumeKey').focus(); return; }
    FigAI.setKey(v);
    runParse();
  });
})();
