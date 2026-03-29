// Load release manifest and update dynamic elements
fetch('data/release-manifest.json')
  .then(r => r.json())
  .then(manifest => {
    const versionEl = document.getElementById('heroVersion');
    const highlightEl = document.getElementById('heroHighlight');
    if (versionEl) versionEl.textContent = 'v' + manifest.version;
    if (highlightEl && manifest.highlights && manifest.highlights.length) {
      highlightEl.textContent = manifest.highlights[0];
    }
  })
  .catch(() => {});

function toggleDetail(el) {
  const detail = el.nextElementSibling;
  while (detail && !detail.classList.contains('pop-detail')) break;
  const d = el.nextElementSibling.nextElementSibling || el.nextElementSibling;
  // Find the actual detail div
  let node = el.nextElementSibling;
  while (node && !node.classList.contains('pop-detail')) node = node.nextElementSibling;
  if (!node) return;
  el.classList.toggle('open');
  node.classList.toggle('show');
}

function toggleProcs(el) {
  el.classList.toggle('open');
  const card = document.getElementById('proc-list');
  if (el.classList.contains('open')) {
    card.classList.remove('collapsed');
  } else {
    card.classList.add('collapsed');
  }
}

function toggleProcActions(el) {
  el.classList.toggle('open');
  const actions = el.nextElementSibling;
  if (actions) actions.classList.toggle('show');
}

function toggleAI(el) {
  el.classList.toggle('open');
  const detail = el.nextElementSibling;
  if (detail && detail.classList.contains('pop-ai-detail')) {
    detail.classList.toggle('show');
  }
}

// Live clock
function updateTime() {
  const el = document.getElementById('liveTime');
  if (!el) return;
  const now = new Date();
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2,'0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  el.textContent = days[now.getDay()] + ' ' + months[now.getMonth()] + ' ' + now.getDate() + '  ' + h12 + ':' + m + ' ' + ampm;
}
updateTime();
setInterval(updateTime, 10000);

// Position notch directly under dots
function positionNotch() {
  const dots = document.getElementById('mbDots');
  const notch = document.querySelector('.menubar-notch');
  const wrap = document.querySelector('.menubar-wrap');
  if (!dots || !notch || !wrap) return;
  const dotsRect = dots.getBoundingClientRect();
  const wrapRect = wrap.getBoundingClientRect();
  const strip = document.querySelector('.menubar-strip');
  const stripRect = strip.getBoundingClientRect();
  notch.style.left = (dotsRect.left + dotsRect.width / 2 - wrapRect.left - 10) + 'px';
  const popRect = document.querySelector('.popover-mock').getBoundingClientRect();
  notch.style.top = (popRect.top - wrapRect.top - 9) + 'px';
}
window.addEventListener('load', positionNotch);
window.addEventListener('resize', positionNotch);
// Also run after a short delay for layout settle
setTimeout(positionNotch, 200);

function setMode(mode) {
  const html = document.documentElement;
  const darkBtn = document.getElementById('darkBtn');
  const lightBtn = document.getElementById('lightBtn');
  if (mode === 'light') {
    html.classList.add('light');
    darkBtn.classList.remove('active');
    lightBtn.classList.add('active');
  } else {
    html.classList.remove('light');
    lightBtn.classList.remove('active');
    darkBtn.classList.add('active');
  }
}

function copyCode(btn) {
  const wrap = btn.closest('.code-wrap');
  const block = wrap.querySelector('.code-block');
  const text = block.getAttribute('data-copy') || block.textContent.replace(/^\$ /gm, '');
  navigator.clipboard.writeText(text).then(() => {
    btn.classList.add('copied');
    btn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
    }, 2000);
  });
}

// ========== HERO TEXT ANIMATIONS ==========

// Character-by-character blur-fade for h1
function animateChars(el, baseDelay) {
  const html = el.innerHTML;
  const parts = html.split(/(<br\s*\/?>)/i);
  let charIndex = 0;
  el.innerHTML = parts.map(part => {
    if (part.match(/^<br/i)) return part;
    // Split by whitespace runs, wrap each word in a no-break span so mobile
    // line-wrapping happens at word boundaries rather than mid-character
    return part.split(/(\s+)/).map(token => {
      if (/^\s+$/.test(token)) return '<span class="char-space"> </span>';
      const chars = token.split('').map(ch => {
        const delay = baseDelay + charIndex * 15;
        charIndex++;
        return `<span class="char" style="transition-delay:${delay}ms">${ch}</span>`;
      }).join('');
      return `<span class="char-word">${chars}</span>`;
    }).join('');
  }).join('');
  el.classList.add('animated');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.querySelectorAll('.char').forEach(c => c.classList.add('visible'));
    });
  });
}

// Animate logo: bowl → leaves → letters
function animateLogo() {
  const icon = document.querySelector('.logo-icon');
  const letters = document.querySelectorAll('.logo-text .lt');
  if (!icon) return;

  // Bowl + leaves via CSS class
  requestAnimationFrame(() => icon.classList.add('animate'));

  // Letters drop in alternating from above/below, staggered after bowl settles
  letters.forEach((lt, i) => {
    const delay = 500 + i * 55;
    lt.style.transitionDelay = delay + 'ms';
    requestAnimationFrame(() => requestAnimationFrame(() => lt.classList.add('in')));
  });

  // Add glow after full entrance
  setTimeout(() => icon.classList.add('done'), 1200);
}

