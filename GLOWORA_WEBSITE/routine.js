/* GLOWORA Routine Guide interactions */
document.addEventListener("DOMContentLoaded", function () {
  const page = document.querySelector(".routine-page");
  if (!page) return;

  // Keep the current page visibly active in desktop and mobile navigation.
  const currentPath = window.location.pathname.replace(/\/$/, "");
  document.querySelectorAll(".nav-links a, .mobile-nav-links a").forEach(function (link) {
    const target = new URL(link.href, window.location.href);
    const targetPath = target.pathname.replace(/\/$/, "");
    const isCurrent = currentPath === targetPath && !target.hash;
    link.classList.toggle("active", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  // Add a gentle entrance animation only when motion is allowed.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion) page.classList.add("motion-ready");

  // Make routine section links scroll smoothly without jumping under the header.
  document.querySelectorAll('.routine-page a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });
});
