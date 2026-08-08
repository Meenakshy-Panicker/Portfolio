(function () {
  const canvas = document.getElementById("heroParticles");
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const ctx = canvas.getContext("2d");
  const hero = canvas.closest(".hero");
  const COUNT = 28;
  const COLORS = ["168, 85, 247", "236, 72, 153"];
  let particles = [];
  let width = 0;
  let height = 0;
  let raf = null;

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = canvas.width = rect.width;
    height = canvas.height = rect.height;
  }

  function makeParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 0.06,
      vy: -0.05 - Math.random() * 0.1,
      o: 0.03 + Math.random() * 0.12,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, makeParticle);
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
