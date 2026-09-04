/* ==========================================================================
   Ambient background behaviour

   Layer 3 — a slow drift of tiny particles across a fixed, full-viewport canvas
   Layer 5 — a very slow parallax nudge (1–3% of scroll) on the network SVG

   Both are skipped entirely when the visitor prefers reduced motion.
   ========================================================================== */
(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  /* ---------------------------------------------------------------- Layer 5 */
  const network = document.querySelector(".site-bg__network");
  if (network) {
    let latestY = window.scrollY || 0;
    let scrollRaf = null;

    const applyParallax = () => {
      scrollRaf = null;
      // ~2% of the scroll distance — a barely-there drift — capped so the
      // oversized SVG never slides an edge into view on a long page.
      const shift = Math.min(latestY * 0.02, 72);
      network.style.transform = `translate3d(0, ${(-shift).toFixed(2)}px, 0)`;
    };

    window.addEventListener(
      "scroll",
      () => {
        latestY = window.scrollY || 0;
        if (scrollRaf === null) scrollRaf = requestAnimationFrame(applyParallax);
      },
      { passive: true }
    );
  }

  /* ---------------------------------------------------------------- Layer 3 */
  const canvas = document.getElementById("ambientParticles");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const COLORS = ["168, 85, 247", "236, 72, 153", "194, 102, 240"];
  let particles = [];
  let width = 0;
  let height = 0;
  let raf = null;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function makeParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.5 + Math.random() * 1.3,
      vx: (Math.random() - 0.5) * 0.05,
      vy: -0.03 - Math.random() * 0.06,
      o: 0.02 + Math.random() * 0.07,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  function init() {
    resize();
    const count = Math.round(Math.min(46, Math.max(18, (width * height) / 46000)));
    particles = Array.from({ length: count }, makeParticle);
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.o})`;
      ctx.fill();
    });
    raf = requestAnimationFrame(tick);
  }

  init();
  tick();

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 200);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    } else if (!raf) {
      tick();
    }
  });
})();
