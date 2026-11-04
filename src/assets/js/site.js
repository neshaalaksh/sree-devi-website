(function () {
  "use strict";

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) setOpen(false);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
  }

  /* ---------- WhatsApp chooser (Hospital / Lab & Pharmacy) ---------- */
  var wa = document.getElementById("wa-dialog");
  if (wa && typeof wa.showModal === "function") {
    document.addEventListener("click", function (e) {
      var link = e.target.closest("[data-wa]");
      if (!link) return;
      e.preventDefault();
      wa.showModal();
    });
    wa.addEventListener("click", function (e) {
      if (e.target === wa) wa.close();
    });
  }

  /* ---------- Doctor profile modal ---------- */
  var modal = document.getElementById("doctor-modal");
  if (modal && typeof modal.showModal === "function") {
    var body = modal.querySelector(".doc-modal__body");
    var lastFocus = null;

    var openDoctor = function (slug, push) {
      var tpl = document.getElementById("doctor-" + slug);
      if (!tpl) return false;
      body.innerHTML = "";
      body.appendChild(tpl.content.cloneNode(true));
      lastFocus = document.activeElement;
      if (!modal.open) modal.showModal();
      modal.scrollTop = 0;
      body.scrollTop = 0;
      if (push) history.replaceState(null, "", "#" + slug);
      return true;
    };
    var closeDoctor = function () {
      if (modal.open) modal.close();
    };

    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-doctor]");
      if (btn) {
        e.preventDefault();
        openDoctor(btn.getAttribute("data-doctor"), true);
      }
    });
    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.closest("[data-close]")) closeDoctor();
    });
    modal.addEventListener("close", function () {
      if (location.hash) history.replaceState(null, "", location.pathname + location.search);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    });
    if (location.hash.length > 1) openDoctor(decodeURIComponent(location.hash.slice(1)), false);
  }

  /* ---------- Generic filters (doctors by department, videos by category) ---------- */
  document.querySelectorAll("[data-filter-group]").forEach(function (group) {
    var name = group.getAttribute("data-filter-group");
    var target = document.querySelector('[data-filter-target="' + name + '"]');
    if (!target) return;
    var attr = target.getAttribute("data-filter-attr") || "data-cat";
    group.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      var val = btn.getAttribute("data-filter");
      group.querySelectorAll("[data-filter]").forEach(function (b) {
        var on = b === btn;
        if (b.hasAttribute("aria-selected")) b.setAttribute("aria-selected", String(on));
        if (b.hasAttribute("aria-pressed")) b.setAttribute("aria-pressed", String(on));
      });
      Array.prototype.forEach.call(target.children, function (el) {
        el.hidden = !(val === "all" || el.getAttribute(attr) === val);
      });
    });
  });

  /* ---------- Services: highlight the pill for the section in view ---------- */
  var pills = document.querySelectorAll(".pill-nav a[href^='#']");
  if (pills.length && "IntersectionObserver" in window) {
    var map = {};
    pills.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          pills.forEach(function (a) { a.classList.remove("is-active"); });
          map[en.target.id].classList.add("is-active");
          var strip = map[en.target.id].closest("ul");
          if (strip) strip.scrollTo({ left: map[en.target.id].offsetLeft - 20, behavior: "smooth" });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }
})();
