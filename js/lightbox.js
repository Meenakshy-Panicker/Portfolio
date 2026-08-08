(function () {
  const dialog = document.getElementById("lightbox");
  if (!dialog) return;

  const image = document.getElementById("lightboxImage");
  const captionWrap = document.getElementById("lightboxCaption");
  const captionCategory = document.getElementById("lightboxCaptionCategory");
  const captionTitle = document.getElementById("lightboxCaptionTitle");
  const captionText = document.getElementById("lightboxCaptionText");
  const closeBtn = document.getElementById("lightboxClose");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");

  // The lightbox is shared across every gallery on the page (Snapshots
  // marquee, each project modal's photo strip); whichever one was clicked
  // becomes the active set, so prev/next only steps through its own photos.
  let activeTiles = [];
  let currentIndex = 0;
  let lastFocused = null;

  function show(index) {
    if (!activeTiles.length) return;
    currentIndex = (index + activeTiles.length) % activeTiles.length;
    const item = activeTiles[currentIndex];
    const img = item.querySelector("img");
    image.src = img.currentSrc || img.src;
    image.alt = img.alt;

    // Project-gallery tiles carry no caption data — collapse the whole
    // panel rather than show an empty bordered column next to the photo.
    const hasCaption = Boolean(item.dataset.category || item.dataset.title || item.dataset.caption);
    captionWrap.hidden = !hasCaption;
    captionCategory.textContent = item.dataset.category || "";
    captionTitle.textContent = item.dataset.title || "";
    captionText.textContent = item.dataset.caption || "";

    const multi = activeTiles.length > 1;
    prevBtn.hidden = !multi;
    nextBtn.hidden = !multi;
  }

  function open(tiles, index) {
    activeTiles = tiles;
    lastFocused = document.activeElement;
    show(index);
    dialog.showModal();
    document.body.style.overflow = "hidden";
    if (window.cursorMountIn) window.cursorMountIn(dialog);
    closeBtn.focus();
  }

  function close() {
    dialog.close();
    // The lightbox can be opened from inside an already-open project modal
    // (dialog.close() above already dropped its own [open] attribute, so
    // this only matches a dialog still underneath, if any). Native <dialog>
    // content paints in the browser's top layer — handing the cursor back
    // to <body> while that modal is still up leaves it stuck behind the
    // modal's own top-layer stacking, i.e. invisible. Re-parent into the
    // still-open dialog instead, and leave its overflow lock alone.
    const stillOpenDialog = document.querySelector("dialog[open]");
    if (stillOpenDialog) {
      if (window.cursorMountIn) window.cursorMountIn(stillOpenDialog);
    } else {
      document.body.style.overflow = "";
      if (window.cursorMountInBody) window.cursorMountInBody();
    }
    if (lastFocused) lastFocused.focus();
  }

  // ---------------------------- Snapshots marquee ----------------------------

  const gallery = document.getElementById("creativeGallery");
  if (gallery) {
    // The marquee shows each photo two or three times over (creative-marquee.js
    // clones the row for a seamless loop), so every visual copy needs to open
    // the lightbox — but prev/next should still step through the underlying
    // set once, not cycle through every duplicate. `data-gallery-index` is the
    // same on every copy of a given photo; `canonical` keeps just the first
    // occurrence of each index as the definitive source for image/caption data.
    const tiles = Array.from(gallery.querySelectorAll("[data-gallery-item]"));
    const canonical = [];
    tiles.forEach((tile) => {
      const idx = Number(tile.dataset.galleryIndex);
      if (Number.isNaN(idx) || canonical[idx]) return;
      canonical[idx] = tile;
    });
    const creativeTiles = canonical.filter(Boolean);

    // js/creative-marquee.js runs first (see script order in index.html) and
    // clones the tiles synchronously, so by the time this executes the DOM
    // already has its final set of tiles — no async coordination needed. It
    // also grants role/tabindex only to the originals, so every copy (clone
    // or not) just needs its click/keydown wired to the canonical index.
    tiles.forEach((tile) => {
      const idx = Number(tile.dataset.galleryIndex);
      if (Number.isNaN(idx)) return;
      tile.addEventListener("click", () => open(creativeTiles, idx));
      tile.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(creativeTiles, idx);
        }
      });
    });
  }

  // ---------------------------- Project modal galleries ----------------------------

  // Each project's `.modal-gallery` is its own independent set of photos —
  // clicking one expands it in place (cursor + hover handled in CSS), and
  // prev/next cycles only within that project, not across every project.
  document.querySelectorAll(".modal-gallery").forEach((modalGallery) => {
    const tiles = Array.from(modalGallery.querySelectorAll(".media"));
    tiles.forEach((tile, i) => {
      const img = tile.querySelector("img");
      tile.tabIndex = 0;
      tile.setAttribute("role", "button");
      tile.setAttribute("aria-label", img && img.alt ? `Expand image: ${img.alt}` : "Expand image");
      tile.addEventListener("click", () => open(tiles, i));
      tile.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(tiles, i);
        }
      });
    });
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", () => show(currentIndex - 1));
  nextBtn.addEventListener("click", () => show(currentIndex + 1));

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });

  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });

  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(currentIndex - 1);
    if (e.key === "ArrowRight") show(currentIndex + 1);
  });
})();