animateLogo();

// Run hero text animations — overlapping with logo tail end
const h1 = document.querySelector('.hero h1');
const sub = document.querySelector('.hero .hero-sub');
const badge = document.querySelector('.hero .hero-badge');
if (h1) animateChars(h1, 0);
// Subtitle fades in when h1 is ~70% done (~25 chars * 15ms ≈ 375ms)
if (sub) setTimeout(() => sub.classList.add('visible'), 350);
if (badge) badge.style.animationDelay = '600ms';

// ========== DEMO ENTRANCE ANIMATION ==========
// Starts when hero is ~75% done (around 900ms after page load)
function animateDemo() {
  const section = document.querySelector('.demo-section');
  if (!section) return;

  const strip = section.querySelector('.menubar-strip');
  const toggle = section.querySelector('.mode-toggle');
  const dots = section.querySelector('#mbDots');
  const icons = section.querySelectorAll('.menubar-strip .mb-icon');
  const time = section.querySelector('.menubar-strip .mb-time');
  const notch = section.querySelector('.menubar-notch');
  const popover = section.querySelector('.popover-mock');
  const installCol = section.querySelector('.install-col');

  function runSequence() {
    let t = 0;

    // 1. Strip slides in from right
    setTimeout(() => strip.classList.add('in'), t);
    t += 150;

    // 2. Mode toggle + time start appearing as strip lands
    setTimeout(() => { toggle.classList.add('in'); time.classList.add('in'); }, t);
    t += 80;

    // 3. Icons pop in right to left (search, wifi) — tight stagger
    icons.forEach((icon, i) => {
      setTimeout(() => icon.classList.add('in'), t + (icons.length - 1 - i) * 70);
    });
    t += icons.length * 70 + 40;

    // 4. Dot matrix pops in last
    setTimeout(() => dots.classList.add('in'), t);
    t += 250;

    // 5. Dot matrix "click" pulse
    setTimeout(() => dots.classList.add('clicked'), t);
    t += 200;

    // 7. Notch drops in
    setTimeout(() => notch.classList.add('in'), t);
    t += 100;

    // 8. Popover + install col
    setTimeout(() => {
      popover.classList.add('in');
      if (installCol) installCol.classList.add('in');
      setTimeout(positionNotch, 50);
    }, t);
  }

  // Use IntersectionObserver but with a minimum delay tied to hero progress
  const heroDelay = 450; // hero ~75% done (h1 starts at 0 now)
  let visible = false;
  let timerReady = false;

  function tryRun() {
    if (visible && timerReady) runSequence();
  }

  setTimeout(() => { timerReady = true; tryRun(); }, heroDelay);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      visible = true;
      tryRun();
    });
  }, { threshold: 0.05 });

  observer.observe(section);
}

animateDemo();

// ========== CURSOR GLOW ==========
if (window.matchMedia('(hover: hover)').matches) {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  document.addEventListener('mousemove', (e) => {
    glow.style.transform = `translate(${e.clientX - 250}px, ${e.clientY - 250}px)`;
    if (!glow.classList.contains('active')) glow.classList.add('active');
  });
}

// ========== FREE PORT SIMULATION ==========
(function() {
  const freeBtn = document.querySelector('.pop-detail .pill-btn.danger');
  if (!freeBtn) return;
  freeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    // Find the project row above this detail
    const detail = freeBtn.closest('.pop-detail');
    if (!detail) return;
    const row = detail.previousElementSibling;
    // Find divider before row
    const divider = row && row.previousElementSibling;

    // Animate out
    [row, detail].forEach(el => {
      if (!el) return;
      el.style.transition = 'opacity 0.35s ease, transform 0.35s ease, max-height 0.4s ease 0.1s, padding 0.4s ease 0.1s, margin 0.4s ease 0.1s';
      el.style.opacity = '0';
      el.style.transform = 'scale(0.95) translateX(-10px)';
      setTimeout(() => {
        el.style.maxHeight = '0';
        el.style.padding = '0';
        el.style.margin = '0';
        el.style.overflow = 'hidden';
      }, 200);
    });
    // Hide divider
    if (divider && divider.style !== undefined) {
      setTimeout(() => { divider.style.opacity = '0'; divider.style.maxHeight = '0'; }, 200);
    }
    // Update summary count
    const summary = document.querySelector('.pop-header .summary');
    if (summary) {
      setTimeout(() => { summary.innerHTML = '<span class="gdot"></span> 2 running'; }, 350);
    }
  }, { once: true });
})();

// ========== SCROLL-LINKED PARALLAX ==========
if (window.matchMedia('(min-width: 751px)').matches) {
  const popover = document.querySelector('.popover-mock');
  const installCol = document.querySelector('.install-col');
  const demoSection = document.querySelector('.demo-section');
  if (popover && demoSection) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = demoSection.getBoundingClientRect();
        const center = window.innerHeight / 2;
        const offset = (rect.top + rect.height / 2 - center) / window.innerHeight;
        const shift = Math.max(-15, Math.min(15, offset * 30));
        // Only apply if popover has finished its entrance
        if (popover.classList.contains('in')) {
          popover.style.transform = `translateY(${shift}px) scale(1)`;
          if (installCol && installCol.classList.contains('in')) {
            installCol.style.transform = `translateY(${-shift * 0.5}px)`;
          }
        }
        ticking = false;
      });
    });
  }
}


// ========== SCROLL REVEAL ==========
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
