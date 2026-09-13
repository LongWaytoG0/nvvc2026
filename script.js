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
});
