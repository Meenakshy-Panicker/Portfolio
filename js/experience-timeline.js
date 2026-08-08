(function () {
  const wrap = document.querySelector(".exp-wrap");
  if (!wrap) return;

  const timeline = document.getElementById("expTimeline");
  const items = Array.from(document.querySelectorAll(".exp-item"));
  const highlight = document.getElementById("expBeamHighlight");
  const canvas = document.getElementById("expParticles");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hoverCapable = window.matchMedia("(hover: hover)").matches;

  // ------------------------------------------------------------------
  // Popups start as children of their .exp-item (readable/maintainable in
  // the HTML source, right next to the milestone they belong to) but get
  // reparented to <body> here — a real portal, the same trick modal.js and
  // cursor.js already use elsewhere on this site. Once on <body>, a popup
  // can never be clipped by .exp-wrap's `overflow: hidden`, no matter how
  // it's positioned.
  // ------------------------------------------------------------------
  const milestones = items.map((item) => {
    const trigger = item.querySelector(".exp-trigger");
    const popup = item.querySelector(".exp-popup");
    document.body.appendChild(popup);
    return { item, trigger, popup, side: item.dataset.side };
  });

  function positionHighlight(item) {
    const node = item.querySelector(".exp-node");
    const timelineRect = timeline.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const centerY = nodeRect.top - timelineRect.top + nodeRect.height / 2;
    highlight.style.setProperty("--beam-y", `${centerY}px`);
    highlight.classList.add("is-visible");
  }

  // "Left-side milestones open further left, right-side further right;
  // near the top shift down, near the bottom shift up." Whether there's
  // room to open beside the trigger is checked against the trigger's
  // actual position, not a guessed viewport-width breakpoint — a centered
  // ~880px timeline on a 1280px+ screen can easily leave less side margin
  // than the popup needs, so a fixed breakpoint alone isn't reliable.
  const EDGE_MARGIN = 16;
  const SIDE_GAP = 28;

  function positionPopup(m) {
    const triggerRect = m.trigger.getBoundingClientRect();
    const popupWidth = m.popup.offsetWidth;
    const popupHeight = m.popup.offsetHeight;
    const needed = popupWidth + SIDE_GAP + EDGE_MARGIN;

    const spaceOnSide = m.side === "left" ? triggerRect.left : window.innerWidth - triggerRect.right;
    const canOpenBeside = spaceOnSide >= needed;

    let left;
    let top;

    if (canOpenBeside) {
      left = m.side === "left" ? triggerRect.left - SIDE_GAP - popupWidth : triggerRect.right + SIDE_GAP;
      top = triggerRect.top + triggerRect.height / 2 - popupHeight / 2;
    } else {
      // Not enough room beside the trigger — fall back to centered,
      // below/above instead, whichever direction actually has the room.
      left = (window.innerWidth - popupWidth) / 2;
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      top = spaceBelow >= popupHeight + 24 || spaceBelow >= spaceAbove ? triggerRect.bottom + 16 : triggerRect.top - popupHeight - 16;
    }

    left = Math.max(EDGE_MARGIN, Math.min(left, window.innerWidth - popupWidth - EDGE_MARGIN));
    top = Math.max(EDGE_MARGIN, Math.min(top, window.innerHeight - popupHeight - EDGE_MARGIN));

    m.popup.style.left = `${left}px`;
    m.popup.style.top = `${top}px`;
  }

  let openMilestone = null;

  function open(m) {
    if (openMilestone === m) return;
    if (openMilestone) close(openMilestone);

    openMilestone = m;
    m.item.classList.add("is-active");
    timeline.classList.add("has-active");
    m.trigger.setAttribute("aria-expanded", "true");
    positionPopup(m);
    positionHighlight(m.item);
    m.popup.classList.add("is-visible");
  }

  function close(m) {
    m.item.classList.remove("is-active");
    m.trigger.setAttribute("aria-expanded", "false");
    m.popup.classList.remove("is-visible");
    if (openMilestone === m) {
      openMilestone = null;
      timeline.classList.remove("has-active");
      highlight.classList.remove("is-visible");
    }
  }

  milestones.forEach((m) => {
    m.trigger.addEventListener("click", () => {
      if (openMilestone === m) close(m);
      else open(m);
    });
    m.trigger.addEventListener("focus", () => open(m));
    m.trigger.addEventListener("blur", () => close(m));

    if (hoverCapable) {
      m.item.addEventListener("pointerenter", () => open(m));
      m.item.addEventListener("pointerleave", () => {
        if (openMilestone === m) close(m);
      });
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openMilestone) {
      const trigger = openMilestone.trigger;
      close(openMilestone);
      trigger.blur();
    }
  });

  document.addEventListener("click", (e) => {
    if (!openMilestone) return;
    if (openMilestone.item.contains(e.target) || openMilestone.popup.contains(e.target)) return;
    close(openMilestone);
  });

  // A fixed-position popup doesn't track its trigger on scroll by itself —
  // keep it glued to the milestone while open.
  let repositionQueued = false;
  function queueReposition() {
    if (!openMilestone || repositionQueued) return;
    repositionQueued = true;
    requestAnimationFrame(() => {
      repositionQueued = false;
      if (openMilestone) positionPopup(openMilestone);
    });
  }
  window.addEventListener("scroll", queueReposition, { passive: true });
  window.addEventListener("resize", queueReposition, { passive: true });

  if (prefersReducedMotion || !canvas) return; // beam/popup CSS animations already no-op via the reduced-motion media query

  // ------------------------------------------------------------------
  // Ambient particles — slow, purely decorative, no cursor interaction.
  // Meant to sit quietly behind the content, not draw attention to itself.
  // ------------------------------------------------------------------
  const ctx = canvas.getContext("2d");
  const COUNT = 16;
  const COLORS = ["168, 85, 247", "139, 92, 246", "192, 132, 252"];
  let particles = [];
  let width = 0;
  let height = 0;

  function resizeCanvas() {
    const rect = wrap.getBoundingClientRect();
    width = canvas.width = rect.width;
    height = canvas.height = rect.height;
  }

  function makeParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.7 + Math.random() * 1.3,
      vy: -0.015 - Math.random() * 0.03,
      vx: (Math.random() - 0.5) * 0.015,
      o: 0.06 + Math.random() * 0.12,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  resizeCanvas();
  particles = Array.from({ length: COUNT }, makeParticle);

  function tick() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.y < -8) p.y = height + 8;
      if (p.x < -8) p.x = width + 8;
      if (p.x > width + 8) p.x = -8;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.o})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 200);
  });
})();
