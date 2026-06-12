/* ============================================================
   app.js, interactions for the explorable demo
   accordions · disclaimer · mega-nav (click/keyboard) ·
   mobile drawer · gallery thumbs · sticky header ·
   reveal-on-scroll
   ============================================================ */
(function () {
  'use strict';

  /* ---- Accordions (smooth height + icon morph) ---- */
  function setOpen(el, bodySel, open) {
    var body = el.querySelector(bodySel);
    el.classList.toggle('is-open', open);
    if (!body) return;
    body.style.maxHeight = open ? (body.scrollHeight + 'px') : '0px';
  }
  document.querySelectorAll('.acc').forEach(function (acc) {
    var head = acc.querySelector('.acc__head');
    // initialise from default markup state
    setOpen(acc, '.acc__body', acc.classList.contains('is-open'));
    if (head) head.addEventListener('click', function () {
      setOpen(acc, '.acc__body', !acc.classList.contains('is-open'));
    });
  });
  document.querySelectorAll('.disclaimer').forEach(function (d) {
    var head = d.querySelector('.disclaimer__head');
    setOpen(d, '.disclaimer__body', d.classList.contains('is-open'));
    if (head) head.addEventListener('click', function () {
      setOpen(d, '.disclaimer__body', !d.classList.contains('is-open'));
    });
  });
  // keep open accordions sized correctly on resize
  window.addEventListener('resize', function () {
    document.querySelectorAll('.acc.is-open, .disclaimer.is-open').forEach(function (el) {
      var body = el.querySelector('.acc__body, .disclaimer__body');
      if (body) body.style.maxHeight = body.scrollHeight + 'px';
    });
  });

  /* ---- Mega / dropdown nav: hover (desktop) ---- */
  var isMobile = function () { return window.innerWidth < 1024; };
  document.querySelectorAll('.mainnav__item').forEach(function (item) {
    if (!item.querySelector('.mega, .menu')) return;
    var timer;
    item.addEventListener('mouseenter', function () {
      if (isMobile()) return;
      clearTimeout(timer);
      document.querySelectorAll('.mainnav__item.is-open').forEach(function (o) { o.classList.remove('is-open'); });
      item.classList.add('is-open');
    });
    item.addEventListener('mouseleave', function () {
      if (isMobile()) return;
      timer = setTimeout(function () { item.classList.remove('is-open'); }, 120);
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.mainnav__item')) {
      document.querySelectorAll('.mainnav__item.is-open').forEach(function (o) { o.classList.remove('is-open'); });
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.mainnav__item.is-open').forEach(function (o) { o.classList.remove('is-open'); });
  });

  /* ---- Mobile drawer ---- */
  var drawer = document.querySelector('.drawer');
  var backdrop = document.querySelector('.drawer-backdrop');
  function openDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    if (backdrop) backdrop.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  var burger = document.querySelector('.hamburger');
  if (burger) burger.addEventListener('click', function () { openDrawer(true); });
  if (backdrop) backdrop.addEventListener('click', function () { openDrawer(false); });
  var closeBtn = document.querySelector('.drawer__close');
  if (closeBtn) closeBtn.addEventListener('click', function () { openDrawer(false); });
  document.querySelectorAll('.drawer__toggle').forEach(function (t) {
    t.addEventListener('click', function () {
      var group = t.closest('.drawer__group');
      var sub = group.querySelector('.drawer__sub');
      var open = group.classList.toggle('is-open');
      if (sub) sub.style.maxHeight = open ? (sub.scrollHeight + 'px') : '0px';
    });
  });

  /* ---- Gallery thumbnail switch ---- */
  var main = document.querySelector('.gallery__main img');
  document.querySelectorAll('.gthumb').forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      var img = thumb.querySelector('img');
      if (!img || !main) return;
      main.style.opacity = '0';
      setTimeout(function () { main.src = img.src; main.alt = img.alt; main.style.opacity = '1'; }, 140);
      document.querySelectorAll('.gthumb').forEach(function (t) { t.classList.remove('gthumb--active'); });
      thumb.classList.add('gthumb--active');
    });
  });
  if (main) main.style.transition = 'opacity .25s ease';

  /* ---- Sticky header state ---- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 8); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Reveal on scroll ---- */
  var reveals = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }
})();
