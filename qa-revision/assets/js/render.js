// Builds a chapter page from its data/<section>.json file.
(function () {
  "use strict";

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function renderFormula(f) {
    var li = el("li", "formula");
    if (f.label) li.appendChild(el("div", "formula__label", f.label));
    var mathWrap = el("div", "formula__math");
    var span = el("span");
    span.textContent = f.latex; // KaTeX auto-render reads this text
    span.setAttribute("data-latex", "true");
    mathWrap.appendChild(span);
    li.appendChild(mathWrap);
    return li;
  }

  function renderPyqs(pyqs) {
    var wrap = el("div", "pyqs");
    wrap.appendChild(el("p", "pyqs__label", "PYQs \u2014 tap to reveal solution"));
    if (!pyqs || pyqs.length === 0) {
      wrap.appendChild(
        el(
          "div",
          "pyq-empty",
          "No PYQs filed here yet \u2014 send them over and they\u2019ll slot into this section."
        )
      );
      return wrap;
    }
    pyqs.forEach(function (p) {
      var card = el("div", "pyq");
      var qBtn = el("button", "pyq__q");
      qBtn.type = "button";
      qBtn.setAttribute("aria-expanded", "false");
      if (p.tag) qBtn.appendChild(el("span", "pyq__tag", p.tag));
      qBtn.appendChild(el("span", "pyq__qtext", p.q));
      card.appendChild(qBtn);
      var aBox = el(
        "div",
        "pyq__a",
        "<strong>Answer.</strong> " + (p.a || "")
      );
      card.appendChild(aBox);
      wrap.appendChild(card);
    });
    return wrap;
  }

  function renderSubsection(sub, index) {
    var section = el("section", "subsection");
    section.id = sub.id;
    if (index === 0) section.classList.add("is-open");

    var toggle = el("button", "subsection__toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", index === 0 ? "true" : "false");
    toggle.appendChild(el("h3", "subsection__title", sub.title));
    toggle.appendChild(el("span", "subsection__chevron", "+"));
    section.appendChild(toggle);

    var body = el("div", "subsection__body");
    if (sub.trick) {
      var trick = el("div", "trick");
      trick.appendChild(el("span", "trick__label", "Quick trick"));
      trick.appendChild(document.createTextNode(sub.trick));
      body.appendChild(trick);
    }
    var list = el("ul", "formulas");
    (sub.formulas || []).forEach(function (f) {
      list.appendChild(renderFormula(f));
    });
    body.appendChild(list);
    body.appendChild(renderPyqs(sub.pyqs));
    section.appendChild(body);

    return section;
  }

  function renderJump(subsections) {
    var nav = el("nav", "jumpto");
    subsections.forEach(function (s) {
      var a = el("a", null, s.title);
      a.href = "#" + s.id;
      nav.appendChild(a);
    });
    return nav;
  }

  function boot() {
    var root = document.querySelector("[data-chapter-root]");
    if (!root) return;
    var file = root.getAttribute("data-chapter-root");

    fetch(file)
      .then(function (r) {
        if (!r.ok) throw new Error("Could not load " + file);
        return r.json();
      })
      .then(function (data) {
        var eyebrow = document.querySelector("[data-chapter-eyebrow]");
        var titleEl = document.querySelector("[data-chapter-title]");
        var taglineEl = document.querySelector("[data-chapter-tagline]");
        if (eyebrow) eyebrow.textContent = "Chapter " + data.chapter;
        if (titleEl) titleEl.textContent = data.title;
        if (taglineEl) taglineEl.textContent = data.tagline;
        document.title = data.title + " \u2014 QA Revision \u2014 Matter That Thinks";

        var jumpHost = document.querySelector("[data-jumpto]");
        if (jumpHost) jumpHost.appendChild(renderJump(data.subsections));

        data.subsections.forEach(function (sub, i) {
          root.appendChild(renderSubsection(sub, i));
        });

        if (window.renderMathInElement) {
          window.renderMathInElement(root, {
            delimiters: [],
            ignoredTags: [],
          });
        }
        // Fallback: render each [data-latex] span individually via katex.render
        if (window.katex) {
          root.querySelectorAll('[data-latex="true"]').forEach(function (span) {
            try {
              window.katex.render(span.textContent, span, {
                throwOnError: false,
                displayMode: false,
              });
            } catch (err) {
              /* leave raw text if it fails to parse */
            }
          });
        }

        if (window.qaOpenFromHash) window.qaOpenFromHash();
      })
      .catch(function (err) {
        root.appendChild(
          el(
            "p",
            null,
            "Couldn\u2019t load this chapter\u2019s content (" + err.message + ")."
          )
        );
      });
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
