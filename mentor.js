// 4ward — mentor intake. Saves an opted-in mentor to localStorage so they
// appear as a "✓ On 4ward" direct-link card in the student's Connections.
// (Prototype: same-browser storage. Production would POST to a shared backend.)

const $ = (id) => document.getElementById(id);

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function initialsFor(name) {
  const words = (name || '?').replace(/[^a-zA-Z ]/g, '').trim().split(/\s+/);
  return ((words[0]?.[0] || '') + (words[1]?.[0] || '')).toUpperCase() || '★';
}

// Accept "linkedin.com/in/x", "www.linkedin.com/in/x", or a full URL.
function normalizeLinkedin(raw) {
  let v = (raw || '').trim();
  if (!v) return '';
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v.replace(/^\/+/, '');
  try {
    const u = new URL(v);
    if (!/(^|\.)linkedin\.com$/i.test(u.hostname)) return null; // not a LinkedIn URL
    return u.href;
  } catch {
    return null;
  }
}

function loadMentors() {
  try { return JSON.parse(localStorage.getItem('figuredMentors')) || []; } catch { return []; }
}

function saveMentor(m) {
  const list = loadMentors();
  list.unshift(m);
  localStorage.setItem('figuredMentors', JSON.stringify(list));
}

function showError(msg) {
  const el = $('mError');
  el.textContent = msg;
  el.hidden = false;
}

function renderPreview(m) {
  $('mentorPreview').innerHTML = `
    <article class="product-card mentor-app-card">
      <div class="mentor-avatar">${esc(m.initials)}</div>
      <h3>${esc(m.name)}</h3>
      <p>${esc(m.sub || '')}</p>
      <span class="opted-badge">✓ On 4ward</span>
      <small>${esc(m.why || '')}</small>
      <a class="opp-link opted" href="${esc(m.linkedin)}" target="_blank" rel="noopener">View profile →</a>
    </article>`;
}

$('mSubmit').addEventListener('click', () => {
  const name = $('mName').value.trim();
  const sub = $('mRole').value.trim();
  const field = $('mField').value.trim();
  const linkedin = normalizeLinkedin($('mLinkedin').value);
  const why = $('mWhy').value.trim();
  const consent = $('mConsent').checked;

  if (!name) return showError('Add your name so students know who they\'re talking to.');
  if (!$('mLinkedin').value.trim()) return showError('Add your LinkedIn URL — it\'s how students reach you.');
  if (linkedin === null) return showError('That doesn\'t look like a LinkedIn URL. Copy it from your profile (linkedin.com/in/...).');
  if (!why) return showError('Add a sentence on why a student should talk to you.');
  if (!consent) return showError('Please confirm students can see your profile and reach out.');

  const mentor = { name, sub, field, why, linkedin, initials: initialsFor(name) };
  saveMentor(mentor);

  $('successHeadline').textContent = `You're on 4ward, ${name.split(' ')[0]}.`;
  renderPreview(mentor);
  $('mError').hidden = true;
  $('mentorForm').classList.remove('active');
  $('mentorSuccess').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('mAnother').addEventListener('click', () => {
  ['mName', 'mRole', 'mField', 'mLinkedin', 'mWhy'].forEach((id) => { $(id).value = ''; });
  $('mConsent').checked = false;
  $('mentorSuccess').classList.remove('active');
  $('mentorForm').classList.add('active');
  $('mName').focus();
});
