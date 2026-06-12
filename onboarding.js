const steps = document.querySelectorAll('.ob-step');
const dots = document.querySelectorAll('.ob-dot');
const backBtn = document.getElementById('obBack');
const nextBtn = document.getElementById('obNext');
let current = 1;

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
  const name = profile.firstName === 'You' ? '' : profile.firstName;
  const head = document.getElementById('buildingHeadline');
  if (head) head.textContent = name ? `Building your trajectory, ${name}…` : 'Building your trajectory…';
  if (overlay) {
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('show'));
    setTimeout(() => { window.location.href = './app.html'; }, 1700);
  } else {
    window.location.href = './app.html';
  }
});

goTo(1);

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
