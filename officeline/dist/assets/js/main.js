(function () {
  "use strict";

  /* Header scroll shadow */
  var header = document.getElementById("siteHeader");
  var backToTop = document.getElementById("backToTop");

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (backToTop) backToTop.classList.toggle("is-visible", y > 500);

    /* Subtle parallax on hero panel backgrounds */
    document.querySelectorAll(".hero-panel-bg").forEach(function (el) {
      var offset = Math.min(y * 0.15, 60);
      el.style.transform = "translateY(" + offset + "px)";
    });
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Product imagery carousel for the two homepage families */
  document.querySelectorAll(".hero-carousel").forEach(function (carousel) {
    var slides = carousel.querySelectorAll(".hero-carousel-track img");
    if (slides.length < 2) return;
    var current = 0;
    var status = carousel.querySelector(".hero-carousel-status b");
    var intervalId;

    function showSlide(index) {
      slides[current].classList.remove("is-active");
      current = (index + slides.length) % slides.length;
      slides[current].classList.add("is-active");
      if (status) status.textContent = String(current + 1).padStart(2, "0");
    }

    var previous = carousel.querySelector(".hero-carousel-prev");
    var next = carousel.querySelector(".hero-carousel-next");
    if (previous) previous.addEventListener("click", function () { showSlide(current - 1); });
    if (next) next.addEventListener("click", function () { showSlide(current + 1); });

    function startCarousel() {
      intervalId = window.setInterval(function () { showSlide(current + 1); }, 5200);
    }

    carousel.addEventListener("mouseenter", function () { window.clearInterval(intervalId); });
    carousel.addEventListener("mouseleave", startCarousel);
    startCarousel();
  });

  document.querySelectorAll("[data-video-sound]").forEach(function (toggle) {
    var media = toggle.closest(".concept-hero-grid").querySelector(".concept-hero-video");
    var label = toggle.querySelector("[data-video-sound-label]");
    if (!media) return;
    toggle.addEventListener("click", function () {
      media.muted = !media.muted;
      var enabled = !media.muted;
      toggle.setAttribute("aria-pressed", enabled ? "true" : "false");
      toggle.setAttribute("aria-label", enabled ? "Couper le son" : "Activer le son");
      if (label) label.textContent = enabled ? "Couper le son" : "Activer le son";
      toggle.classList.toggle("is-sound-on", enabled);
    });
  });

  document.querySelectorAll(".lang-switch:not(.lang-switch--mobile)").forEach(function (switcher) {
    var trigger = switcher.querySelector(".lang-switch-trigger");
    if (!trigger) return;
    trigger.addEventListener("click", function () {
      var open = switcher.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    switcher.querySelectorAll(".lang-menu a").forEach(function (link) {
      link.addEventListener("click", function () {
        switcher.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("click", function (event) {
      if (!switcher.contains(event.target)) {
        switcher.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      }
    });
    switcher.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        switcher.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
      }
    });
  });

  document.querySelectorAll("[data-testimonial-carousel]").forEach(function (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".contact-home-testimonial-slide"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-testimonial-dot]"));
    var previous = carousel.querySelector("[data-testimonial-previous]");
    var next = carousel.querySelector("[data-testimonial-next]");
    var pauseButton = carousel.querySelector("[data-testimonial-pause]");
    var stage = carousel.querySelector(".contact-home-testimonial-stage");
    if (slides.length < 2 || !previous || !next || !pauseButton) return;

    var currentIndex = 0;
    var intervalId = 0;
    var paused = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var hovered = false;
    var focused = false;

    function showSlide(index, announce) {
      currentIndex = (index + slides.length) % slides.length;
      if (stage) stage.setAttribute("aria-live", announce ? "polite" : "off");
      slides.forEach(function (slide, slideIndex) {
        slide.hidden = slideIndex !== currentIndex;
      });
      dots.forEach(function (dot, dotIndex) {
        dot.setAttribute("aria-pressed", dotIndex === currentIndex ? "true" : "false");
      });
    }

    function stopRotation() {
      window.clearInterval(intervalId);
      intervalId = 0;
    }

    function startRotation() {
      stopRotation();
      if (!paused && !hovered && !focused && !document.hidden) {
        intervalId = window.setInterval(function () { showSlide(currentIndex + 1, false); }, 7000);
      }
    }

    function setPaused(value) {
      paused = value;
      pauseButton.setAttribute("aria-pressed", paused ? "true" : "false");
      pauseButton.setAttribute("aria-label", paused ? pauseButton.getAttribute("data-resume-label") : pauseButton.getAttribute("data-pause-label"));
      if (paused) stopRotation();
      else startRotation();
    }

    previous.addEventListener("click", function () { showSlide(currentIndex - 1, true); startRotation(); });
    next.addEventListener("click", function () { showSlide(currentIndex + 1, true); startRotation(); });
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        showSlide(Number(dot.getAttribute("data-testimonial-dot")), true);
        startRotation();
      });
    });
    pauseButton.addEventListener("click", function () { setPaused(!paused); });
    carousel.addEventListener("mouseenter", function () { hovered = true; stopRotation(); });
    carousel.addEventListener("mouseleave", function () { hovered = false; startRotation(); });
    carousel.addEventListener("focusin", function () { focused = true; stopRotation(); });
    carousel.addEventListener("focusout", function (event) {
      if (!carousel.contains(event.relatedTarget)) {
        focused = false;
        startRotation();
      }
    });
    carousel.addEventListener("keydown", function (event) {
      var rtl = document.documentElement.dir === "rtl";
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showSlide(currentIndex + (rtl ? 1 : -1), true);
        startRotation();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showSlide(currentIndex + (rtl ? -1 : 1), true);
        startRotation();
      }
    });
    document.addEventListener("visibilitychange", startRotation);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      pauseButton.hidden = true;
    } else {
      startRotation();
    }
  });

  /* Count the official reference figures when the section enters the viewport */
  var counterSection = document.querySelector("[data-counter-section]");
  if (counterSection) {
    var countersStarted = false;
    function startCounters() {
      if (countersStarted) return;
      countersStarted = true;
      var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var locale = document.documentElement.lang === "fr" ? "fr-FR" : document.documentElement.lang === "ar" ? "ar-DZ" : "en-US";
      counterSection.querySelectorAll("[data-counter]").forEach(function (counter) {
        var target = Number(counter.getAttribute("data-counter"));
        var suffix = counter.getAttribute("data-suffix") || "";
        if (reducedMotion) {
          counter.textContent = target.toLocaleString(locale) + suffix;
          return;
        }
        var startTime = performance.now();
        function updateCounter(now) {
          var progress = Math.min((now - startTime) / 1500, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          counter.textContent = Math.floor(target * eased).toLocaleString(locale) + suffix;
          if (progress < 1) window.requestAnimationFrame(updateCounter);
        }
        window.requestAnimationFrame(updateCounter);
      });
    }
    if ("IntersectionObserver" in window) {
      var counterObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          startCounters();
          counterObserver.disconnect();
        }
      }, { threshold: 0.25 });
      counterObserver.observe(counterSection);
    } else {
      startCounters();
    }
  }

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* Mobile nav toggle */
  var navToggle = document.getElementById("navToggle");
  var mobileNav = document.getElementById("mobileNav");
  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* Scroll reveal */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }
  document.documentElement.classList.add("has-js");
})();
