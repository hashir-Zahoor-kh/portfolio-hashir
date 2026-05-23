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
  const card  = document.getElementById('card');
  const svg   = card.querySelector('.card-border');
  const outer = card.querySelector('.border-outer');
  const inner = card.querySelector('.border-inner');
  const w = card.offsetWidth;
  const h = card.offsetHeight;

  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  outer.setAttribute('x', '1');        outer.setAttribute('y', '1');
  outer.setAttribute('width', w - 2);  outer.setAttribute('height', h - 2);
  inner.setAttribute('x', '9');        inner.setAttribute('y', '9');
  inner.setAttribute('width', w - 18); inner.setAttribute('height', h - 18);
}

window.addEventListener('resize', fitCardBorder);

// ── Typing animation ─────────────────────────────────────────────
(function initTyping() {
  const phrases = [
    'Distributed Systems Engineer',
    'Infrastructure Engineer',
    'Cloud-Native Builder',
    'Software Engineer',
  ];
  const el = document.getElementById('typing-text');
  let pi = 0, ci = 0, deleting = false;

  function tick() {
    const phrase = phrases[pi];
    el.textContent = deleting ? phrase.slice(0, --ci) : phrase.slice(0, ++ci);

    let delay = deleting ? 45 : 88;
    if (!deleting && ci === phrase.length)  { delay = 1900; deleting = true; }
    else if (deleting && ci === 0)          { deleting = false; pi = (pi + 1) % phrases.length; delay = 380; }
    setTimeout(tick, delay);
  }
  tick();
})();

// ── Intro sequence ───────────────────────────────────────────────
document.fonts.ready.then(() => {
  fitCardBorder();

  const overlay  = document.getElementById('intro-overlay');
  const outer    = document.querySelector('.border-outer');
  const inner    = document.querySelector('.border-inner');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const alreadyPlayed = sessionStorage.getItem('hz-intro-played');

  // Prepare SVG border for draw animation
  const outerLen = outer.getTotalLength();
  const innerLen = inner.getTotalLength();
  gsap.set(outer, { strokeDasharray: outerLen, strokeDashoffset: outerLen });
  gsap.set(inner, { strokeDasharray: innerLen, strokeDashoffset: innerLen });

  function drawBorder() {
    gsap.to(outer, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' });
    gsap.to(inner, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', delay: 0.13 });
  }

  // Skip intro entirely
  if (reducedMotion || alreadyPlayed) {
    overlay.style.display = 'none';
    gsap.set('#card', { opacity: 1, y: 0 });
    gsap.set([outer, inner], { strokeDashoffset: 0 });
    return;
  }

  // Card hidden until intro resolves
  gsap.set('#card', { opacity: 0, y: 24 });

  // Build narrative timeline
  let tl;

  function skip() {
    if (tl) tl.kill();
    overlay.style.display = 'none';
    gsap.set('#card', { opacity: 1, y: 0 });
    gsap.set([outer, inner], { strokeDashoffset: 0 });
    sessionStorage.setItem('hz-intro-played', '1');
  }

  overlay.addEventListener('click', skip);
  window.addEventListener('keydown', skip, { once: true });

  tl = gsap.timeline({
    onComplete() {
      sessionStorage.setItem('hz-intro-played', '1');
      overlay.removeEventListener('click', skip);
    },
  });

  const lines = document.querySelectorAll('.intro-line');

  lines.forEach((line, i) => {
    const isLast = i === lines.length - 1;

    // Fade up in
    tl.fromTo(line,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.42, ease: 'power2.out' }
    );

    // Hold, then fade out
    tl.to(line,
      { opacity: 0, duration: 0.22, ease: 'power2.in' },
      isLast ? '+=0.78' : '+=0.42'
    );
  });

  // Wipe overlay upward
  tl.to(overlay, {
    yPercent: -100,
    duration: 1.2,
    ease: 'power3.inOut',
    onComplete: () => { overlay.style.display = 'none'; },
  }, '+=0.06');

  // Card entrance — overlaps with wipe
  tl.to('#card', {
    opacity: 1,
    y: 0,
    duration: 0.88,
    ease: 'power3.out',
    onComplete: drawBorder,
  }, '-=0.52');
});
