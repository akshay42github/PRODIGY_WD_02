/* =========================================
   CHRONOTRACK — script.js
   ========================================= */

// ========== ANIMATED BACKGROUND CANVAS ==========
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], raf;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.r  = Math.random() * 1.5 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.2;
      this.vy = (Math.random() - 0.5) * 0.2;
      this.a  = Math.random() * 0.5 + 0.1;
      this.pulse = Math.random() * Math.PI * 2;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.pulse += 0.01;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      const alpha = this.a * (0.6 + 0.4 * Math.sin(this.pulse));
      const t = this.x / W;
      const r = Math.round(124 + t * (236 - 124));
      const g = Math.round(58  + t * (72  - 58));
      const b = Math.round(237 + t * (153 - 237));
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    }
  }

  function initParticles() {
    particles = Array.from({ length: 120 }, () => new Particle());
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(168,85,247,0.028)';
    ctx.lineWidth = 1;
    const size = 80;
    for (let x = 0; x < W; x += size) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += size) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);

    // Deep indigo radial base — top-left violet
    const grad = ctx.createRadialGradient(W * 0.2, H * 0.2, 0, W * 0.2, H * 0.2, W * 0.85);
    grad.addColorStop(0, 'rgba(40,10,100,0.52)');
    grad.addColorStop(0.5, 'rgba(20,5,55,0.28)');
    grad.addColorStop(1, 'rgba(7,7,26,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Pink orb — bottom-right
    const grad2 = ctx.createRadialGradient(W * 0.82, H * 0.78, 0, W * 0.82, H * 0.78, W * 0.48);
    grad2.addColorStop(0, 'rgba(180,40,100,0.2)');
    grad2.addColorStop(1, 'rgba(7,7,26,0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, W, H);

    drawGrid();
    particles.forEach(p => { p.update(); p.draw(); });
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => { resize(); initParticles(); });
  resize();
  initParticles();
  loop();
})();


// ========== NAVBAR SCROLL EFFECT ==========
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  updateActiveLink();
});

function updateActiveLink() {
  const sections = ['home', 'stopwatch', 'features', 'about', 'contact'];
  let current = 'home';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 140) current = id;
  });
  navLinks.forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === '#' + current);
  });
}

// ========== SMOOTH SCROLLING ==========
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: offset, behavior: 'smooth' });
    // Close mobile menu if open
    if (mobileOverlay.classList.contains('open')) toggleMenu();
  });
});

// ========== HAMBURGER / MOBILE MENU ==========
const hamburger     = document.getElementById('hamburger');
const mobileOverlay = document.getElementById('mobile-overlay');

function toggleMenu() {
  hamburger.classList.toggle('active');
  mobileOverlay.classList.toggle('open');
  document.body.style.overflow = mobileOverlay.classList.contains('open') ? 'hidden' : '';
}

hamburger.addEventListener('click', toggleMenu);
mobileOverlay.addEventListener('click', e => {
  if (e.target === mobileOverlay) toggleMenu();
});


// ========== HERO LIVE CLOCK ==========
const heroClock = document.getElementById('hero-clock');
function updateHeroClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  heroClock.textContent = `${h}:${m}`;
}
updateHeroClock();
setInterval(updateHeroClock, 1000);


// ========== STOPWATCH LOGIC ==========
let startTime    = 0;
let elapsedTime  = 0;
let timerInterval = null;
let isRunning    = false;
let lapTimes     = [];
let lapStart     = 0;

const display = document.querySelector('.sw-display');
const swStatus = document.getElementById('sw-status');
const elH  = document.getElementById('sw-hours');
const elM  = document.getElementById('sw-minutes');
const elS  = document.getElementById('sw-seconds');
const elMS = document.getElementById('sw-ms');
const progress  = document.getElementById('sw-progress');
const btnStart  = document.getElementById('btn-start');
const btnStartT = document.getElementById('btn-start-text');
const btnReset  = document.getElementById('btn-reset');
const btnLap    = document.getElementById('btn-lap');
const lapList   = document.getElementById('lap-list');
const lapEmpty  = document.getElementById('lap-empty');
const lapCount  = document.getElementById('lap-count');

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h   = Math.floor(totalSec / 3600);
  const m   = Math.floor((totalSec % 3600) / 60);
  const s   = totalSec % 60;
  const mil = Math.floor(ms % 1000);
  return {
    h:   String(h).padStart(2, '0'),
    m:   String(m).padStart(2, '0'),
    s:   String(s).padStart(2, '0'),
    ms:  String(mil).padStart(3, '0'),
    raw: ms
  };
}

