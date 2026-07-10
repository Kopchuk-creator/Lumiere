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

  /* --- Підписка на розсилку (головна). Точка інтеграції: email → сервіс розсилок.
         Згода на обробку email обов'язкова — як у формах запису та зворотного зв'язку. --- */
  var nlForm = document.getElementById('newsletter-form');
  if (nlForm) {
    var isEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };

    var nlErr = function (id, msg) {
      var input = document.getElementById(id);
      var err = document.getElementById(id + '-error');
      err.textContent = msg;
      err.classList.toggle('is-visible', !!msg);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    };

    /* Інлайн-валідація по blur — консистентно з рештою форм сайту */
    nlForm.addEventListener('focusout', function (e) {
      if (e.target.id !== 'nl-email') return;
      var v = e.target.value.trim();
      nlErr('nl-email', v && !isEmail(v) ? 'Вкажіть коректний email, напр. name@example.com.' : '');
    });
    nlForm.addEventListener('change', function (e) {
      if (e.target.id === 'nl-consent' && e.target.checked) nlErr('nl-consent', '');
    });

    nlForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('nl-email').value.trim();
      var consent = document.getElementById('nl-consent').checked;
      var note = document.getElementById('nl-note');
      var ok = true;

      if (!isEmail(email)) { nlErr('nl-email', 'Вкажіть коректний email, напр. name@example.com.'); ok = false; }
      else nlErr('nl-email', '');
      if (!consent) { nlErr('nl-consent', 'Без згоди на обробку email підписка неможлива.'); ok = false; }
      else nlErr('nl-consent', '');

      if (!ok) {
        note.classList.remove('is-visible');
        var firstInvalid = nlForm.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      /* Точка інтеграції: сюди підключається сервіс розсилок */
      console.log('NEWSLETTER_PAYLOAD', JSON.stringify({ email: email, consent: consent }));
      nlForm.reset();
      nlErr('nl-email', '');
      note.textContent = 'Дякуємо! Ви підписані на бьюті-поради Lumière ♡';
      note.classList.add('is-visible');
    });
  }

  /* --- Поточний рік у футері --- */
  var yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
