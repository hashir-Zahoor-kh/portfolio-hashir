// Stage 1 — Ken Burns on background only
gsap.registerPlugin(ScrollTrigger);

// Ken Burns: slow scale pulse on background image
gsap.to('.bg-image', {
  scale: 1.05,
  duration: 30,
  ease: 'none',
  yoyo: true,
  repeat: -1,
});
