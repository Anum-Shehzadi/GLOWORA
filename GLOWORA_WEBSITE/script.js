
function initCore() {

    /* =====================================
       1. COMMON ELEMENTS
    ===================================== */

    const header = document.querySelector(".site-header");
    const menuToggle = document.querySelector(".menu-toggle");
    const menuClose = document.querySelector(".menu-close");
    const mobileMenu = document.querySelector(".mobile-menu");
    const menuOverlay = document.querySelector(".menu-overlay");

    const panelOverlay = document.querySelector(".panel-overlay");
    const cartPanel = document.querySelector("#cart-panel");
    const accountPanel = document.querySelector("#account-panel");

    const panels = [cartPanel, accountPanel].filter(Boolean);
    const money = value =>
        "Rs. " + Number(value).toLocaleString("en-PK");

    let previousOverflow = "";
    let activePanel = null;

    /* =====================================
       2. HAMBURGER MENU
    ===================================== */

    function openMobileMenu() {
        if (!header || !mobileMenu || !menuToggle) return;
        if (!window.matchMedia("(max-width: 749px)").matches) return;

        closePanel(false);

        header.classList.add("menu-open");
        menuToggle.setAttribute("aria-expanded", "true");
        menuToggle.setAttribute("aria-label", "Close navigation menu");

        mobileMenu.setAttribute("aria-hidden", "false");
        mobileMenu.inert = false;

        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        menuClose?.focus();
    }

    function closeMobileMenu(returnFocus = true) {
        if (!header || !mobileMenu || !menuToggle) return;

        const wasOpen = header.classList.contains("menu-open");

        header.classList.remove("menu-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");

        mobileMenu.setAttribute("aria-hidden", "true");
        mobileMenu.inert = true;

        if (!activePanel) {
            document.body.style.overflow = previousOverflow;
        }

        if (
            returnFocus &&
            wasOpen &&
            window.matchMedia("(max-width: 749px)").matches
        ) {
            menuToggle.focus();
        }
    }

    menuToggle?.addEventListener("click", () => {
        header?.classList.contains("menu-open")
            ? closeMobileMenu()
            : openMobileMenu();
    });

    menuClose?.addEventListener("click", () => closeMobileMenu());
    menuOverlay?.addEventListener("click", () => closeMobileMenu());

    /* =====================================
       3. PRODUCT DATA FROM EXISTING CARDS
    ===================================== */

    function getOriginalCards() {
        return Array.from(document.querySelectorAll(".range-card"))
            .filter(card => !card.hasAttribute("data-cart-copy") && !card.hasAttribute("data-marquee-copy"))
            .filter(card => {
                const track = card.closest(".product-track");
                return !track || card.parentElement === track;
            });
    }

    function getProduct(card) {
        const name =
            card.querySelector(".range-image .product-hover h3")?.textContent.trim()
            || card.querySelector(".range-card > h3")?.textContent.trim()
            || card.querySelector(".image-title")?.textContent.trim()
            || "GLOWORA Product";

        const image = card.querySelector(".range-image img");

        const priceText = card.querySelector(".range-price")?.textContent || "";
        // Prices are displayed as whole PKR amounts (e.g. Rs. 1,850).
        const normalizedPrice = priceText.replace(/[^0-9]/g, "");
        const price = normalizedPrice ? Number(normalizedPrice) : NaN;
        const imageSrc = image?.getAttribute("src") || "";
        const imagePath = imageSrc
            ? new URL(imageSrc, window.location.href).pathname.toLowerCase()
            : "";
        const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const section = card.closest("section");

        return {
            id: `${slug}::${imagePath || "no-image"}`,
            name,
            image: imageSrc,
            alt: image?.getAttribute("alt") || name,
            price: Number.isFinite(price) ? price : 0,
            section
        };
    }

    function getCategory(card) {
        const product = getProduct(card);
        const name = product.name.toLowerCase();
        const section = product.section;

        if (
            section?.classList.contains("routine-sets-section") ||
            /\b(bundle|kit|set|starter kit)\b/i.test(name)
        ) {
            return "bundles";
        }

        if (
            /\b(serum|booster|ampoule)\b/i.test(name) ||
            section?.classList.contains("booster-section")
        ) {
            return "serums";
        }

        if (
            /\b(moisturizer|moisturiser|cream|lotion|hydrating balm)\b/i.test(name) ||
            section?.classList.contains("hydration-section") ||
            section?.classList.contains("anti-aging-section") ||
            section?.classList.contains("sensitive-section")
        ) {
            return "moisturizers";
        }

        return "face-care";
    }

    /* =====================================
       4. SEARCH AND CATEGORY FILTERING
    ===================================== */

    const searchForms = document.querySelectorAll(
        ".header-search, .mobile-search"
    );

    let currentSearch = "";
    let currentCategory = "all";

    const categoryLabels = {
        all: "Shop All",
        "face-care": "Face Care",
        serums: "Serums",
        moisturizers: "Moisturizers",
        bundles: "Bundles"
    };

    function ensureResultsMessage() {
        let message = document.querySelector(".search-results-message");

        if (!message) {
            message = document.createElement("p");
            message.className = "search-results-message";
            message.hidden = true;

            const firstSection = document.querySelector(
                ".product-range, .clear-skin-section, .range-section"
            );

            firstSection?.parentNode.insertBefore(message, firstSection);
        }

        return message;
    }

    function applyFilters({ updateURL = false } = {}) {
        const cards = getOriginalCards();
        let visibleCount = 0;
        const visibleSections = new Set();

        cards.forEach(card => {
            const product = getProduct(card);
            const category = getCategory(card);

            const searchableText = [
                product.name,
                product.alt,
                card.textContent,
                product.section?.id || "",
                product.section?.className || ""
            ].join(" ").toLowerCase();

            const matchesSearch =
                !currentSearch ||
                searchableText.includes(currentSearch);

            const matchesCategory =
                currentCategory === "all" ||
                category === currentCategory ||
                (
                    currentCategory === "face-care" &&
                    category !== "bundles"
                );

            const visible = matchesSearch && matchesCategory;

            card.classList.toggle("product-hidden", !visible);

            if (visible) {
                visibleCount++;
                if (product.section) {
                    visibleSections.add(product.section);
                }
            }
        });

        document.querySelectorAll(
            ".product-range, .clear-skin-section, .range-section"
        ).forEach(section => {
            const hasProducts = visibleSections.has(section);

            section.classList.toggle("product-hidden", !hasProducts);

            const heading = section.querySelector(".range-heading");
            if (heading) {
                heading.hidden = !hasProducts;
            }

            // When filtering, show only original cards.
            // Hide marquee copies to avoid duplicate search results.
            section.querySelectorAll(".product-track").forEach(track => {
                const filtering = Boolean(currentSearch) ||
                    currentCategory !== "all";

                track.classList.toggle("is-filtered", filtering);

                track.querySelectorAll('[data-marquee-copy="true"]')
                    .forEach(copy => {
                        copy.hidden = filtering;
                    });
            });
        });

        const message = ensureResultsMessage();

        if (message) {
            message.hidden = !currentSearch && currentCategory === "all";

            if (!message.hidden) {
                message.textContent = visibleCount
                    ? `${visibleCount} product(s) found`
                    : "No products found. Try another search.";
            }
        }

        // Keep search inputs synchronized.
        searchForms.forEach(form => {
            const input = form.querySelector('input[type="search"]');
            if (input) input.value = currentSearch;
        });

        // Highlight the selected navigation link.
        document.querySelectorAll(
            ".nav-links a, .mobile-nav-links a"
        ).forEach(link => {
            const url = new URL(link.href, window.location.href);
            const currentPath = window.location.pathname;
            const active =
                url.pathname === currentPath &&
                !currentSearch;

            link.classList.toggle("active", active);

            if (active) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        if (updateURL) {
            const url = new URL(window.location.href);

            if (currentCategory === "all") {
                url.searchParams.delete("category");
            } else {
                url.searchParams.set("category", currentCategory);
            }

            if (currentSearch) {
                url.searchParams.set("search", currentSearch);
            } else {
                url.searchParams.delete("search");
            }

            history.replaceState({}, "", url);
        }
    }

    searchForms.forEach(form => {
        form.addEventListener("submit", event => {
            event.preventDefault();

            const input = form.querySelector('input[type="search"]');

            currentSearch = input?.value.trim().toLowerCase() || "";
            currentCategory = "all";

            applyFilters({ updateURL: true });
            closeMobileMenu(false);

            const firstSection = document.querySelector(
                ".product-range, .clear-skin-section, .range-section"
            );

            firstSection?.scrollIntoView({ behavior: "smooth" });
        });

        const input = form.querySelector('input[type="search"]');

        input?.addEventListener("search", () => {
            currentSearch = input.value.trim().toLowerCase();
            currentCategory = "all";
            applyFilters({ updateURL: true });
        });
    });

    // Category navigation.
    document.querySelectorAll(
        ".nav-links a, .mobile-nav-links a"
    ).forEach(link => {
        const url = new URL(link.href, window.location.href);

        if (!url.searchParams.has("category")) return;

        link.addEventListener("click", event => {
            event.preventDefault();

            currentCategory =
                url.searchParams.get("category") || "all";
            currentSearch = "";

            applyFilters({ updateURL: true });
            closeMobileMenu(false);

            document.querySelector("#shop")?.scrollIntoView({
                behavior: "smooth"
            });
        });
    });

    // Load search/category from the URL on page open or refresh.
    const initialURL = new URL(window.location.href);

    currentSearch =
        initialURL.searchParams.get("search")?.trim().toLowerCase() || "";

    currentCategory =
        initialURL.searchParams.get("category") || "all";

    applyFilters();

    /* =====================================
       5. CART STORAGE AND DRAWER
    ===================================== */

    // v2 uses image-aware product IDs; old v1 records are intentionally not reused
    // because they may contain stale prices saved by the previous cart logic.
    const CART_STORAGE_KEY = "glowora-cart-v2";

    let cart = [];

    try {
        const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");

        if (Array.isArray(saved)) {
            cart = saved.filter(item =>
                item &&
                typeof item.id === "string" &&
                typeof item.name === "string" &&
                Number.isFinite(Number(item.price)) &&
                Number.isFinite(Number(item.quantity)) &&
                Number(item.quantity) > 0
            );
        }
    } catch {
        cart = [];
    }

    function saveCart() {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch {
            // Cart still works for this page session if storage is unavailable.
        }
    }

    function updateCartCount() {
        const count = cart.reduce(
            (total, item) => total + item.quantity,
            0
        );

        document.querySelectorAll(".cart-count").forEach(element => {
            element.textContent = count;
        });
    }

    function renderCart() {
        if (!cartPanel) return;

        const emptyState = cartPanel.querySelector(".cart-empty");
        const itemsContainer = cartPanel.querySelector(".cart-items");
        const footer = cartPanel.querySelector(".cart-footer");
        const totalElement = cartPanel.querySelector(".cart-total");

        if (!itemsContainer || !emptyState || !footer) return;

        itemsContainer.replaceChildren();

        emptyState.hidden = cart.length > 0;
        footer.hidden = cart.length === 0;

        let total = 0;

        cart.forEach(item => {
            const subtotal = item.price * item.quantity;
            total += subtotal;

            const row = document.createElement("article");
            row.className = "cart-item";

            const img = document.createElement("img");
            img.src = item.image;
            img.alt = item.alt || item.name;
            img.loading = "lazy";

            const info = document.createElement("div");
            info.className = "cart-item-info";

            const title = document.createElement("h3");
            title.textContent = item.name;

            const price = document.createElement("p");
            price.className = "cart-item-price";
            price.textContent = `${money(item.price)} each · ${money(subtotal)} total`;

            const controls = document.createElement("div");
            controls.className = "cart-item-controls";

            const minus = document.createElement("button");
            minus.type = "button";
            minus.className = "quantity-button";
            minus.textContent = "−";
            minus.setAttribute("aria-label", `Decrease ${item.name} quantity`);
            minus.dataset.cartAction = "decrease";
            minus.dataset.productId = item.id;

            const quantity = document.createElement("span");
            quantity.className = "cart-quantity";
            quantity.textContent = item.quantity;

            const plus = document.createElement("button");
            plus.type = "button";
            plus.className = "quantity-button";
            plus.textContent = "+";
            plus.setAttribute("aria-label", `Increase ${item.name} quantity`);
            plus.dataset.cartAction = "increase";
            plus.dataset.productId = item.id;

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "remove-item";
            remove.textContent = "Remove";
            remove.dataset.cartAction = "remove";
            remove.dataset.productId = item.id;

            controls.append(minus, quantity, plus, remove);
            info.append(title, price, controls);
            row.append(img, info);
            itemsContainer.append(row);
        });

        if (totalElement) totalElement.textContent = money(total);

        updateCartCount();
    }

    /* =====================================
       6. OPEN AND CLOSE DRAWERS
    ===================================== */

    function openPanel(name) {
        const panel = name === "cart" ? cartPanel : accountPanel;
        if (!panel || !panelOverlay) return;

        closeMobileMenu(false);

        panels.forEach(item => {
            item.classList.remove("is-open");
            item.setAttribute("aria-hidden", "true");
            item.inert = true;
        });

        activePanel = panel;
        previousOverflow = document.body.style.overflow;

        panelOverlay.classList.add("is-visible");
        panelOverlay.setAttribute("aria-hidden", "false");

        panel.classList.add("is-open");
        panel.setAttribute("aria-hidden", "false");
        panel.inert = false;

        document.body.style.overflow = "hidden";

        if (name === "cart") renderCart();

        panel.querySelector(".panel-close")?.focus();
    }

    function closePanel(returnFocus = true) {
        const wasOpen = activePanel;

        panels.forEach(panel => {
            panel.classList.remove("is-open");
            panel.setAttribute("aria-hidden", "true");
            panel.inert = true;
        });

        panelOverlay?.classList.remove("is-visible");
        panelOverlay?.setAttribute("aria-hidden", "true");

        activePanel = null;
        document.body.style.overflow = previousOverflow;

        if (returnFocus && wasOpen) {
            const trigger = document.querySelector(
                `[data-open-panel="${wasOpen.id === "cart-panel" ? "cart" : "account"}"]`
            );
            trigger?.focus();
        }
    }

    document.querySelectorAll("[data-open-panel]").forEach(button => {
        button.addEventListener("click", () => {
            openPanel(button.dataset.openPanel);
        });
    });

    document.querySelectorAll("[data-close-panel]").forEach(button => {
        button.addEventListener("click", () => closePanel());
    });

    document.querySelector("[data-continue-shopping]")
        ?.addEventListener("click", () => closePanel());

    // Add products to cart from existing cards.
    document.addEventListener("click", event => {
        const button = event.target.closest(".add-to-cart");
        if (!button) return;

        const card = button.closest(".range-card");
        if (!card || card.hasAttribute("data-cart-copy") || card.hasAttribute("data-marquee-copy")) return;

        const product = getProduct(card);
        if (!product.price || product.price <= 0) {
            console.error("GLOWORA: product price is missing or invalid", product.name);
            return;
        }
        const existing = cart.find(item => item.id === product.id);

        if (existing) {
            existing.quantity++;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                image: product.image,
                alt: product.alt,
                price: product.price,
                quantity: 1
            });
        }

        saveCart();
        renderCart();
        openPanel("cart");
    });

    // Cart quantity and remove actions.
    cartPanel?.addEventListener("click", event => {
        const button = event.target.closest("[data-cart-action]");
        if (!button) return;

        const item = cart.find(
            product => product.id === button.dataset.productId
        );

        if (!item) return;

        switch (button.dataset.cartAction) {
            case "increase":
                item.quantity++;
                break;

            case "decrease":
                item.quantity--;
                if (item.quantity <= 0) {
                    cart = cart.filter(product => product.id !== item.id);
                }
                break;

            case "remove":
                cart = cart.filter(product => product.id !== item.id);
                break;
        }

        saveCart();
        renderCart();
    });

    document.querySelector(".checkout-button")
        ?.addEventListener("click", () => {
            if (!cart.length) return;
            window.location.href = "./checkout.html";
        });

    renderCart();

    /* =====================================
       7. ACCOUNT FORM VIEW SWITCHING
    ===================================== */

    const accountForms = {
        login: document.querySelector("#login-form"),
        register: document.querySelector("#register-form"),
        forgot: document.querySelector("#forgot-form")
    };

    function showAccountView(view) {
        Object.entries(accountForms).forEach(([name, form]) => {
            if (form) {
                form.hidden = name !== view;

                const message = form.querySelector(".account-message");
                if (message) message.textContent = "";
            }
        });

        accountPanel?.querySelector(".account-panel-title")
            ?.replaceChildren(document.createTextNode(
                view === "register" ? "Create Account" :
                view === "forgot" ? "Reset Password" : "Login"
            ));

        accountForms[view]?.querySelector("input")?.focus();
    }

    document.querySelectorAll("[data-account-view]").forEach(button => {
        button.addEventListener("click", () => {
            showAccountView(button.dataset.accountView);
        });
    });

    showAccountView("login");

    // Front-end demo only; no real authentication occurs.
    document.querySelector("#login-form")
        ?.addEventListener("submit", event => {
            event.preventDefault();

            const message = event.currentTarget.querySelector(".account-message");
            message.textContent =
                "The login form is ready, but authentication needs a backend.";
        });

    document.querySelector("#register-form")
        ?.addEventListener("submit", event => {
            event.preventDefault();

            const message = event.currentTarget.querySelector(".account-message");
            message.textContent =
                "The registration form is ready, but account creation needs a backend.";
        });

    document.querySelector("#forgot-form")
        ?.addEventListener("submit", event => {
            event.preventDefault();

            const message = event.currentTarget.querySelector(".account-message");
            message.textContent =
                "Password reset requests need to be connected to an authentication service.";
        });

    /* =====================================
       8. ESCAPE KEY AND RESPONSIVE RESET
    ===================================== */

    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;

        if (activePanel) {
            closePanel();
        } else if (header?.classList.contains("menu-open")) {
            closeMobileMenu();
        }
    });

    window.matchMedia("(min-width: 750px)")
        .addEventListener("change", event => {
            if (event.matches) closeMobileMenu(false);
        });

    /* =====================================
       9. PRODUCT MARQUEE CAROUSELS
       Keep existing two auto-moving sections
    ===================================== */

    const tracks = document.querySelectorAll(
        ".product-range .product-track, " +
        ".clear-skin-section .product-track"
    );

    tracks.forEach(track => {
        if (track.dataset.marqueeReady === "true") return;

        const originalCards = Array.from(track.children)
            .filter(card => card.classList.contains("range-card"))
            .filter(card => !card.hasAttribute("data-marquee-copy"));

        if (originalCards.length < 2) return;

        track.dataset.marqueeReady = "true";

        // Mark copies so filtering can hide them.
        for (let copy = 0; copy < 2; copy++) {
            originalCards.forEach(card => {
                const clone = card.cloneNode(true);

                clone.dataset.marqueeCopy = "true";
                clone.setAttribute("aria-hidden", "true");
                clone.inert = true;

                track.appendChild(clone);
            });
        }

        function updateCarousel() {
            if (
                currentSearch ||
                currentCategory !== "all" ||
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ) {
                track.style.animation = "none";
                return;
            }

            track.style.animation = "";

            const styles = getComputedStyle(track);
            const gap = parseFloat(styles.columnGap) || 18;

            const width = originalCards.reduce(
                (total, card) => total + card.getBoundingClientRect().width,
                0
            );

            const distance = width + gap * originalCards.length;

            track.style.setProperty("--marquee-distance", `${distance}px`);
            track.style.setProperty(
                "--marquee-duration",
                `${Math.max(20, distance / 40)}s`
            );
        }

        updateCarousel();

        window.addEventListener("resize", updateCarousel);

        track.dataset.marqueeInitialized = "true";

        track.addEventListener("animationiteration", () => {
            if (currentSearch || currentCategory !== "all") {
                track.style.animation = "none";
            }
        });
    });

}



