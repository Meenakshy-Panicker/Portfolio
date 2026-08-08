(function () {
  function showPlaceholder(img) {
    const wrapper = img.closest(".media") || img.parentElement;
    if (!wrapper || wrapper.querySelector(".media-placeholder")) return;

    const placeholder = document.createElement("div");
    placeholder.className = "media-placeholder";
    const label = document.createElement("span");
    label.textContent = img.dataset.label || "Image pending";
    placeholder.appendChild(label);

    img.style.display = "none";
    wrapper.appendChild(placeholder);
  }

  document.querySelectorAll("img.js-asset").forEach((img) => {
    img.loading = "lazy";
    img.decoding = "async";

    // Images can fail before this deferred script attaches its listener.
    if (img.complete && img.naturalWidth === 0) {
      showPlaceholder(img);
      return;
    }

    img.addEventListener("error", () => showPlaceholder(img), { once: true });
  });
})();
