// NVVSpeech Challenge — Leaderboard interactions
// Mirrors the official site behaviour (navbar scroll state, section reveal,
// mobile nav toggle) and adds Track-card tab switching.

document.addEventListener('DOMContentLoaded', function () {
  var navbar = document.querySelector('.navbar');

  // 1. Scroll-based navbar styling
  if (navbar) {
    var onScroll = function () {
      navbar.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 2. Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 3. Section reveal-on-scroll (sections start at opacity:0)
  var sections = document.querySelectorAll('.section');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    sections.forEach(function (s) { revealObserver.observe(s); });

    // 4. Scrollspy nav highlighting
    var spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        document.querySelectorAll('.nav-links a').forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
        });
      });
    }, { threshold: 0.5 });
    sections.forEach(function (s) { if (s.id) spyObserver.observe(s); });
  } else {
    sections.forEach(function (s) { s.classList.add('is-visible'); });
  }

  // 5. Tab switching (scoped per track card)
  document.querySelectorAll('.lb-tabs').forEach(function (tablist) {
    var card = tablist.closest('.track-card') || document;
    var tabs = tablist.querySelectorAll('.lb-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var targetId = tab.getAttribute('data-panel');
        tabs.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
        card.querySelectorAll('.lb-panel').forEach(function (panel) {
          panel.classList.toggle('is-active', panel.id === targetId);
        });
      });
    });
  });

  // 6. Ranking-mode toggle: "Competition ranking" vs "All systems ranking".
  //    Competition mode reproduces the authored row order and rank numbers;
  //    all-systems mode re-sorts every evaluated system by score.
  var MEDALS = ['🥇', '🥈', '🥉']; // gold, silver, bronze
  var DASH = '–';

  var scoreOf = function (row) {
    var raw = row.getAttribute('data-score');
    if (raw === null || raw === '') return NaN;
    return parseFloat(raw);
  };

  var orderOf = function (row) {
    return parseInt(row.getAttribute('data-order'), 10) || 0;
  };

  // Built with DOM nodes rather than innerHTML: no escaping concerns, and no
  // stray "$" for MathJax to pick up on a later pass.
  var setRankCell = function (cell, text, medal) {
    while (cell.firstChild) cell.removeChild(cell.firstChild);
    if (medal) {
      var glyph = document.createElement('span');
      glyph.className = 'medal';
      glyph.appendChild(document.createTextNode(medal));
      cell.appendChild(glyph);
      cell.appendChild(document.createTextNode(' '));
    }
    cell.appendChild(document.createTextNode(text));
  };

  var initTable = function (table) {
    var tbody = table.tBodies[0];
    if (!tbody) return;
    var rows = Array.prototype.slice.call(tbody.rows);
    // Remember the authored order: the baseline/commercial rows are appended at
    // the bottom rather than score-sorted, so competition mode cannot re-derive it.
    rows.forEach(function (row, i) { row.setAttribute('data-order', String(i)); });
    table._origOrder = rows;
  };

  var applyTable = function (table, allSystems) {
    var tbody = table.tBodies[0];
    if (!tbody || !table._origOrder) return;

    var rows = table._origOrder.slice();
    if (allSystems) {
      rows.sort(function (a, b) {
        var sa = scoreOf(a), sb = scoreOf(b);
        var na = isNaN(sa), nb = isNaN(sb);
        if (na !== nb) return na ? 1 : -1; // scoreless rows sink to the bottom
        if (sa !== sb) return sb - sa;
        return orderOf(a) - orderOf(b);    // stable tiebreak
      });
    }
    rows.forEach(function (row) { tbody.appendChild(row); }); // re-append = reorder

    var rank = 0;
    rows.forEach(function (row) {
      var cell = row.querySelector('td.rank');
      if (!cell) return; // detail breakdown tables are not rankable
      if (allSystems) {
        rank += 1;
        setRankCell(cell, String(rank), null);
      } else if (row.getAttribute('data-ranked') === '1') {
        rank += 1;
        var medal = row.getAttribute('data-medal');
        setRankCell(cell, String(rank), medal ? MEDALS[medal - 1] : null);
      } else {
        setRankCell(cell, DASH, null);
      }
    });
  };

  document.querySelectorAll('.track-card').forEach(function (card) {
    var btns = card.querySelectorAll('.rank-toggle-btn');
    var tables = card.querySelectorAll('table[data-rankable]');
    if (!btns.length || !tables.length) return;

    tables.forEach(initTable);
    card.setAttribute('data-rank-mode', 'competition');

    var setMode = function (mode) {
      var allSystems = mode === 'all';
      card.setAttribute('data-rank-mode', mode);
      tables.forEach(function (table) { applyTable(table, allSystems); });
      btns.forEach(function (btn) {
        var on = btn.getAttribute('data-mode') === mode;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    };

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setMode(btn.getAttribute('data-mode'));
      });
    });

    // Normalise on load so the rank column always agrees with data-score.
    setMode('competition');
  });
});
