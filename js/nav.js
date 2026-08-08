(function () {
  const nav = document.getElementById("siteNav");
  const navLinks = document.getElementById("navLinks");
  const navToggle = document.getElementById("navToggle");
  const backToTop = document.getElementById("backToTop");
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const links = Array.from(document.querySelectorAll("[data-nav]"));

  function onScroll() {
    const scrolled = window.scrollY > 24;
    nav.classList.toggle("is-scrolled", scrolled);
    backToTop.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.6);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
  }
})();
