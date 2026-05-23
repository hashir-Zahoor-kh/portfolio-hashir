gsap.registerPlugin(ScrollTrigger);

// ── Ken Burns on background ──────────────────────────────────────
gsap.to('.bg-image', {
  scale: 1.05,
  duration: 30,
  ease: 'none',
  yoyo: true,
  repeat: -1,
});

// ── SVG border — fit geometry to actual card dimensions ──────────
function fitCardBorder() {
  const card = document.getElementById('card');
  const svg  = card.querySelector('.card-border');
  const outer = card.querySelector('.border-outer');
  const inner = card.querySelector('.border-inner');
  const w = card.offsetWidth;
  const h = card.offsetHeight;

  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

  outer.setAttribute('x', '1');
  outer.setAttribute('y', '1');
  outer.setAttribute('width',  w - 2);
  outer.setAttribute('height', h - 2);

  inner.setAttribute('x', '9');
  inner.setAttribute('y', '9');
  inner.setAttribute('width',  w - 18);
  inner.setAttribute('height', h - 18);
}

document.fonts.ready.then(fitCardBorder);
window.addEventListener('resize', fitCardBorder);

// ── Typing animation ─────────────────────────────────────────────
(function initTyping() {
  const phrases = [
    'DevOps Engineer',
    'Platform Engineer',
    'Site Reliability Engineer',
    'Cloud-Native Builder',
  ];
  const el = document.getElementById('typing-text');
  let pi = 0, ci = 0, deleting = false;

  function tick() {
    const phrase = phrases[pi];

    if (deleting) {
      el.textContent = phrase.slice(0, --ci);
    } else {
      el.textContent = phrase.slice(0, ++ci);
    }

    let delay = deleting ? 45 : 88;

    if (!deleting && ci === phrase.length) {
      delay = 1900;
      deleting = true;
    } else if (deleting && ci === 0) {
      deleting = false;
      pi = (pi + 1) % phrases.length;
      delay = 380;
    }

    setTimeout(tick, delay);
  }

  tick();
})();
