(function () {
  // ==========================================================================
  // Creative Practice marquee — clones the row for a seamless CSS loop.
  //
  // Runs before js/lightbox.js (see script order in index.html) so that by
  // the time lightbox.js queries the gallery, the DOM already has its final
  // set of tiles (original + clones) — no async coordination needed between
  // the two scripts.
  //
  // The actual scrolling is pure CSS (`animation` + `transform: translateX`,
  // paused via `animation-play-state` on hover) — this script only ever
  // touches the DOM once, synchronously, at load: cloning tiles and wiring
  // up drag-to-scroll for the reduced-motion fallback.
  // ==========================================================================

  const marquee = document.getElementById("creativeGallery");
  const track = document.getElementById("creativeTrack");
  if (!marquee || !track) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const originals = Array.from(track.children);

  // Accessible, keyboard-focusable content lives only on the originals.
  // Clicking/tapping a cloned tile still opens the lightbox (lightbox.js
  // binds every tile), but clones are hidden from the accessibility tree
  // and skipped in tab order so screen reader / keyboard users don't hit
  // the same eight photos two or three times over.
  originals.forEach((item) => {
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
  });

  if (prefersReducedMotion) {
    // Static, single set — no loop to fake, so no clones. Native
    // overflow-x covers touch/trackpad swipe; add drag-to-scroll so a
    // mouse can pan the row too.
    marquee.classList.add("is-static");

    let isDown = false;
    let startX = 0;
    let startScroll = 0;

    marquee.addEventListener("pointerdown", (e) => {
      isDown = true;
      startX = e.clientX;
      startScroll = marquee.scrollLeft;
      marquee.classList.add("is-dragging");
    });
    window.addEventListener("pointerup", () => {
      isDown = false;
      marquee.classList.remove("is-dragging");
    });
    window.addEventListener("pointercancel", () => {
      isDown = false;
      marquee.classList.remove("is-dragging");
    });
    window.addEventListener("pointermove", (e) => {
      if (!isDown) return;
      marquee.scrollLeft = startScroll - (e.clientX - startX);
    });
    return;
  }

  // Two extra copies (three total) rather than the usual two — enough
  // margin that the loop stays seamless even on viewports wider than one
  // full set of photos.
  for (let copy = 0; copy < 2; copy++) {
    originals.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.removeAttribute("role");
      clone.removeAttribute("tabindex");
      track.appendChild(clone);
    });
  }
})();
