/* Lumière — спільні скрипти: мобільне меню, галерея до/після */
(function () {
  'use strict';

  /* --- Мобільне меню --- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* --- Галерея: фільтри за категорією --- */
  var filterBar = document.querySelector('.gallery-filters');
  if (filterBar) {
    var chips = filterBar.querySelectorAll('.chip');
    var works = document.querySelectorAll('.work');
    filterBar.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      var cat = chip.dataset.filter;
      works.forEach(function (w) {
        w.hidden = (cat !== 'all' && w.dataset.category !== cat);
      });
    });
  }

  /* --- Галерея: перемикач до/після --- */
  document.querySelectorAll('.work__toggle').forEach(function (tgl) {
    tgl.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var work = tgl.closest('.work');
      var state = btn.dataset.state; /* 'before' | 'after' */
      tgl.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      work.querySelectorAll('.work__imgs img').forEach(function (img) {
        img.dataset.state = (img.dataset.role === state) ? 'visible' : 'hidden';
      });
    });
  });

  /* --- Підписка на розсилку (головна). Точка інтеграції: email → сервіс розсилок --- */
  var nlForm = document.getElementById('newsletter-form');
  if (nlForm) {
    nlForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('nl-email');
      var note = document.getElementById('nl-note');
      var email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        note.textContent = 'Вкажіть коректний email, напр. name@example.com.';
        note.style.color = 'var(--c-error)';
        note.classList.add('is-visible');
        input.focus();
        return;
      }
      /* Точка інтеграції: сюди підключається сервіс розсилок */
      console.log('NEWSLETTER_PAYLOAD', JSON.stringify({ email: email }));
      nlForm.reset();
      note.textContent = 'Дякуємо! Ви підписані на бьюті-поради Lumière ♡';
      note.style.color = 'var(--c-success)';
      note.classList.add('is-visible');
    });
  }

  /* --- Поточний рік у футері --- */
  var yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
