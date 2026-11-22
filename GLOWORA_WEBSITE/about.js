document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".nav-links a, .mobile-nav-links a").forEach(function (link) {
    const target = new URL(link.href, window.location.href);
    const current = window.location.pathname.replace(/\/$/, "");
    const isActive = target.pathname.replace(/\/$/, "") === current && !target.hash;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
  });
});
