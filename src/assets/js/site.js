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
  /* ---------- Home: doctors carousel (circles that follow the cursor) ---------- */
  var cf = document.querySelector("[data-cf]");
  if (cf) {
    var cfStage = cf.querySelector("[data-cf-stage]");
    var cfItems = Array.prototype.slice.call(cf.querySelectorAll("[data-cf-item]"));
    var cfDots = Array.prototype.slice.call(cf.querySelectorAll("[data-cf-dot]"));
    var cfPrev = cf.querySelector("[data-cf-prev]");
    var cfNext = cf.querySelector("[data-cf-next]");
    var cfCaption = cf.querySelector("[data-cf-caption]");
    var cfDotsBox = cf.querySelector("[data-cf-dots]");
    var cfN = cfItems.length;

    if (cfStage && cfN > 1 && cfCaption) {
      // Size, horizontal offset and opacity by distance from the centre (in circle widths)
      var SIZES = [1, 0.745, 0.555, 0.41, 0.29];
      var XS = [0, 0.795, 1.25, 1.59, 1.86];
      var OPAC = [1, 0.86, 0.66, 0.46, 0];
      var interp = function (arr, a) {
        var t = Math.min(a, arr.length - 1);
        var lo = Math.floor(t);
        var hi = Math.min(lo + 1, arr.length - 1);
        return arr[lo] + (arr[hi] - arr[lo]) * (t - lo);
      };
      var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };

      var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      // Endless loop needs enough circles to fill both sides of the centre; fewer than that stays a plain, clamped row
      var loop = cfN >= 8;
      var pos = 0;
      var activeIdx = -1;
      var pending = false;
      var prevO = [];
      var mod = function (v) { return ((v % cfN) + cfN) % cfN; };
      // Offset from the centre, wrapped round the ring into [-n/2, n/2)
      var ringOffset = function (v) { return v - cfN * Math.round(v / cfN); };
      // Same position as t, but the copy nearest the current one, so the row takes the short way round
      var nearest = function (t) { return t + cfN * Math.round((pos - t) / cfN); };

      var q = function (el, sel) { return el.querySelector(sel); };
      var setText = function (sel, value) { q(cfCaption, sel).textContent = value; };

      var showCaption = function (i) {
        var item = cfItems[i];
        setText("[data-cf-name]", item.getAttribute("data-name"));
        setText("[data-cf-dept]", item.getAttribute("data-dept"));
        setText("[data-cf-quals]", item.getAttribute("data-quals"));
        setText("[data-cf-reg]", item.getAttribute("data-reg"));
        q(cfCaption, "[data-cf-link]").setAttribute("href", item.getAttribute("data-href"));
      };

      var place = function (item, o, base) {
        var a = Math.abs(o);
        var x = (o < 0 ? -1 : 1) * interp(XS, a) * base;
        item.style.transform = "translateX(" + x.toFixed(1) + "px) scale(" + interp(SIZES, a).toFixed(3) + ")";
        item.style.opacity = interp(OPAC, a).toFixed(3);
        item.style.zIndex = String(Math.round(100 - a * 10));
      };

      var render = function () {
        pending = false;
        var base = cfItems[0].offsetWidth;
        if (loop && Math.abs(pos) > cfN * 4) pos -= cfN * Math.round(pos / cfN); // keep the number small, same picture
        var idx = loop ? mod(Math.round(pos)) : clamp(Math.round(pos), 0, cfN - 1);
        var offsets = cfItems.map(function (item, i) { return loop ? ringOffset(i - pos) : i - pos; });
        var jumped = [];
        if (loop) {
          // A circle that goes round the back restarts at the hidden far side (no transition), so it fades in
          // there instead of sliding across the whole row
          cfItems.forEach(function (item, i) {
            var prev = prevO[i];
            if (prev !== undefined && Math.abs(offsets[i] - prev) > cfN / 2) {
              item.style.transition = "none";
              place(item, offsets[i] > prev ? prev + cfN : prev - cfN, base);
              jumped.push(item);
            }
          });
          if (jumped.length) void cfStage.offsetWidth;
          jumped.forEach(function (item) { item.style.transition = ""; });
        }
        cfItems.forEach(function (item, i) {
          var o = offsets[i];
          var a = Math.abs(o);
          var visible = a <= 3.5;
          prevO[i] = o;
          place(item, o, base);
          item.classList.toggle("is-active", i === idx);
          var link = item.querySelector("a");
          link.setAttribute("tabindex", visible ? "0" : "-1");
          if (visible) { item.removeAttribute("aria-hidden"); } else { item.setAttribute("aria-hidden", "true"); }
        });
        cfDots.forEach(function (d, i) { d.setAttribute("aria-current", i === idx ? "true" : "false"); });
        cfPrev.setAttribute("aria-disabled", String(!loop && idx <= 0));
        cfNext.setAttribute("aria-disabled", String(!loop && idx >= cfN - 1));
        if (idx !== activeIdx) {
          activeIdx = idx;
          showCaption(idx);
        }
      };
      var schedule = function () {
        if (pending) return;
        pending = true;
        window.requestAnimationFrame(render);
      };
      var goTo = function (i) {
        pos = loop ? nearest(i) : clamp(i, 0, cfN - 1);
        schedule();
      };
      var step = function (dir) {
        if (loop) {
          pos = Math.round(pos) + dir;
        } else {
          var t = activeIdx + dir;
          if (t < 0 || t > cfN - 1) return;
          pos = t;
        }
        schedule();
      };

      cf.classList.add("is-ready");
      cfCaption.hidden = false;
      if (cfDotsBox) cfDotsBox.hidden = false;
      render();

      cfPrev.addEventListener("click", function () { step(-1); });
      cfNext.addEventListener("click", function () { step(1); });
      cfDots.forEach(function (d, i) { d.addEventListener("click", function () { goTo(i); }); });

      // Mouse: the row follows the cursor across the stage
      if (finePointer && !reduced) {
        cfStage.addEventListener("pointermove", function (e) {
          if (e.pointerType && e.pointerType !== "mouse") return;
          var r = cfStage.getBoundingClientRect();
          if (!(r.width > 0)) return;
          var margin = Math.min(cfItems[0].offsetWidth * 0.64, r.width * 0.15);
          var u = clamp((e.clientX - r.left - margin) / (r.width - 2 * margin), 0, 1);
          var target = u * (cfN - 1);
          pos = loop ? nearest(target) : target;
          schedule();
        });
        cfStage.addEventListener("pointerleave", function () {
          pos = loop ? Math.round(pos) : clamp(Math.round(pos), 0, cfN - 1);
          schedule();
        });
      }

      // Touch and keyboard: a tap on a side circle brings it to the centre first
      cfStage.addEventListener("click", function (e) {
        var item = e.target.closest("[data-cf-item]");
        if (!item || finePointer) return;
        var i = cfItems.indexOf(item);
        if (i !== activeIdx) {
          e.preventDefault();
          goTo(i);
        }
      });
      cfStage.addEventListener("focusin", function (e) {
        var item = e.target.closest("[data-cf-item]");
        if (item) goTo(cfItems.indexOf(item));
      });
      cf.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      });
      window.addEventListener("resize", schedule);
    }
  }
})();
