const steps = document.querySelectorAll('.ob-step');
const dots = document.querySelectorAll('.ob-dot');
const backBtn = document.getElementById('obBack');
const nextBtn = document.getElementById('obNext');
let current = 1;

function goTo(n) {
  steps.forEach(s => s.classList.remove('active'));
  dots.forEach(d => d.classList.remove('active'));
  steps[n - 1].classList.add('active');
  dots[n - 1].classList.add('active');
  backBtn.style.visibility = n > 1 ? 'visible' : 'hidden';
  nextBtn.textContent = n === steps.length ? 'Build my trajectory' : 'Continue';
  current = n;
}

// Prefill if the student is editing an existing profile
(function prefill() {
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
  window.location.href = './app.html';
});

goTo(1);