function updateDisplay(ms) {
  const t = formatTime(ms);
  elH.textContent  = t.h;
  elM.textContent  = t.m;
  elS.textContent  = t.s;
  elMS.textContent = t.ms;
  // Progress bar — cycles every 60 seconds
  const pct = (ms % 60000) / 60000 * 100;
  progress.style.width = pct + '%';
}

function tick() {
  elapsedTime = Date.now() - startTime;
  updateDisplay(elapsedTime);
}

function startTimer() {
  startTime = Date.now() - elapsedTime;
  timerInterval = setInterval(tick, 13); // ~75fps
  isRunning = true;
  if (lapStart === 0) lapStart = startTime;

  display.classList.add('running');
  display.classList.remove('paused');
  swStatus.textContent = 'RUNNING';
  btnStart.classList.remove('paused-state');
  btnStartT.textContent = 'Pause';
  btnStart.querySelector('svg').innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
  btnLap.disabled  = false;
  btnReset.disabled = false;
}

function pauseTimer() {
  clearInterval(timerInterval);
  isRunning = false;

  display.classList.remove('running');
  display.classList.add('paused');
  swStatus.textContent = 'PAUSED';
  btnStart.classList.add('paused-state');
  btnStartT.textContent = 'Resume';
  btnStart.querySelector('svg').innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
}

function resetTimer() {
  clearInterval(timerInterval);
  isRunning     = false;
  elapsedTime   = 0;
  lapStart      = 0;
  lapTimes      = [];

  updateDisplay(0);
  display.classList.remove('running', 'paused');
  swStatus.textContent = 'READY';
  btnStart.classList.remove('paused-state');
  btnStartT.textContent = 'Start';
  btnStart.querySelector('svg').innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  btnLap.disabled  = true;
  btnReset.disabled = false;
  lapList.innerHTML = '';
  lapEmpty.style.display = 'flex';
  lapCount.textContent = '0 laps';
  progress.style.width = '0%';
}

function recordLap() {
  if (!isRunning) return;
  const now = Date.now();
  const lapElapsed = now - (lapStart || startTime);
  lapStart = now;

  lapTimes.push({ total: elapsedTime, split: lapElapsed });
  renderLaps();
}

function renderLaps() {
  lapEmpty.style.display = 'none';
  lapCount.textContent = `${lapTimes.length} ${lapTimes.length === 1 ? 'lap' : 'laps'}`;
  lapList.innerHTML = '';

  // Find best and worst splits
  const splits = lapTimes.map(l => l.split);
  const minSplit = Math.min(...splits);
  const maxSplit = Math.max(...splits);

  // Render in reverse order (latest first)
  [...lapTimes].reverse().forEach((lap, idx) => {
    const actualIdx = lapTimes.length - idx;
    const t = formatTime(lap.total);
    const d = formatTime(lap.split);
    const isBest  = lapTimes.length > 1 && lap.split === minSplit;
    const isWorst = lapTimes.length > 1 && lap.split === maxSplit;

    const li = document.createElement('li');
    li.className = 'lap-item' + (isBest ? ' best' : isWorst ? ' worst' : '');
    li.innerHTML = `
      <span class="lap-num">Lap ${actualIdx}</span>
      <span class="lap-time-val">${t.h}:${t.m}:${t.s}<span style="font-size:0.7em;opacity:0.6">.${t.ms}</span></span>
      <span class="lap-delta">+${d.m}:${d.s}.${d.ms}</span>
    `;
    lapList.appendChild(li);
  });
}

// BUTTON EVENTS
btnStart.addEventListener('click', () => {
  isRunning ? pauseTimer() : startTimer();
});

btnReset.addEventListener('click', resetTimer);
btnLap.addEventListener('click', recordLap);

// Initialize
btnLap.disabled = true;
updateDisplay(0);

// KEYBOARD SHORTCUTS
document.addEventListener('keydown', e => {
  // Ignore when typing in form
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  switch(e.code) {
    case 'Space':
      e.preventDefault();
      isRunning ? pauseTimer() : startTimer();
      break;
    case 'KeyL':
      if (isRunning) recordLap();
      break;
    case 'KeyR':
      resetTimer();
      break;
  }
});


// ========== CONTACT FORM ==========
const form        = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');

form.addEventListener('submit', e => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Sending…';

  setTimeout(() => {
    form.reset();
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
      Send Message
    `;
    formSuccess.classList.add('show');
    setTimeout(() => formSuccess.classList.remove('show'), 4000);
  }, 1200);
});


// ========== INTERSECTION OBSERVER — scroll reveal ==========
const revealEls = document.querySelectorAll('.feature-card, .contact-item, .about-stat-card, .lap-container');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(28px)';
  el.style.transition = `opacity 0.55s ${i * 0.07}s ease, transform 0.55s ${i * 0.07}s ease`;
  observer.observe(el);
});
