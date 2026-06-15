const steps = document.querySelectorAll('.ob-step');
const dots = document.querySelectorAll('.ob-dot');
const backBtn = document.getElementById('obBack');
const nextBtn = document.getElementById('obNext');
let current = 1;

// Populate the school autocomplete from the SCHOOLS list (schools.js).
(function fillSchoolList() {
  const list = document.getElementById('schoolList');
  if (!list || !Array.isArray(window.SCHOOLS)) return;
  list.innerHTML = window.SCHOOLS.map((s) => `<option value="${s.replace(/"/g, '&quot;')}"></option>`).join('');
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
  set('eyebrow2', name ? `Nice to meet you, ${name}` : 'Step 2 of 4');
  set('eyebrow3', name ? `You're doing great, ${name}` : 'Step 3 of 4');
  set('eyebrow4', name ? `Last one, ${name}` : 'Step 4 of 4');
}

function goTo(n) {
  personalize();
  steps.forEach(s => { s.classList.remove('active'); s.classList.remove('entering'); });
  dots.forEach(d => d.classList.remove('active'));
  const step = steps[n - 1];
  step.classList.add('active');
  // retrigger the enter animation
  void step.offsetWidth;
  step.classList.add('entering');
  dots[n - 1].classList.add('active');
  backBtn.style.visibility = n > 1 ? 'visible' : 'hidden';
  nextBtn.textContent = n === steps.length ? 'Build my trajectory' : 'Continue';
  current = n;
}

// "Edit profile" prefills the form; "Build My Path" (?fresh=1) starts blank.
const ONBOARD_MODE = new URLSearchParams(location.search).get('edit') === '1' ? 'edit' : 'fresh';

(function prefill() {
  if (ONBOARD_MODE !== 'edit') return; // fresh start — leave the form blank
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const existing = read('figuredProfile') || read('pathlineProfile');
  if (!existing) return;
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
})();

backBtn.addEventListener('click', () => { if (current > 1) goTo(current - 1); });

nextBtn.addEventListener('click', () => {
  if (current < steps.length) {
    goTo(current + 1);
    return;
  }
  // Final step: reject obvious junk in the career goal before building anything.
  const goalEl = document.getElementById('goal');
  const goalError = document.getElementById('goalError');
  const goalVal = (goalEl?.value || '').trim();
  if (goalVal && looksLikeGibberish(goalVal)) {
    if (goalError) {
      goalError.textContent = "That doesn't look like a real goal yet. Tell us honestly where you want to go — even a rough direction works.";
      goalError.hidden = false;
    }
    goalEl?.focus();
    return;
  }
  if (goalError) goalError.hidden = true;
  const profile = {
    firstName: document.getElementById('firstName').value.trim() || 'You',
    year: document.getElementById('year').value,
    major: document.getElementById('major').value.trim(),
    school: document.getElementById('school').value.trim(),
    gpa: document.getElementById('gpa').value.trim(),
    timeLeft: document.getElementById('timeLeft').value,
    activities: document.getElementById('activities').value.trim(),
    experience: document.getElementById('experience').value.trim(),
    goal: document.getElementById('goal').value.trim() || 'your goal',
    skills: document.getElementById('skills').value.trim(),
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
  const MIN_SHOW = 1100; // keep the interstitial from flashing on fast runs
  const startedAt = Date.now();
  const finishAfterMinShow = () => setTimeout(goApp, Math.max(0, MIN_SHOW - (Date.now() - startedAt)));

  if (typeof FigAI !== 'undefined' && FigAI.hasKey && FigAI.hasKey()) {
    FigAI.generateInsights(profile)
      .then((data) => {
        try {
          localStorage.setItem('figuredAiContent', JSON.stringify({ hash: hashProfile(profile), data }));
        } catch (e) { /* storage full or blocked — app will just regenerate */ }
      })
      .catch(() => { /* generation failed — app falls back or retries on load */ })
      .finally(finishAfterMinShow);
  } else if (overlay) {
    setTimeout(goApp, 1700);
  } else {
    goApp();
  }
});

// djb2 hash, identical to script.js hashProfile — must match so the dashboard
// recognizes the insights we pre-generated here as a cache hit for this profile.
function hashProfile(p) {
  const str = JSON.stringify(p);
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return String(h);
}

goTo(1);

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
    speed: 3.8,
    score: 0,
    best: Number(localStorage.getItem('figuredBuildGameBest') || 0),
    last: performance.now(),
    nextBlocker: 880,
    alive: true,
  };

  function jump() {
    if (!state.alive) {
      resetGame();
      return;
    }
    if (state.player.y >= state.ground - state.player.size - 1) {
      state.player.vy = -11.5;
    }
  }

  function resetGame() {
    state.blockers = [];
    state.sparks = [];
    state.speed = 3.8;
    state.score = 0;
    state.nextBlocker = 760;
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
      state.score += dt * 0.012;
      state.speed = Math.min(7.5, 3.8 + state.score * 0.018);
      state.nextBlocker -= dt * state.speed;
      if (state.nextBlocker <= 0) {
        const h = 24 + Math.random() * 26;
        state.blockers.push({ x: state.width + 20, y: state.ground - h, w: 18 + Math.random() * 14, h });
        state.nextBlocker = 720 + Math.random() * 540;
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

  function renderFeedback(feedback) {
    if (!feedback || !feedback.length) { feedbackEl.hidden = true; return; }
    feedbackEl.hidden = false;
    feedbackEl.innerHTML = '<h4>Résumé feedback</h4>' + feedback.map((f) =>
      `<div class="resume-fb-row"><strong>${esc(f.title)}</strong><p>${esc(f.detail)}</p></div>`
    ).join('');
  }

  async function runParse() {
    if (!pending) return;
    keyAsk.hidden = true;
    setStatus('Reading your résumé…', 'loading');
    feedbackEl.hidden = true;
    try {
      const data = await FigAI.parseResume(pending.data, pending.mediaType);
      fillFromResume(data);
      try { localStorage.setItem('figuredResumeFeedback', JSON.stringify(data.feedback || [])); } catch (e) { /* ignore */ }
      const filled = [data.experience, data.activities, data.skills].reduce((n, a) => n + (a ? a.length : 0), 0);
      setStatus(`Done — read your résumé and filled in ${filled} item${filled === 1 ? '' : 's'}. Edit anything below.`, 'ok');
      renderFeedback(data.feedback);
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