// GLOWORA hero video carousel
function initHeroCarousel() {
    const carousel = document.querySelector(".hero-video-carousel");
    if (!carousel) return;

    const slides = Array.from(carousel.querySelectorAll(".hero-slide"));
    const dots = Array.from(carousel.querySelectorAll(".hero-dot"));
    const previousButton = carousel.querySelector(".hero-prev");
    const nextButton = carousel.querySelector(".hero-next");
    const autoplayButton = carousel.querySelector(".hero-autoplay-toggle");
    const currentSlideLabel = carousel.querySelector(".hero-current-slide");
    if (!slides.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let currentIndex = Math.max(0, slides.findIndex(slide => slide.classList.contains("active")));
    let autoplayPaused = reduceMotion;
    let fallbackTimer = null;

    function updateControls() {
        dots.forEach((dot, index) => {
            const active = index === currentIndex;
            dot.classList.toggle("active", active);
            if (active) dot.setAttribute("aria-current", "true");
            else dot.removeAttribute("aria-current");
        });
        if (currentSlideLabel) currentSlideLabel.textContent = String(currentIndex + 1).padStart(2, "0");
        if (autoplayButton) {
            autoplayButton.setAttribute("aria-pressed", String(autoplayPaused));
            autoplayButton.setAttribute("aria-label", autoplayPaused ? "Play automatic slides" : "Pause automatic slides");
            autoplayButton.innerHTML = autoplayPaused
                ? '<i class="fa-solid fa-play" aria-hidden="true"></i>'
                : '<i class="fa-solid fa-pause" aria-hidden="true"></i>';
        }
    }

    function clearFallback() {
        if (fallbackTimer) window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
    }

    function scheduleFallback() {
        clearFallback();
        if (autoplayPaused || document.hidden || slides.length < 2) return;
        fallbackTimer = window.setTimeout(() => showSlide(currentIndex + 1), 15000);
    }

    function showSlide(index) {
        const nextIndex = (index + slides.length) % slides.length;
        const oldVideo = slides[currentIndex]?.querySelector("video");
        slides[currentIndex]?.classList.remove("active");
        if (oldVideo) {
            oldVideo.pause();
            try { oldVideo.currentTime = 0; } catch (_) {}
        }

        currentIndex = nextIndex;
        const nextSlide = slides[currentIndex];
        const nextVideo = nextSlide.querySelector("video");
        slides.forEach((slide, i) => slide.setAttribute("aria-hidden", String(i !== currentIndex)));
        nextSlide.classList.add("active");

        if (nextVideo && !autoplayPaused && !document.hidden) {
            try { nextVideo.currentTime = 0; } catch (_) {}
            const promise = nextVideo.play();
            if (promise && typeof promise.catch === "function") promise.catch(() => {});
        }
        updateControls();
        scheduleFallback();
    }

    slides.forEach((slide, index) => {
        slide.setAttribute("aria-hidden", String(index !== currentIndex));
        const video = slide.querySelector("video");
        video?.addEventListener("ended", () => {
            if (index === currentIndex && !autoplayPaused) showSlide(currentIndex + 1);
        });
    });

    dots.forEach(dot => dot.addEventListener("click", () => {
        const index = Number(dot.dataset.slideTo);
        if (Number.isInteger(index)) showSlide(index);
    }));
    previousButton?.addEventListener("click", () => showSlide(currentIndex - 1));
    nextButton?.addEventListener("click", () => showSlide(currentIndex + 1));

    autoplayButton?.addEventListener("click", () => {
        autoplayPaused = !autoplayPaused;
        const video = slides[currentIndex].querySelector("video");
        if (autoplayPaused) {
            clearFallback();
            video?.pause();
        } else {
            const promise = video?.play();
            if (promise && typeof promise.catch === "function") promise.catch(() => {});
            scheduleFallback();
        }
        updateControls();
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            clearFallback();
            slides[currentIndex].querySelector("video")?.pause();
        } else if (!autoplayPaused) {
            const video = slides[currentIndex].querySelector("video");
            const promise = video?.play();
            if (promise && typeof promise.catch === "function") promise.catch(() => {});
            scheduleFallback();
        }
    });

    slides.forEach((slide, index) => slide.classList.toggle("active", index === currentIndex));
    updateControls();
    if (!autoplayPaused) {
        const firstVideo = slides[currentIndex].querySelector("video");
        const promise = firstVideo?.play();
        if (promise && typeof promise.catch === "function") promise.catch(() => {});
        scheduleFallback();
    }
}



