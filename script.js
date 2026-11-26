(() => {
  // Feature-detect Popover API and load polyfill only if unsupported
  if (!Object.hasOwn(HTMLElement.prototype, "popover")) {
    import("https://unpkg.com/@oddbird/popover-polyfill@latest/dist/popover.min.js");
  }

  /* ========================================================================
     1. Adaptive Header Navigation (Wide Inline <-> Narrow Popover)
     ======================================================================== */
  const header = document.getElementById("site-header");
  const inner = header.querySelector(".header-inner");
  const menu = document.getElementById("site-menu");
  const menuButton = header.querySelector(".menu-button");
  const dropdownItem = header.querySelector(".has-dropdown");
  const dropdownTrigger = header.querySelector(".dropdown-trigger");
  const submenu = document.getElementById("more-submenu");

  let lastMeasuredWidth = 0;
  let isHoverPreview = false;

  const supportsPositionArea = () =>
    typeof CSS !== "undefined" && CSS.supports("position-area", "block-end");

  const positionSubmenuFallback = () => {
    if (supportsPositionArea()) return;
    const triggerRect = dropdownTrigger.getBoundingClientRect();
    const menuRect = submenu.getBoundingClientRect();
    let top = triggerRect.bottom + 6;
    if (top + menuRect.height > window.innerHeight) {
      top = Math.max(8, triggerRect.top - menuRect.height - 6);
    }
    const left = Math.max(
      8,
      Math.min(triggerRect.left, window.innerWidth - menuRect.width - 8)
    );
    submenu.style.top = `${top}px`;
    submenu.style.left = `${left}px`;
  };

  const updateNavLayout = () => {
    const currentWidth = header.clientWidth;
    const wasWide = header.classList.contains("is-wide");

    if (!wasWide && currentWidth <= lastMeasuredWidth && lastMeasuredWidth !== 0) {
      return;
    }

    const menuWasOpen =
      !wasWide &&
      (menu.matches(":popover-open") || menu.classList.contains(":popover-open"));

    header.classList.add("is-measuring");
    header.classList.add("is-wide");
    menu.removeAttribute("popover");
    submenu.setAttribute("popover", "auto");
    submenu.hidden = false;

    const fitsInline = inner.scrollWidth <= inner.clientWidth + 1;
    lastMeasuredWidth = currentWidth;

    if (fitsInline) {
      header.classList.add("is-wide");
      menu.removeAttribute("popover");
      submenu.setAttribute("popover", "auto");
      submenu.hidden = false;
      dropdownTrigger.setAttribute("aria-expanded", "false");
    } else {
      header.classList.remove("is-wide");
      menu.setAttribute("popover", "auto");
      submenu.removeAttribute("popover");
      submenu.hidden = true;
      dropdownTrigger.setAttribute("aria-expanded", "false");
      if (menuWasOpen && typeof menu.showPopover === "function") {
        try {
          menu.showPopover();
        } catch {
          // Ignore if already open
        }
      }
    }

    requestAnimationFrame(() => {
      header.classList.remove("is-measuring");
    });
  };

  menu.addEventListener("toggle", (event) => {
    menuButton.setAttribute("aria-expanded", String(event.newState === "open"));
  });

  submenu.addEventListener("toggle", (event) => {
    const isOpen = event.newState === "open";
    dropdownTrigger.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      positionSubmenuFallback();
    } else {
      isHoverPreview = false;
    }
  });

  // Narrow layout disclosure click + wide hover-preview pin
  dropdownTrigger.addEventListener("click", (event) => {
    if (!header.classList.contains("is-wide")) {
      event.preventDefault();
      const willOpen = submenu.hidden;
      submenu.hidden = !willOpen;
      dropdownTrigger.setAttribute("aria-expanded", String(willOpen));
      return;
    }

    if (isHoverPreview) {
      isHoverPreview = false;
      event.preventDefault();
    }
  });

  // Hover preview in wide layout on hover-capable pointers
  dropdownItem.addEventListener("pointerenter", (event) => {
    if (
      !header.classList.contains("is-wide") ||
      event.pointerType === "touch" ||
      !window.matchMedia("(hover: hover)").matches
    ) {
      return;
    }
    if (
      typeof submenu.showPopover === "function" &&
      !submenu.matches(":popover-open")
    ) {
      isHoverPreview = true;
      try {
        submenu.showPopover({ source: dropdownTrigger });
      } catch {
        submenu.showPopover();
      }
    }
  });

  dropdownItem.addEventListener("pointerleave", () => {
    if (!header.classList.contains("is-wide") || !isHoverPreview) return;
    if (typeof submenu.hidePopover === "function") {
      try {
        submenu.hidePopover();
      } catch {
        // Ignore
      }
    }
    isHoverPreview = false;
  });

  dropdownItem.addEventListener("focusout", (event) => {
    if (!header.classList.contains("is-wide")) return;
    if (event.relatedTarget && !dropdownItem.contains(event.relatedTarget)) {
      if (typeof submenu.hidePopover === "function") {
        try {
          submenu.hidePopover();
        } catch {
          // Ignore
        }
      }
    }
  });

  const resizeObserver = new ResizeObserver(() => {
    updateNavLayout();
  });
  resizeObserver.observe(header);
  resizeObserver.observe(menu);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateNavLayout);
  }
  updateNavLayout();

  /* ========================================================================
     2. Search Bar Toggle & Instant Page Search
     ======================================================================== */
  const searchToggle = document.getElementById("search-toggle");
  const searchBar = document.getElementById("site-search-bar");
  const searchInput = document.getElementById("site-search-input");
  const searchClose = document.getElementById("search-close");
  const searchResults = document.getElementById("search-results");

  const searchableItems = [
    { label: "Home - SMOFBAR", href: "index.html" },
    { label: "Subbagian Umum", href: "subbagian-umum.html" },
    { label: "Manajemen SDM", href: "manajemen-sdm.html" },
    { label: "Statistik Sosial", href: "statistik-sosial.html" },
    { label: "Statistik Produksi", href: "statistik-produksi.html" },
    { label: "Statistik Distribusi", href: "statistik-distribusi.html" },
    { label: "Nerwilis", href: "nerwilis.html" },
    { label: "PTI", href: "pti.html" },
    { label: "Manajemen Lapangan dan Mitra", href: "manajemen-lapangan-dan-mitra.html" },
    { label: "Pembinaan Sektoral", href: "pembinaan-sektoral.html" },
    { label: "Reformasi Birokrasi", href: "reformasi-birokrasi.html" },
    { label: "Inovasi", href: "inovasi.html" },
    { label: "POTD (Photo of The Day)", href: "potd.html" },
    { label: "POTD - Maret 2024", href: "potd-maret-2024.html" },
    { label: "POTD - Februari 2024", href: "potd-februari-2024.html" },
    { label: "Analisis Angket Evaluasi SMOFBAR", href: "analisis-evaluasi.html" },
    { label: "Struktur Tim Kerja BPS Kabupaten Bangka Barat", href: "index.html#struktur-heading" },
    { label: "Matriks Kegiatan, Beban Kerja & List to Do", href: "index.html#matriks-layanan" },
    { label: "Potret Statistik Bangka Barat", href: "index.html#potret-heading" },
    { label: "Media Sosial (Instagram, YouTube, Facebook)", href: "index.html#media-sosial-heading" }
  ];

  const closeSearch = () => {
    searchBar.hidden = true;
    searchToggle.setAttribute("aria-expanded", "false");
    searchResults.hidden = true;
    searchInput.value = "";
  };

  searchToggle.addEventListener("click", () => {
    const willOpen = searchBar.hidden;
    searchBar.hidden = !willOpen;
    searchToggle.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) {
      searchInput.focus();
    } else {
      closeSearch();
    }
  });

  searchClose.addEventListener("click", () => {
    closeSearch();
    searchToggle.focus();
  });

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      searchResults.hidden = true;
      searchResults.innerHTML = "";
      return;
    }

    const matches = searchableItems.filter((item) =>
      item.label.toLowerCase().includes(query)
    );

    searchResults.hidden = false;
    if (matches.length === 0) {
      searchResults.innerHTML = '<p class="search-empty">Tidak ditemukan hasil yang cocok.</p>';
      return;
    }

    searchResults.innerHTML = matches
      .map((item) => `<a href="${item.href}">${item.label}</a>`)
      .join("");

    searchResults.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeSearch);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !searchBar.hidden) {
      closeSearch();
      searchToggle.focus();
    }
  });

  /* ========================================================================
     3. Header Scroll Elevation, Hero Reduced Motion, Parallax Fallback & Scroll
     ======================================================================== */
  const prefersReducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  // Header scroll shadow elevation
  const syncHeaderScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", syncHeaderScroll, { passive: true });
  syncHeaderScroll();

  // Respect prefers-reduced-motion for hero animated GIF
  const heroBgImg = document.getElementById("hero-bg-image");
  if (heroBgImg) {
    const syncHeroMotion = () => {
      heroBgImg.src = prefersReducedMotionQuery.matches
        ? heroBgImg.dataset.staticSrc
        : heroBgImg.dataset.animatedSrc;
    };
    syncHeroMotion();
    prefersReducedMotionQuery.addEventListener("change", syncHeroMotion);
  }

  // Hero Parallax Fallback for browsers without CSS Scroll-Driven Animations
  const heroSection = document.getElementById("home");
  const heroMediaLayer = document.getElementById("hero-media-layer");
  const supportsScrollDriven =
    typeof CSS !== "undefined" &&
    CSS.supports("(animation-timeline: view()) and (animation-range: entry)");

  if (
    heroSection &&
    heroMediaLayer &&
    !supportsScrollDriven &&
    !prefersReducedMotionQuery.matches
  ) {
    let ticking = false;
    const updateParallax = () => {
      ticking = false;
      const offset = Math.min(heroSection.offsetHeight * 0.5, window.scrollY * 0.5);
      heroMediaLayer.style.transform = `translate3d(0, ${offset}px, 0)`;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateParallax);
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.addEventListener("scroll", onScroll, { passive: true });
            updateParallax();
          } else {
            window.removeEventListener("scroll", onScroll);
          }
        });
      },
      { threshold: 0 }
    );
    observer.observe(heroSection);
  }

  // Hero Scroll Down Button
  const heroScrollBtn = document.getElementById("hero-scroll-btn");
  const officeGallery = document.getElementById("office-gallery");
  if (heroScrollBtn && officeGallery) {
    heroScrollBtn.addEventListener("click", () => {
      const top = officeGallery.getBoundingClientRect().top + window.scrollY - 56;
      window.scrollTo({
        top,
        behavior: prefersReducedMotionQuery.matches ? "auto" : "smooth"
      });
    });
  }

  // Material Ripple Effect on .teal-btn buttons
  if (!prefersReducedMotionQuery.matches) {
    document.querySelectorAll(".teal-btn").forEach((btn) => {
      btn.addEventListener("pointerdown", (e) => {
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement("span");
        ripple.className = "btn-ripple";
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        btn.appendChild(ripple);
        if (ripple.getAnimations && ripple.getAnimations().length === 0) {
          ripple.remove();
        } else {
          ripple.addEventListener("animationend", () => ripple.remove(), {
            once: true
          });
        }
      });
    });
  }

  /* ========================================================================
     4. Accessible Multi-Instance Carousels
     ======================================================================== */
  document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    const slides = Array.from(carousel.querySelectorAll(".carousel-slide"));
    const dots = Array.from(carousel.querySelectorAll(".carousel-dot"));
    const prevBtn = carousel.querySelector(".carousel-prev");
    const nextBtn = carousel.querySelector(".carousel-next");
    const autoplayMs = Number(carousel.dataset.autoplay || 0);

    let current = 0;
    let timer = null;

    const goTo = (index) => {
      current = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;

      slides.forEach((slide, i) => {
        slide.setAttribute("aria-hidden", String(i !== current));
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === current);
        dot.setAttribute("aria-selected", String(i === current));
      });
    };

    const stopAutoplay = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const startAutoplay = () => {
      if (!autoplayMs || prefersReducedMotionQuery.matches) return;
      stopAutoplay();
      timer = setInterval(() => goTo(current + 1), autoplayMs);
    };

    prefersReducedMotionQuery.addEventListener("change", () => {
      if (prefersReducedMotionQuery.matches) stopAutoplay();
      else startAutoplay();
    });

    prevBtn.addEventListener("click", () => {
      goTo(current - 1);
      startAutoplay();
    });

    nextBtn.addEventListener("click", () => {
      goTo(current + 1);
      startAutoplay();
    });

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        goTo(i);
        startAutoplay();
      });
    });

    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", startAutoplay);

    // Touch swipe support
    let touchStartX = 0;
    track.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].clientX;
      },
      { passive: true }
    );
    track.addEventListener(
      "touchend",
      (e) => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
          goTo(diff > 0 ? current + 1 : current - 1);
          startAutoplay();
        }
      },
      { passive: true }
    );

    goTo(0);
    startAutoplay();
  });
})();
