/* ============================================
   Lumière — багатокрокова форма запису
   Кроки: 1 Послуга → 2 Майстер → 3 Дата і час →
          4 Контакти → 5 Перевірка → Підтвердження
   ============================================ */
(function () {
  'use strict';

  var form = document.getElementById('booking-form');
  if (!form) return;

  var stepContainer = document.getElementById('step-container');
  var progressEl = document.getElementById('booking-progress');
  var announcer = document.getElementById('step-announcer');

  var STEP_TITLES = ['Оберіть послугу', 'Оберіть майстра', 'Дата і час', 'Ваші контакти', 'Перевірте запис'];
  var TOTAL_STEPS = 5;
  var DAYS_AHEAD = 14;
  var WEEKDAYS_SHORT = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  var MONTHS_GEN = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

  var state = {
    step: 1,
    serviceId: null,
    masterId: null,   /* id майстра або 'any' */
    date: null,       /* 'YYYY-MM-DD' */
    time: null,       /* 'HH:00' */
    name: '',
    phone: '',
    email: '',
    comment: '',
    consent: false
  };

  /* ---------- Валідація ---------- */
  function isValidUAPhone(rawInput) {
    var digits = rawInput.replace(/\D/g, '');
    return /^0\d{9}$/.test(digits) || /^380\d{9}$/.test(digits);
  }
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  /* ---------- Слоти (детерміновано «зайняті» — імітація графіка).
     Точка інтеграції: у продакшені зайнятість приходить з CRM/API. ---------- */
  function slotHash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }
  function isSlotTaken(masterId, dateStr, hour) {
    return slotHash(masterId + dateStr + hour) % 10 < 3; /* ~30% зайнято */
  }
  function mastersForService() {
    return state.serviceId ? getMastersByService(state.serviceId) : [];
  }
  function activeMasters() {
    if (state.masterId === 'any') return mastersForService();
    var m = getMasterById(state.masterId);
    return m ? [m] : [];
  }
  function masterWorksOn(master, weekday) {
    return master.workDays.indexOf(weekday) !== -1;
  }
  function dayHasWork(dateObj) {
    var wd = dateObj.getDay();
    return activeMasters().some(function (m) { return masterWorksOn(m, wd); });
  }
  /* Слоти на день: об'єднання годин активних майстрів */
  function slotsForDay(dateStr, weekday) {
    var slots = {}; /* hour -> {free: bool, masters: []} */
    activeMasters().forEach(function (m) {
      if (!masterWorksOn(m, weekday)) return;
      for (var h = m.hours[0]; h < m.hours[1]; h++) {
        if (!slots[h]) slots[h] = { free: false, masters: [] };
        if (!isSlotTaken(m.id, dateStr, h)) {
          slots[h].free = true;
          slots[h].masters.push(m.id);
        }
      }
    });
    return Object.keys(slots).map(Number).sort(function (a, b) { return a - b; })
      .map(function (h) { return { hour: h, free: slots[h].free, masters: slots[h].masters }; });
  }
  function nextDays() {
    var days = [];
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    for (var i = 1; i <= DAYS_AHEAD; i++) {
      var day = new Date(d);
      day.setDate(d.getDate() + i);
      days.push(day);
    }
    return days;
  }
  function toDateStr(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + dd;
  }
  function formatDateHuman(dateStr) {
    var parts = dateStr.split('-');
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.getDate() + ' ' + MONTHS_GEN[d.getMonth()] + ', ' + WEEKDAYS_SHORT[d.getDay()].toLowerCase();
  }

  /* ---------- Побудова HTML ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderProgress() {
    var items = progressEl.querySelectorAll('li');
    items.forEach(function (li, i) {
      var n = i + 1;
      li.classList.toggle('is-done', n < state.step);
      if (n === state.step) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
  }

  function stepHeader(title, sub) {
    return '<legend id="step-title" tabindex="-1">' + esc(title) + '</legend>' +
      (sub ? '<p class="step-sub">' + esc(sub) + '</p>' : '');
  }

  function navButtons(nextLabel) {
    var html = '<div class="booking-nav">';
    if (state.step > 1) {
      html += '<button type="button" class="btn btn--ghost btn--back" data-action="back">← Назад</button>';
    }
    html += '<button type="button" class="btn btn--bordo" data-action="next">' +
      esc(nextLabel || 'Далі →') + '</button></div>';
    html += '<p class="step-error" id="step-error" role="alert"></p>';
    return html;
  }

  /* Крок 1 — послуга */
  function renderStep1() {
    var html = '<fieldset>' + stepHeader('Оберіть послугу', 'Одна послуга на запис. Ціни вказані «від».');
    CATEGORIES.forEach(function (cat) {
      var services = SERVICES.filter(function (s) { return s.category === cat.id; });
      html += '<p class="booking-cat-label">' + esc(cat.name) + '</p>';
      html += '<div class="pick-grid" role="group" aria-label="' + esc(cat.name) + '">';
      services.forEach(function (s) {
        var pressed = state.serviceId === s.id;
        html += '<button type="button" class="pick-card" data-service="' + s.id + '" aria-pressed="' + pressed + '">' +
          '<span class="pick-card__name">' + esc(s.name) + '</span>' +
          '<span class="pick-card__meta">' + formatDuration(s.duration) + ' · від ' + formatPrice(s.price) + '</span>' +
          '</button>';
      });
      html += '</div>';
    });
    html += navButtons() + '</fieldset>';
    return html;
  }

  /* Крок 2 — майстер */
  function renderStep2() {
    var service = getServiceById(state.serviceId);
    var masters = mastersForService();
    var html = '<fieldset>' + stepHeader('Оберіть майстра',
      'Майстри, які виконують послугу «' + service.name + '».');
    html += '<div class="pick-grid">';
    html += '<button type="button" class="pick-card pick-card--master" data-master="any" aria-pressed="' + (state.masterId === 'any') + '">' +
      '<span><span class="pick-card__name">Будь-який вільний майстер</span>' +
      '<span class="pick-card__desc">Більше вільних годин — оберемо для вас найближчий час.</span></span>' +
      '</button>';
    masters.forEach(function (m) {
      var pressed = state.masterId === m.id;
      html += '<button type="button" class="pick-card pick-card--master" data-master="' + m.id + '" aria-pressed="' + pressed + '">' +
        '<span class="mirror"><img src="' + m.photo + '" alt="" width="64" height="64"></span>' +
        '<span><span class="pick-card__name">' + esc(m.name) + '</span>' +
        '<span class="pick-card__meta">' + esc(m.role) + '</span></span>' +
        '</button>';
    });
    html += '</div>' + navButtons() + '</fieldset>';
    return html;
  }

  /* Крок 3 — дата і час */
  function renderStep3() {
    var html = '<fieldset>' + stepHeader('Дата і час',
      'Зайняті години позначені перекресленими — їх не можна обрати.');
    html += '<p class="booking-cat-label">Дата</p><div class="days-scroll" role="group" aria-label="Оберіть дату">';
    nextDays().forEach(function (d) {
      var ds = toDateStr(d);
      var enabled = dayHasWork(d);
      html += '<button type="button" class="day-btn" data-date="' + ds + '" ' +
        (enabled ? '' : 'disabled ') +
        'aria-pressed="' + (state.date === ds) + '" ' +
        'aria-label="' + d.getDate() + ' ' + MONTHS_GEN[d.getMonth()] + (enabled ? '' : ', вихідний майстра') + '">' +
        '<span class="day-btn__wd">' + WEEKDAYS_SHORT[d.getDay()] + '</span>' +
        '<span class="day-btn__num">' + d.getDate() + '</span>' +
        '</button>';
    });
    html += '</div>';
    html += '<p class="booking-cat-label">Час</p><div class="slots-grid" id="slots-grid" role="group" aria-label="Оберіть час">';
    html += renderSlots();
    html += '</div>' + navButtons() + '</fieldset>';
    return html;
  }

  function renderSlots() {
    if (!state.date) return '<p class="slots-empty">Спершу оберіть дату.</p>';
    var parts = state.date.split('-');
    var wd = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getDay();
    var slots = slotsForDay(state.date, wd);
    if (!slots.length) return '<p class="slots-empty">На цю дату немає прийому — оберіть інший день.</p>';
    return slots.map(function (s) {
      var t = String(s.hour).padStart(2, '0') + ':00';
      return '<button type="button" class="slot-btn" data-time="' + t + '" ' +
        (s.free ? '' : 'disabled ') +
        'aria-pressed="' + (state.time === t) + '"' +
        (s.free ? '' : ' aria-label="' + t + ', зайнято"') + '>' + t + '</button>';
    }).join('');
  }

  /* Крок 4 — контакти */
  function renderStep4() {
    var html = '<fieldset>' + stepHeader('Ваші контакти', 'Адміністратор зателефонує для підтвердження запису.');
    html +=
      '<div class="form-field">' +
      '<label for="bf-name">Ім’я <span class="req" aria-hidden="true">*</span></label>' +
      '<input type="text" id="bf-name" name="name" autocomplete="name" required ' +
      'aria-describedby="bf-name-error" value="' + esc(state.name) + '">' +
      '<p class="field-error" id="bf-name-error"></p></div>' +

      '<div class="form-field">' +
      '<label for="bf-phone">Телефон <span class="req" aria-hidden="true">*</span></label>' +
      '<input type="tel" id="bf-phone" name="phone" autocomplete="tel" required inputmode="tel" ' +
      'aria-describedby="bf-phone-hint bf-phone-error" value="' + esc(state.phone) + '">' +
      '<p class="field-hint" id="bf-phone-hint">Формат: 067 123 45 67 або +380 67 123 45 67 — пробіли, дужки та дефіси допустимі.</p>' +
      '<p class="field-error" id="bf-phone-error"></p></div>' +

      '<div class="form-field">' +
      '<label for="bf-email">Email <span class="req" aria-hidden="true">*</span></label>' +
      '<input type="email" id="bf-email" name="email" autocomplete="email" required ' +
      'aria-describedby="bf-email-error" value="' + esc(state.email) + '">' +
      '<p class="field-error" id="bf-email-error"></p></div>' +

      '<div class="form-field">' +
      '<label for="bf-comment">Побажання (необов’язково)</label>' +
      '<textarea id="bf-comment" name="comment" rows="3" ' +
      'placeholder="Наприклад: алергія на певні засоби, бажаний дизайн…">' + esc(state.comment) + '</textarea></div>' +

      '<div class="checkbox-field">' +
      '<input type="checkbox" id="bf-consent" name="consent" ' + (state.consent ? 'checked ' : '') +
      'aria-describedby="bf-consent-error">' +
      '<label for="bf-consent">Я даю згоду на обробку моїх персональних даних відповідно до ' +
      '<a href="privacy.html" target="_blank" rel="noopener">Політики конфіденційності</a> ' +
      '<span class="req" aria-hidden="true">*</span></label></div>' +
      '<p class="field-error" id="bf-consent-error"></p>';

    html += navButtons() + '</fieldset>';
    return html;
  }

  /* Крок 5 — перевірка */
  function renderStep5() {
    var service = getServiceById(state.serviceId);
    var masterName = state.masterId === 'any'
      ? 'Будь-який вільний майстер'
      : getMasterById(state.masterId).name;

    function block(title, body, gotoStep) {
      return '<div class="review-block"><div><h3>' + title + '</h3><p>' + body + '</p></div>' +
        '<button type="button" class="btn-edit" data-goto="' + gotoStep + '" ' +
        'aria-label="Змінити: ' + title + '">Змінити</button></div>';
    }

    var html = '<fieldset>' + stepHeader('Перевірте запис', 'Переконайтесь, що все правильно, і підтвердіть запис.');
    html += block('Послуга', esc(service.name) + ' · ' + formatDuration(service.duration) + ' · від ' + formatPrice(service.price), 1);
    html += block('Майстер', esc(masterName), 2);
    html += block('Дата і час', formatDateHuman(state.date) + ' о ' + state.time, 3);
    html += block('Контакти',
      esc(state.name) + '<br>' + esc(state.phone) + '<br>' + esc(state.email) +
      (state.comment ? '<br><em>«' + esc(state.comment) + '»</em>' : ''), 4);
    html += navButtons('Підтвердити запис ✓') + '</fieldset>';
    return html;
  }

  /* Екран підтвердження */
  function renderSuccess() {
    var service = getServiceById(state.serviceId);
    progressEl.hidden = true;
    stepContainer.innerHTML =
      '<div class="booking-success">' +
      '<div class="booking-success__icon" aria-hidden="true">✓</div>' +
      '<h2 id="step-title" tabindex="-1">Запис прийнято!</h2>' +
      '<p>' + esc(state.name) + ', чекаємо на вас <strong>' + formatDateHuman(state.date) +
      ' о ' + state.time + '</strong> на послугу «' + esc(service.name) + '».</p>' +
      '<p>Адміністратор зателефонує на <strong>' + esc(state.phone) + '</strong> для підтвердження.</p>' +
      '<p><a class="btn btn--gold" href="index.html">На головну</a></p>' +
      '</div>';
    announce('Запис підтверджено');
    focusTitle();

    /* Точка інтеграції: сюди підключається відправлення в CRM/бекенд */
    console.log('BOOKING_PAYLOAD', JSON.stringify({
      serviceId: state.serviceId,
      masterId: state.masterId,
      date: state.date,
      time: state.time,
      name: state.name,
      phone: state.phone,
      email: state.email,
      comment: state.comment,
      consent: state.consent
    }));
  }

  /* ---------- Рендер і навігація ---------- */
  var renderers = { 1: renderStep1, 2: renderStep2, 3: renderStep3, 4: renderStep4, 5: renderStep5 };

  function renderStep(focusHeading) {
    stepContainer.innerHTML = renderers[state.step]();
    renderProgress();
    syncNextDisabled();
    announce('Крок ' + state.step + ' з ' + TOTAL_STEPS + ': ' + STEP_TITLES[state.step - 1]);
    if (focusHeading) focusTitle();
  }

  function focusTitle() {
    var t = document.getElementById('step-title');
    if (t) t.focus();
  }
  function announce(msg) {
    announcer.textContent = msg;
  }

  /* Кнопка «Далі» на кроці 4 заблокована без згоди */
  function syncNextDisabled() {
    if (state.step !== 4) return;
    var next = stepContainer.querySelector('[data-action="next"]');
    if (next) next.disabled = !state.consent;
  }

  function showStepError(msg) {
    var el = document.getElementById('step-error');
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('is-visible', !!msg);
  }

  function setFieldError(inputId, msg) {
    var input = document.getElementById(inputId);
    var err = document.getElementById(inputId + '-error');
    if (!input || !err) return;
    err.textContent = msg;
    err.classList.toggle('is-visible', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function validateStep() {
    showStepError('');
    switch (state.step) {
      case 1:
        if (!state.serviceId) { showStepError('Оберіть послугу, щоб продовжити.'); return false; }
        return true;
      case 2:
        if (!state.masterId) { showStepError('Оберіть майстра або варіант «Будь-який вільний майстер».'); return false; }
        return true;
      case 3:
        if (!state.date) { showStepError('Оберіть дату візиту.'); return false; }
        if (!state.time) { showStepError('Оберіть вільний час.'); return false; }
        return true;
      case 4:
        var ok = true;
        if (state.name.trim().length < 2) { setFieldError('bf-name', 'Вкажіть ім’я (мінімум 2 символи).'); ok = false; }
        else setFieldError('bf-name', '');
        if (!isValidUAPhone(state.phone)) { setFieldError('bf-phone', 'Вкажіть коректний український номер, напр. 067 123 45 67.'); ok = false; }
        else setFieldError('bf-phone', '');
        if (!isValidEmail(state.email)) { setFieldError('bf-email', 'Вкажіть коректний email, напр. name@example.com.'); ok = false; }
        else setFieldError('bf-email', '');
        if (!state.consent) { setFieldError('bf-consent', 'Без згоди на обробку даних запис неможливий.'); ok = false; }
        else setFieldError('bf-consent', '');
        if (!ok) {
          var firstInvalid = stepContainer.querySelector('[aria-invalid="true"]');
          if (firstInvalid) firstInvalid.focus();
        }
        return ok;
      default:
        return true;
    }
  }

  function goNext() {
    if (!validateStep()) return;
    if (state.step === TOTAL_STEPS) { renderSuccess(); return; }
    state.step++;
    renderStep(true);
  }
  function goBack() {
    if (state.step === 1) return;
    state.step--;
    renderStep(true);
  }
  function goToStep(n) {
    state.step = n;
    renderStep(true);
  }

  /* ---------- Обробники подій (делегування) ---------- */
  stepContainer.addEventListener('click', function (e) {
    var t = e.target;

    var action = t.closest('[data-action]');
    if (action) {
      if (action.dataset.action === 'next') goNext();
      else if (action.dataset.action === 'back') goBack();
      return;
    }

    var gotoBtn = t.closest('[data-goto]');
    if (gotoBtn) { goToStep(Number(gotoBtn.dataset.goto)); return; }

    var serviceBtn = t.closest('[data-service]');
    if (serviceBtn) {
      var newService = serviceBtn.dataset.service;
      if (state.serviceId !== newService) {
        state.serviceId = newService;
        /* скидаємо майстра, якщо він не виконує нову послугу */
        if (state.masterId && state.masterId !== 'any') {
          var m = getMasterById(state.masterId);
          if (!m || m.serviceIds.indexOf(newService) === -1) {
            state.masterId = null; state.date = null; state.time = null;
          }
        }
        if (state.masterId === 'any') { state.date = null; state.time = null; }
      }
      stepContainer.querySelectorAll('[data-service]').forEach(function (b) {
        b.setAttribute('aria-pressed', b === serviceBtn ? 'true' : 'false');
      });
      showStepError('');
      return;
    }

    var masterBtn = t.closest('[data-master]');
    if (masterBtn) {
      if (state.masterId !== masterBtn.dataset.master) {
        state.masterId = masterBtn.dataset.master;
        state.date = null; state.time = null;
      }
      stepContainer.querySelectorAll('[data-master]').forEach(function (b) {
        b.setAttribute('aria-pressed', b === masterBtn ? 'true' : 'false');
      });
      showStepError('');
      return;
    }

    var dayBtn = t.closest('[data-date]');
    if (dayBtn && !dayBtn.disabled) {
      state.date = dayBtn.dataset.date;
      state.time = null;
      stepContainer.querySelectorAll('[data-date]').forEach(function (b) {
        b.setAttribute('aria-pressed', b === dayBtn ? 'true' : 'false');
      });
      document.getElementById('slots-grid').innerHTML = renderSlots();
      showStepError('');
      return;
    }

    var slotBtn = t.closest('[data-time]');
    if (slotBtn && !slotBtn.disabled) {
      state.time = slotBtn.dataset.time;
      stepContainer.querySelectorAll('[data-time]').forEach(function (b) {
        b.setAttribute('aria-pressed', b === slotBtn ? 'true' : 'false');
      });
      showStepError('');
    }
  });

  /* Поля контактів: зберігаємо в state, щоб «Назад» не губив дані */
  stepContainer.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'bf-name') state.name = t.value;
    else if (t.id === 'bf-phone') state.phone = t.value;
    else if (t.id === 'bf-email') state.email = t.value;
    else if (t.id === 'bf-comment') state.comment = t.value;
  });
  /* Інлайн-валідація по blur: помилка з'являється одразу після втрати фокусу.
     Порожні поля не чіпаємо — «обов'язковість» перевіряється кнопкою «Далі». */
  stepContainer.addEventListener('focusout', function (e) {
    var t = e.target;
    if (t.id === 'bf-name') {
      setFieldError('bf-name', t.value.trim() && t.value.trim().length < 2 ? 'Вкажіть ім’я (мінімум 2 символи).' : '');
    } else if (t.id === 'bf-phone') {
      setFieldError('bf-phone', t.value.trim() && !isValidUAPhone(t.value) ? 'Вкажіть коректний український номер, напр. 067 123 45 67.' : '');
    } else if (t.id === 'bf-email') {
      setFieldError('bf-email', t.value.trim() && !isValidEmail(t.value) ? 'Вкажіть коректний email, напр. name@example.com.' : '');
    }
  });

  stepContainer.addEventListener('change', function (e) {
    if (e.target.id === 'bf-consent') {
      state.consent = e.target.checked;
      if (state.consent) setFieldError('bf-consent', '');
      syncNextDisabled();
    }
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); goNext(); });

  /* ---------- Попередній вибір послуги з query-параметра ---------- */
  var params = new URLSearchParams(window.location.search);
  var preselect = params.get('service');
  if (preselect && getServiceById(preselect)) {
    state.serviceId = preselect;
  }

  renderStep(false);
})();