function initReviewsAndNewsletter() {
  const modal = document.getElementById("review-modal-overlay");
  const form = document.getElementById("review-form");
  const track = document.getElementById("review-track");
  const storageKey = "glowora-customer-reviews-demo-v1";
  let selectedRating = 0;
  let startIndex = 0;
  let reviews = [];

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(saved)) reviews = saved.filter(item => item && item.title && item.content && item.rating);
  } catch (_) { reviews = []; }

  function visibleCount() { return window.matchMedia("(max-width: 600px)").matches ? 2 : 3; }
  function allCards() { return track ? Array.from(track.querySelectorAll(".review-card")) : []; }
  function renderReviews() {
    if (!track) return;
    const cards = allCards();
    cards.forEach((card, index) => {
      const show = index >= startIndex && index < startIndex + visibleCount();
      card.style.display = show ? "flex" : "none";
    });
    const maxStart = Math.max(0, cards.length - visibleCount());
    if (startIndex > maxStart) { startIndex = 0; renderReviews(); }
  }
  function makeReviewCard(review) {
    const card = document.createElement("article"); card.className = "review-card";
    const stars = Math.max(1, Math.min(5, Number(review.rating) || 5));
    const safeName = String(review.name || "GLOWORA Customer").slice(0, 45);
    const safeTitle = String(review.title).slice(0, 70);
    const safeContent = String(review.content).slice(0, 700);
    const avatar = safeName.trim().charAt(0).toUpperCase() || "G";
    const starLine = "★".repeat(stars) + "☆".repeat(5 - stars);
    card.innerHTML = '<div class="review-stars" aria-label="' + stars + ' out of 5 stars">' + starLine + '</div><h3 class="review-user-title"></h3><p class="review-quote"></p><div class="review-card-bottom"><span class="review-avatar"></span><div><strong></strong><small>Browser-submitted review</small></div><span class="review-mark">“</span></div>';
    card.querySelector(".review-user-title").textContent = safeTitle;
    card.querySelector(".review-quote").textContent = '“' + safeContent + '”';
    card.querySelector(".review-avatar").textContent = avatar;
    card.querySelector(".review-card-bottom strong").textContent = safeName;
    return card;
  }
  function addStoredReviews() {
    if (!track) return;
    track.querySelectorAll(".review-card[data-user-review='true']").forEach(card => card.remove());
    reviews.forEach(review => { const card = makeReviewCard(review); card.dataset.userReview = "true"; track.appendChild(card); });
    startIndex = 0; renderReviews();
  }
  function openModal() { if (!modal) return; modal.hidden = false; document.body.classList.add("modal-open"); document.getElementById("review-title")?.focus(); }
  function closeModal() { if (!modal) return; modal.hidden = true; document.body.classList.remove("modal-open"); form?.reset(); selectedRating = 0; updateStars(); const message = document.getElementById("review-form-message"); if (message) message.textContent = ""; }
  function updateStars() {
    document.querySelectorAll(".rating-star").forEach(button => { const active = Number(button.dataset.rating) <= selectedRating; button.classList.toggle("selected", active); button.setAttribute("aria-checked", String(Number(button.dataset.rating) === selectedRating)); });
    const help = document.getElementById("rating-help"); if (help) help.textContent = selectedRating ? selectedRating + " out of 5 stars" : "Select a rating";
  }
  document.getElementById("open-review-form")?.addEventListener("click", openModal);
  ["close-review-form", "cancel-review"].forEach(id => document.getElementById(id)?.addEventListener("click", closeModal));
  modal?.addEventListener("click", event => { if (event.target === modal) closeModal(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && modal && !modal.hidden) closeModal(); });
  document.querySelectorAll(".rating-star").forEach(button => button.addEventListener("click", () => { selectedRating = Number(button.dataset.rating); updateStars(); }));
  form?.addEventListener("submit", event => {
    event.preventDefault();
    const message = document.getElementById("review-form-message");
    if (!selectedRating) { if (message) message.textContent = "Please select a star rating first."; return; }
    const title = document.getElementById("review-title").value.trim();
    const content = document.getElementById("review-content").value.trim();
    if (!title || !content) return;
    reviews.push({ name: "GLOWORA Customer", title, content, rating: selectedRating, createdAt: new Date().toISOString() });
    try { localStorage.setItem(storageKey, JSON.stringify(reviews.slice(-30))); } catch (_) {}
    addStoredReviews(); closeModal();
    document.getElementById("customer-reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelector(".review-prev")?.addEventListener("click", () => { const count = visibleCount(); const total = allCards().length; if (!total) return; startIndex = (startIndex - 1 + total) % total; if (startIndex + count > total) startIndex = Math.max(0, total - count); renderReviews(); });
  document.querySelector(".review-next")?.addEventListener("click", () => { const total = allCards().length; const maxStart = Math.max(0, total - visibleCount()); startIndex = startIndex >= maxStart ? 0 : startIndex + 1; renderReviews(); });
  window.addEventListener("resize", renderReviews);
  addStoredReviews();

  document.querySelectorAll(".newsletter-form").forEach(newsletter => newsletter.addEventListener("submit", event => {
    event.preventDefault(); const message = newsletter.parentElement.querySelector(".newsletter-message");
    if (message) message.textContent = "Thanks! Newsletter sign-up is a demo in this project.";
    newsletter.reset();
  }));

  // Keep Shop All active only on index.html; About Us only on about.html.
  document.querySelectorAll(".nav-links a, .mobile-nav-links a").forEach(link => {
    const linkURL = new URL(link.href, window.location.href);
    const currentPath = window.location.pathname.replace(/\/$/, "");
    const targetPath = linkURL.pathname.replace(/\/$/, "");
    const isActive = currentPath === targetPath && !linkURL.hash;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
  });
}


/* GLOWORA shared category search */
function initCategorySearch() {
    const categoryPages = {
        serum: "serum.html", serums: "serum.html",
        moisturizer: "moisturizer.html", moisturizers: "moisturizer.html",
        cleanser: "cleanser.html", cleansers: "cleanser.html",
        "face mask": "face-mask.html", "face masks": "face-mask.html",
        "eye cream": "bright-eye-cream.html", "bright eye cream": "bright-eye-cream.html",
        toner: "toner.html", toners: "toner.html",
        sunscreen: "sunscreen.html", sunscreens: "sunscreen.html",
        "body wash": "body-wash.html", wash: "body-wash.html"
    };

    document.querySelectorAll(".header-search, .mobile-search").forEach(function (form) {
        form.addEventListener("submit", function (event) {
            const input = form.querySelector('input[type="search"]');
            const term = (input?.value || "").trim().toLowerCase();
            const target = categoryPages[term];
            if (target) {
                event.preventDefault();
                window.location.href = "./" + target;
            }
        });
    });
}

function initGlowora() {
    initCore();
    initHeroCarousel();
    initReviewsAndNewsletter();
    initCategorySearch();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGlowora, { once: true });
} else {
    initGlowora();
}
