(function () {
  const triggers = document.querySelectorAll("[data-modal-target]");
  let lastFocused = null;

  function openModal(dialog) {
    lastFocused = document.activeElement;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    if (window.cursorMountIn) window.cursorMountIn(dialog);
    const closeBtn = dialog.querySelector("[data-modal-close]");
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(dialog) {
    dialog.close();
    document.body.style.overflow = "";
    if (window.cursorMountInBody) window.cursorMountInBody();
    if (lastFocused) lastFocused.focus();
  }

  triggers.forEach((trigger) => {
    const dialog = document.getElementById(trigger.dataset.modalTarget);
    if (!dialog) return;

    const open = (e) => {
      if (e.target.closest("a[href]")) return;
      openModal(dialog);
    };
    trigger.addEventListener("click", open);
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });

    dialog.querySelectorAll("[data-modal-close]").forEach((btn) => {
      btn.addEventListener("click", () => closeModal(dialog));
    });

    // Clicking the backdrop fires a click with target === dialog itself;
    // clicking any actual content targets that descendant instead. Checking
    // identity (rather than re-measuring .modal-inner's rect, which can read
    // back as 0×0 if this fires after the close button already closed the
    // dialog mid-bubble) avoids a redundant/fragile second close call.
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) closeModal(dialog);
    });

    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      closeModal(dialog);
    });
  });
})();
