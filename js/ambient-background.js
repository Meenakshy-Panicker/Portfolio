(function () {
  // ==========================================================================
  // Ambient Background — layered "lava lamp" / nebula gradient-mesh blobs.
  //
  // Many small-to-medium blobs instead of a few huge ones — at the previous
  // giant sizes, the drift/morph motion was covering such a small fraction
  // of each blob's own footprint that it read as static. Smaller blobs make
  // the same (or gentler) motion actually legible, and letting many of them
  // overlap with `mix-blend-mode: screen` is what produces the "evolving
  // gradient" nebula look rather than a handful of obviously separate shapes.
  //
  // Three depth layers (background/middle/foreground), each with its own
  // size/opacity/blur/speed range; blobs within a layer are procedurally
  // varied (not hand-tuned individually) since the ask here is variety and
  // count, not bespoke placement per element like earlier passes.
  // ==========================================================================

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Palette restricted to colors already used elsewhere on the site,
  // including the pink accent for the "magenta / soft pink highlight" ask.
  const COLORS = ["#A855F7", "#8B5CF6", "#7C3AED", "#C084FC", "#EC4899"];

  const LAYERS = [
    { name: "background", count: 4, size: [320, 460], opacity: [0.035, 0.06], blur: [90, 130], duration: [46, 60], amplitude: [30, 55], parallax: [0.05, 0.12], hideOnMobileChance: 0 },
    { name: "middle", count: 5, size: [160, 280], opacity: [0.05, 0.08], blur: [55, 85], duration: [30, 45], amplitude: [45, 75], parallax: [0.15, 0.28], hideOnMobileChance: 0.4 },
    { name: "foreground", count: 3, size: [70, 140], opacity: [0.06, 0.09], blur: [30, 50], duration: [20, 30], amplitude: [55, 90], parallax: [0.3, 0.45], hideOnMobileChance: 0.65 },
  ];

  const TOTAL = LAYERS.reduce((sum, l) => sum + l.count, 0);

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pick(arr, exclude) {
    let choice;
    do {
      choice = arr[Math.floor(Math.random() * arr.length)];
    } while (choice === exclude && arr.length > 1);
    return choice;
  }

  // Stratified grid + jitter so blobs spread across the viewport instead of
  // clustering — a 4x3 grid of cells (12 slots) covers TOTAL blobs, shuffled
  // so layer order doesn't correlate with position.
  function generatePositions(count) {
    const cols = 4;
    const rows = Math.ceil(count / cols);
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) cells.push([c, r]);
    }
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    const cellW = 100 / cols;
    const cellH = 100 / rows;
    return cells.slice(0, count).map(([c, r]) => ({
      top: `${(r * cellH + rand(-6, cellH * 0.5)).toFixed(1)}%`,
      left: `${(c * cellW + rand(-6, cellW * 0.5)).toFixed(1)}%`,
    }));
  }

  const positions = generatePositions(TOTAL);
  const MORPHS = ["a", "b", "c"];

  function buildBlobConfigs() {
    const configs = [];
    let posIndex = 0;
    LAYERS.forEach((layer) => {
      for (let i = 0; i < layer.count; i++) {
        const duration = rand(...layer.duration);
        const color = pick(COLORS);
        const sign = () => (Math.random() < 0.5 ? -1 : 1);
        configs.push({
          size: rand(...layer.size),
          opacity: rand(...layer.opacity),
          blur: rand(...layer.blur),
          color,
          colorSecondary: pick(COLORS, color),
          pos: positions[posIndex++],
          duration,
          driftDelay: -rand(0, duration),
          morphDelay: -rand(0, duration),
          breatheDuration: rand(8, 16),
          breatheDelay: -rand(0, 16),
          tx: rand(...layer.amplitude) * sign(),
          ty: rand(...layer.amplitude) * sign(),
          rot: rand(2, 6) * sign(),
          morph: pick(MORPHS),
          parallax: rand(...layer.parallax),
          hideOnMobile: Math.random() < layer.hideOnMobileChance,
        });
      }
    });
    return configs;
  }

  function buildBlob(config) {
    const parallax = document.createElement("div");
    parallax.className = "lava-blob-parallax";
    if (config.hideOnMobile) parallax.dataset.hideMobile = "true";
    Object.assign(parallax.style, {
      width: `${config.size.toFixed(0)}px`,
      height: `${config.size.toFixed(0)}px`,
      top: config.pos.top,
      left: config.pos.left,
    });

    const drift = document.createElement("div");
    drift.className = "lava-blob-drift";
    drift.style.setProperty("--blob-duration", `${config.duration.toFixed(1)}s`);
    drift.style.setProperty("--blob-drift-delay", `${config.driftDelay.toFixed(1)}s`);
    drift.style.setProperty("--blob-tx", `${config.tx.toFixed(0)}px`);
    drift.style.setProperty("--blob-ty", `${config.ty.toFixed(0)}px`);
    drift.style.setProperty("--blob-rot", `${config.rot.toFixed(1)}deg`);

    const morph = document.createElement("div");
    morph.className = "lava-blob-morph";
    morph.dataset.morph = config.morph;
    morph.style.setProperty("--blob-duration", `${config.duration.toFixed(1)}s`);
    morph.style.setProperty("--blob-morph-delay", `${config.morphDelay.toFixed(1)}s`);

    const glow = document.createElement("div");
    glow.className = "lava-blob-glow";
    glow.style.setProperty("--blob-color", config.color);
    glow.style.setProperty("--blob-color-2", config.colorSecondary);
    glow.style.setProperty("--blob-opacity", config.opacity.toFixed(3));
    glow.style.setProperty("--blob-blur", `${config.blur.toFixed(0)}px`);
    glow.style.setProperty("--breathe-duration", `${config.breatheDuration.toFixed(1)}s`);
    glow.style.setProperty("--breathe-delay", `${config.breatheDelay.toFixed(1)}s`);

    morph.appendChild(glow);
    drift.appendChild(morph);
    parallax.appendChild(drift);
    return parallax;
  }

  const container = document.createElement("div");
  container.className = "ambient-bg";
  container.setAttribute("aria-hidden", "true");

  const parallaxState = buildBlobConfigs().map((config) => {
    const el = buildBlob(config);
    container.appendChild(el);
    return { el, strength: config.parallax, x: 0, y: 0 };
  });

  document.body.prepend(container);

  if (prefersReducedMotion) return; // static blobs only — no motion, no listeners

  // Same raw-event/single-rAF-loop pattern as cursor.js: pointermove only
  // ever records the latest position, all DOM writes happen once per frame.
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    },
    { passive: true }
  );

  const MAX_DRIFT = 32; // px, scaled per-blob by `strength`

  function tick() {
    const nx = (pointer.x / window.innerWidth) * 2 - 1; // -1..1
    const ny = (pointer.y / window.innerHeight) * 2 - 1;

    parallaxState.forEach((blob) => {
      const targetX = nx * MAX_DRIFT * blob.strength;
      const targetY = ny * MAX_DRIFT * blob.strength;
      // Heavy damping — the blob never catches up to the target, only ever
      // eases a little closer each frame, so it reads as ambient, not magnetic.
      blob.x += (targetX - blob.x) * 0.015;
      blob.y += (targetY - blob.y) * 0.015;
      blob.el.style.transform = `translate3d(${blob.x.toFixed(2)}px, ${blob.y.toFixed(2)}px, 0)`;
    });

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
