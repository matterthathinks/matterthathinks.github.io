// Shared behaviour across all pages: exam countdown + accordion toggles.
(function () {
  "use strict";

  // ---- Countdown to CAT exam day ----
  function initCountdown() {
    var el = document.querySelector("[data-countdown]");
    if (!el) return;
    var examDate = new Date("2026-11-29T00:00:00+05:30");
    var now = new Date();
    var msPerDay = 24 * 60 * 60 * 1000;
    var days = Math.ceil((examDate - now) / msPerDay);
    if (days > 0) {
      el.innerHTML = "<strong>T\u2212" + days + "</strong> days to CAT 2026";
    } else if (days === 0) {
      el.innerHTML = "<strong>Today</strong> is the exam";
    } else {
      el.innerHTML = "<strong>Good luck</strong> out there";
    }
  }

  // ---- Generic delegated accordion: subsections + PYQ cards ----
  function initAccordions() {
    document.addEventListener("click", function (e) {
      var subToggle = e.target.closest(".subsection__toggle");
      if (subToggle) {
        var subsection = subToggle.closest(".subsection");
        subsection.classList.toggle("is-open");
        subToggle.setAttribute(
          "aria-expanded",
          subsection.classList.contains("is-open") ? "true" : "false"
        );
        return;
      }
      var pyqToggle = e.target.closest(".pyq__q");
      if (pyqToggle) {
        var pyq = pyqToggle.closest(".pyq");
        pyq.classList.toggle("is-open");
        pyqToggle.setAttribute(
          "aria-expanded",
          pyq.classList.contains("is-open") ? "true" : "false"
        );
      }
    });
  }

  // Open a subsection if the URL hash targets it, and scroll to it.
  function openFromHash() {
    if (!location.hash) return;
    var target = document.querySelector(location.hash);
    if (target && target.classList.contains("subsection")) {
      target.classList.add("is-open");
      setTimeout(function () {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
  }
  window.qaOpenFromHash = openFromHash;

  document.addEventListener("DOMContentLoaded", function () {
    initCountdown();
    initAccordions();
    openFromHash();
  });
})();
