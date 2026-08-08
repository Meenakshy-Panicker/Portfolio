(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  if (isCoarsePointer) return; // fully disabled on touch — no wasted computation

  const glow = document.getElementById("cursorGlow");
  const dot = document.getElementById("cursorDot");
  const trail = document.getElementById("cursorTrail");
  const label = document.getElementById("cursorLabel");
  const comet = document.getElementById("cursorComet");
  const ctx = comet.getContext("2d");

  document.documentElement.classList.add("has-custom-cursor");

  // A native <dialog> opened via showModal() renders in the browser's "top
  // layer", which always paints above the entire normal-layer document —
  // no z-index in the regular document can beat that. To keep the cursor
  // visible while a modal/lightbox is open, re-parent its elements into the
  // open dialog (so they're part of its own top-layer stacking context) and
  // move them back to <body> when it closes.
  function mountCursorIn(container) {
    [glow, comet, trail, dot, label].forEach((el) => container.appendChild(el));
  }
  function mountCursorInBody() {
    mountCursorIn(document.body);
  }
  window.cursorMountIn = mountCursorIn;
  window.cursorMountInBody = mountCursorInBody;

  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const trailPos = { ...pointer };
  const magneticTargets = Array.from(document.querySelectorAll(".magnetic, .nav-links a, .nav-logo"));
  const haloTargets = document.querySelectorAll(".project-card, .creative-item, .award-card, [data-gallery-item], .modal-gallery .media");
  const projectCards = document.querySelectorAll(".project-card");
  const RADIUS = 60;

  // Comet trail — a chain of points where each one eases toward the point
  // ahead of it (follow-the-leader), not a raw per-frame position log. That
  // keeps every point's motion itself smoothed, so fast mouse moves taper
  // into a continuous ribbon instead of jumping between stepped snapshots.
  const TRAIL_LENGTH = 10;
  const trailChain = Array.from({ length: TRAIL_LENGTH }, () => ({ x: pointer.x, y: pointer.y }));
  let dpr = window.devicePixelRatio || 1;

  function resizeComet() {
    dpr = window.devicePixelRatio || 1;
    comet.width = window.innerWidth * dpr;
    comet.height = window.innerHeight * dpr;
    comet.style.width = `${window.innerWidth}px`;
    comet.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeComet();
  window.addEventListener("resize", resizeComet);

  let hoveringProject = false;
  let started = false;
  let magnetOffset = { x: 0, y: 0 };

  function showCursors() {
    if (started) return;
    started = true;
    dot.classList.add("is-visible");
    comet.classList.add("is-visible");
  }

  function applyMagnetism(clientX, clientY) {
    if (prefersReducedMotion) return { x: 0, y: 0 };
    let strongest = { x: 0, y: 0, weight: 0 };

    magneticTargets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist < RADIUS) {
        const pull = (1 - dist / RADIUS) * 0.35;
        el.style.transform = `translate(${dx * pull}px, ${dy * pull}px)`;
        if (pull > strongest.weight) {
          strongest = { x: -dx * pull * 0.4, y: -dy * pull * 0.4, weight: pull };
        }
      } else {
        el.style.transform = "translate(0, 0)";
      }
    });

    return { x: strongest.x, y: strongest.y };
  }

  // Raw pointer events only record the latest position — no DOM reads/writes
  // here, so a high-frequency mouse can't trigger layout work per event.
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      showCursors();
      glow.classList.add("is-active");
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", () => glow.classList.remove("is-active"));

  // Single rAF loop drives every cursor read/write once per frame: magnetism
  // (getBoundingClientRect reads, then transform writes), the dot, and the
  // trailing glow lerp. Consolidating avoids the layout thrashing that comes
  // from recomputing element rects on every raw pointermove.
  function tick() {
    document.documentElement.style.setProperty("--x", `${pointer.x}px`);
    document.documentElement.style.setProperty("--y", `${pointer.y}px`);

    magnetOffset = applyMagnetism(pointer.x, pointer.y);

    const dotX = pointer.x + magnetOffset.x;
    const dotY = pointer.y + magnetOffset.y;
    dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
    if (hoveringProject) {
      label.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
    }

    if (prefersReducedMotion) {
      trailPos.x = dotX;
      trailPos.y = dotY;
    } else {
      trailPos.x += (dotX - trailPos.x) * 0.15;
      trailPos.y += (dotY - trailPos.y) * 0.15;

      // Head eases toward the cursor; every link behind it eases toward the
      // link ahead. Higher ease = tighter/faster follow, so the chain tapers
      // out smoothly instead of a hard step from one frame to the next.
      trailChain[0].x += (dotX - trailChain[0].x) * 0.55;
      trailChain[0].y += (dotY - trailChain[0].y) * 0.55;
      for (let i = 1; i < trailChain.length; i++) {
        trailChain[i].x += (trailChain[i - 1].x - trailChain[i].x) * 0.45;
        trailChain[i].y += (trailChain[i - 1].y - trailChain[i].y) * 0.45;
      }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = trailChain.length - 1; i >= 0; i--) {
        const t = 1 - i / (trailChain.length - 1); // 0 → tail, 1 → head
        const { x, y } = trailChain[i];
        const radius = 2 + t * 9;
        const alpha = t * t * 0.4;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(236, 72, 153, ${alpha})`);
        gradient.addColorStop(0.6, `rgba(168, 85, 247, ${alpha * 0.6})`);
        gradient.addColorStop(1, "rgba(168, 85, 247, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Ring halo (hover state) still rides the smoothed trailPos.
    trail.style.transform = `translate(${trailPos.x}px, ${trailPos.y}px) translate(-50%, -50%)`;

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Hover halo — project cards, gallery images, lightbox triggers.
  haloTargets.forEach((el) => {
    el.addEventListener("pointerenter", () => trail.classList.add("is-ring"));
    el.addEventListener("pointerleave", () => trail.classList.remove("is-ring"));
  });

  // Project card label morph — "View Project" pill replaces the dot.
  projectCards.forEach((el) => {
    el.addEventListener("pointerenter", () => {
      hoveringProject = true;
      dot.classList.add("is-hidden-for-label");
      label.classList.add("is-visible");
    });
    el.addEventListener("pointerleave", () => {
      hoveringProject = false;
      dot.classList.remove("is-hidden-for-label");
      label.classList.remove("is-visible");
    });
  });
})();
