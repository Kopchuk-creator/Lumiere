/* ============================================
   Lumière Shop — кошик і чекаут
   - стан у localStorage (переживає перезавантаження)
   - бічна панель (drawer) з focus trap та Esc
   - чекаут: Доставка / Самовивіз, оплата,
     обов'язкова згода, псевдо-номер замовлення
   ============================================ */
(function () {
  'use strict';

  if (typeof SHOP_PRODUCTS === 'undefined') return;
  var toggle = document.getElementById('cart-toggle');
  if (!toggle) return;

  var STORAGE_KEY = 'lumiereCart';
  var SEQ_KEY = 'lumiereOrderSeq';

  /* ---------- Стан ---------- */
  var cart = loadCart();           /* { productId: qty } */
  var view = 'cart';               /* 'cart' | 'checkout' | 'success' */
  var lastOrder = null;
  var checkout = { mode: 'delivery', payment: 'cash', name: '', phone: '', address: '', comment: '', pickupTime: '', consent: false };

  function loadCart() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      Object.keys(data).forEach(function (id) {
        if (!getShopProduct(id) || !(data[id] > 0)) delete data[id];
      });
      return data;
    } catch (e) { return {}; }
  }
  function saveCart() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) { /* приватний режим */ }
  }
  function cartCount() {
    return Object.keys(cart).reduce(function (sum, id) { return sum + cart[id]; }, 0);
  }
  function cartTotal() {
    return Object.keys(cart).reduce(function (sum, id) {
      return sum + getShopProduct(id).price * cart[id];
    }, 0);
  }

  /* ---------- Валідація ---------- */
  function isValidUAPhone(rawInput) {
    var digits = rawInput.replace(/\D/g, '');
    return /^0\d{9}$/.test(digits) || /^380\d{9}$/.test(digits);
  }
  function isValidName(v) {
    v = v.trim();
    return v.length >= 2 && v.length <= 50 && /^[А-ЩЬЮЯЄІЇҐа-щьюяєіїґA-Za-z'ʼ’\- ]+$/.test(v);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- DOM: оверлей, панель, live-регіон ---------- */
  var overlay = document.createElement('div');
  overlay.className = 'cart-overlay';
  overlay.hidden = true;

  var drawer = document.createElement('aside');
  drawer.className = 'cart-drawer';
  drawer.id = 'cart-drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', 'Кошик');
  drawer.hidden = true;

  var live = document.createElement('span');
  live.className = 'visually-hidden';
  live.setAttribute('aria-live', 'polite');

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);
  document.body.appendChild(live);

  var badge = document.getElementById('cart-badge');
  var isOpen = false;

  function announce(msg) { live.textContent = msg; }

  function updateBadge() {
    var n = cartCount();
    if (badge) {
      badge.textContent = n;
      badge.hidden = n === 0;
    }
    toggle.setAttribute('aria-label', n ? 'Кошик, товарів: ' + n : 'Кошик, порожній');
  }

  /* ---------- Рендер панелі ---------- */
  function money(n) { return n + ' грн'; }

  function renderCartView() {
    var ids = Object.keys(cart);
    var body;
    if (!ids.length) {
      body =
        '<div class="cart-empty">' +
        '<div class="cart-empty__icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1 13H5L6 7z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>' +
        '</div>' +
        '<p>Ваша косметичка поки порожня.</p>' +
        '<a class="btn btn--gold" href="shop.html">До крамниці</a>' +
        '</div>';
    } else {
      body = ids.map(function (id) {
        var p = getShopProduct(id);
        return '<div class="cart-item" data-id="' + p.id + '">' +
          '<span class="cart-item__img"><img src="' + p.image + '" alt="" width="56" height="56"></span>' +
          '<div class="cart-item__info">' +
          '<p class="cart-item__name">' + esc(p.name) + '</p>' +
          '<p class="cart-item__price">' + money(p.price) + '</p>' +
          '</div>' +
          '<div class="cart-qty">' +
          '<button type="button" class="qty-btn" data-qty="-1" aria-label="Зменшити кількість: ' + esc(p.name) + '">−</button>' +
          '<span class="cart-qty__num" aria-label="Кількість">' + cart[id] + '</span>' +
          '<button type="button" class="qty-btn" data-qty="1" aria-label="Збільшити кількість: ' + esc(p.name) + '">+</button>' +
          '</div>' +
          '<button type="button" class="cart-item__remove" data-remove aria-label="Видалити з кошика: ' + esc(p.name) + '">✕</button>' +
          '</div>';
      }).join('');
    }
    var foot = ids.length
      ? '<div class="cart-total"><span class="cart-total__label">Разом</span>' +
        '<span class="cart-total__sum">' + money(cartTotal()) + '</span></div>' +
        '<button type="button" class="btn btn--gold" data-checkout>Оформити замовлення</button>' +
        '<button type="button" class="cart-continue" data-close-cart>← Продовжити покупки</button>'
      : '';
    return { title: 'Кошик ♡', body: body, foot: foot };
  }

  function fieldHtml(id, label, type, value, hint, autocomplete) {
    return '<div class="form-field">' +
      '<label for="' + id + '">' + label + '</label>' +
      '<input type="' + type + '" id="' + id + '" ' + (autocomplete ? 'autocomplete="' + autocomplete + '" ' : '') +
      'aria-describedby="' + id + '-error' + (hint ? ' ' + id + '-hint' : '') + '" value="' + esc(value) + '">' +
      (hint ? '<p class="field-hint" id="' + id + '-hint">' + hint + '</p>' : '') +
      '<p class="field-error" id="' + id + '-error"></p></div>';
  }

  function renderCheckoutView() {
    var req = ' <span class="req" aria-hidden="true">*</span>';
    var body =
      '<button type="button" class="checkout-back" data-back-to-cart>← Назад до кошика</button>' +
      '<form id="checkout-form" novalidate><fieldset>' +
      '<legend class="checkout-legend">Оформлення замовлення</legend>' +

      '<div class="mode-switch" role="radiogroup" aria-label="Спосіб отримання">' +
      '<span><input type="radio" name="co-mode" id="co-mode-delivery" value="delivery"' + (checkout.mode === 'delivery' ? ' checked' : '') + '>' +
      '<label for="co-mode-delivery">🚚 Доставка</label></span>' +
      '<span><input type="radio" name="co-mode" id="co-mode-pickup" value="pickup"' + (checkout.mode === 'pickup' ? ' checked' : '') + '>' +
      '<label for="co-mode-pickup">🏠 Самовивіз</label></span>' +
      '</div>' +

      fieldHtml('co-name', 'Ім’я' + req, 'text', checkout.name, null, 'name') +
      fieldHtml('co-phone', 'Телефон' + req, 'tel', checkout.phone, 'Напр. 067 123 45 67 — пробіли, дужки та дефіси допустимі.', 'tel') +

      '<div data-group="delivery"' + (checkout.mode === 'delivery' ? '' : ' hidden') + '>' +
      fieldHtml('co-address', 'Адреса доставки' + req, 'text', checkout.address, null, 'street-address') +
      '<div class="form-field"><label for="co-comment">Побажання (необов’язково)</label>' +
      '<textarea id="co-comment" rows="2">' + esc(checkout.comment) + '</textarea></div>' +
      '</div>' +

      '<div data-group="pickup"' + (checkout.mode === 'pickup' ? '' : ' hidden') + '>' +
      fieldHtml('co-time', 'Бажаний час візиту' + req, 'text', checkout.pickupTime, 'Напр.: завтра після 15:00. Заберете замовлення на рецепції салону.') +
      '</div>' +

      '<div class="pay-options" role="radiogroup" aria-label="Спосіб оплати">' +
      '<label class="radio-row"><input type="radio" name="co-pay" value="cash"' + (checkout.payment === 'cash' ? ' checked' : '') + '>' +
      '<span><strong>Готівкою при отриманні</strong></span></label>' +
      '<label class="radio-row"><input type="radio" name="co-pay" value="card"' + (checkout.payment === 'card' ? ' checked' : '') + '>' +
      '<span><strong>Карткою онлайн</strong></span></label>' +
      '<p class="pay-hint"' + (checkout.payment === 'card' ? '' : ' hidden') + ' id="pay-card-hint">Онлайн-оплата підключається через LiqPay/Monobank (точка інтеграції) — зараз замовлення буде оформлено без оплати.</p>' +
      '</div>' +

      '<div class="checkbox-field">' +
      '<input type="checkbox" id="co-consent"' + (checkout.consent ? ' checked' : '') + ' aria-describedby="co-consent-error">' +
      '<label for="co-consent">Я даю згоду на обробку моїх персональних даних відповідно до <a href="privacy.html" target="_blank" rel="noopener">Політики конфіденційності</a>' + req + '</label>' +
      '</div><p class="field-error" id="co-consent-error"></p>' +
      '</fieldset></form>';

    var foot =
      '<div class="cart-total"><span class="cart-total__label">Разом (' + cartCount() + ' тов.)</span>' +
      '<span class="cart-total__sum">' + money(cartTotal()) + '</span></div>' +
      '<button type="submit" form="checkout-form" class="btn btn--gold" id="co-submit"' + (checkout.consent ? '' : ' disabled') + '>Підтвердити замовлення</button>';
    return { title: 'Оформлення ♡', body: body, foot: foot };
  }

  function renderSuccessView() {
    var o = lastOrder;
    var items = o.items.map(function (it) {
      return '<li><span>' + esc(it.name) + ' × ' + it.qty + '</span><span>' + money(it.sum) + '</span></li>';
    }).join('');
    var body =
      '<div class="order-success">' +
      '<div class="order-success__icon" aria-hidden="true">✓</div>' +
      '<h2 class="checkout-legend" id="order-success-title" tabindex="-1">Замовлення підтверджено!</h2>' +
      '<p class="order-success__num">№ ' + o.id + '</p>' +
      '<ul class="order-success__list">' + items +
      '<li><span><strong>Разом</strong></span><span><strong>' + money(o.total) + '</strong></span></li>' +
      '<li><span>Отримання</span><span>' + (o.mode === 'delivery' ? 'Доставка' : 'Самовивіз із салону') + '</span></li>' +
      '<li><span>Оплата</span><span>' + (o.payment === 'card' ? 'Карткою онлайн' : 'Готівкою при отриманні') + '</span></li>' +
      '</ul>' +
      '<p style="font-size: var(--fs-small);">' + esc(o.name) + ', адміністратор зв’яжеться з вами за номером <strong>' + esc(o.phone) + '</strong> для підтвердження.</p>' +
      '</div>';
    var foot = '<button type="button" class="btn btn--gold" data-close-cart>Чудово, дякую ♡</button>';
    return { title: 'Готово!', body: body, foot: foot };
  }

  function render() {
    var v = view === 'checkout' ? renderCheckoutView() : view === 'success' ? renderSuccessView() : renderCartView();
    drawer.innerHTML =
      '<div class="cart-drawer__head">' +
      '<h2 class="cart-drawer__title" id="cart-title">' + v.title + '</h2>' +
      '<button type="button" class="cart-close" data-close-cart aria-label="Закрити кошик">✕</button>' +
      '</div>' +
      '<div class="cart-drawer__body">' + v.body + '</div>' +
      (v.foot ? '<div class="cart-drawer__foot">' + v.foot + '</div>' : '');
  }

  /* ---------- Відкриття / закриття, focus trap ---------- */
  var lastFocused = null;

  function openDrawer() {
    lastFocused = document.activeElement;
    view = Object.keys(cart).length ? view : 'cart';
    isOpen = true;
    overlay.hidden = false;
    drawer.hidden = false;
    void drawer.offsetHeight; /* примусовий reflow, щоб CSS-перехід спрацював */
    overlay.classList.add('is-open');
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    render();
    var closeBtn = drawer.querySelector('.cart-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeDrawer() {
    isOpen = false;
    overlay.classList.remove('is-open');
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
    window.setTimeout(function () {
      if (!isOpen) { overlay.hidden = true; drawer.hidden = true; }
    }, 350);
    if (view === 'success') view = 'cart';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    else toggle.focus();
  }

  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { closeDrawer(); return; }
    if (e.key !== 'Tab') return;
    /* focus trap: Tab циклює лише в межах панелі */
    var focusables = drawer.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    var first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!drawer.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  });

  toggle.addEventListener('click', function () { isOpen ? closeDrawer() : openDrawer(); });
  overlay.addEventListener('click', closeDrawer);

  /* ---------- Дії з кошиком ---------- */
  function addToCart(id) {
    var p = getShopProduct(id);
    if (!p || !p.inStock) return;
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    updateBadge();
    announce(p.name + ' додано до кошика. У кошику товарів: ' + cartCount());
    if (isOpen) render();
  }

  function setQty(id, qty) {
    if (qty < 1) { delete cart[id]; announce(getShopProduct(id).name + ' видалено з кошика'); }
    else { cart[id] = qty; announce('Кількість: ' + qty + '. У кошику товарів: ' + (cartCount() - cart[id] + qty)); }
    saveCart();
    updateBadge();
    render();
  }

  /* Кнопки «У кошик» на сторінках каталогу/головній */
  document.addEventListener('click', function (e) {
    var addBtn = e.target.closest('[data-add-to-cart]');
    if (!addBtn) return;
    addToCart(addBtn.dataset.addToCart);
    var original = addBtn.textContent;
    addBtn.classList.add('is-added');
    addBtn.textContent = 'Додано ✓';
    window.setTimeout(function () {
      addBtn.classList.remove('is-added');
      addBtn.textContent = original;
    }, 1200);
  });

  /* ---------- Делегування подій панелі ---------- */
  drawer.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest('[data-close-cart]')) { closeDrawer(); return; }
    if (t.closest('[data-checkout]')) { view = 'checkout'; render(); focusLegend(); return; }
    if (t.closest('[data-back-to-cart]')) { view = 'cart'; render(); return; }

    var item = t.closest('.cart-item');
    if (item) {
      var id = item.dataset.id;
      var qtyBtn = t.closest('[data-qty]');
      if (qtyBtn) { setQty(id, (cart[id] || 0) + Number(qtyBtn.dataset.qty)); return; }
      if (t.closest('[data-remove]')) { setQty(id, 0); return; }
    }
  });

  function focusLegend() {
    var l = drawer.querySelector('.checkout-legend');
    if (l) { l.setAttribute('tabindex', '-1'); l.focus(); }
  }

  /* ---------- Чекаут: стан полів, перемикачі ---------- */
  drawer.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'co-name') checkout.name = t.value;
    else if (t.id === 'co-phone') checkout.phone = t.value;
    else if (t.id === 'co-address') checkout.address = t.value;
    else if (t.id === 'co-comment') checkout.comment = t.value;
    else if (t.id === 'co-time') checkout.pickupTime = t.value;
  });

  drawer.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'co-mode') {
      checkout.mode = t.value;
      var del = drawer.querySelector('[data-group="delivery"]');
      var pick = drawer.querySelector('[data-group="pickup"]');
      if (del) del.hidden = checkout.mode !== 'delivery';
      if (pick) pick.hidden = checkout.mode !== 'pickup';
      announce(checkout.mode === 'delivery' ? 'Обрано доставку' : 'Обрано самовивіз із салону');
    } else if (t.name === 'co-pay') {
      checkout.payment = t.value;
      var hint = drawer.querySelector('#pay-card-hint');
      if (hint) hint.hidden = checkout.payment !== 'card';
    } else if (t.id === 'co-consent') {
      checkout.consent = t.checked;
      var submit = drawer.querySelector('#co-submit');
      if (submit) submit.disabled = !checkout.consent;
      if (checkout.consent) setErr('co-consent', '');
    }
  });

  /* ---------- Валідація чекаута ---------- */
  function setErr(id, msg) {
    var input = drawer.querySelector('#' + id);
    var err = drawer.querySelector('#' + id + '-error');
    if (!input || !err) return;
    err.textContent = msg;
    err.classList.toggle('is-visible', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  var blurRules = {
    'co-name': function (v) { return v && !isValidName(v) ? 'Вкажіть ім’я: 2–50 символів, лише літери, апостроф чи дефіс.' : ''; },
    'co-phone': function (v) { return v && !isValidUAPhone(v) ? 'Вкажіть коректний український номер, напр. 067 123 45 67.' : ''; },
    'co-address': function (v) { return v && v.length < 5 ? 'Вкажіть повну адресу: місто, вулиця, будинок.' : ''; },
    'co-time': function (v) { return ''; }
  };
  drawer.addEventListener('focusout', function (e) {
    var rule = blurRules[e.target.id];
    if (rule) setErr(e.target.id, rule(e.target.value.trim()));
  });

  function validateCheckout() {
    var ok = true;
    if (!isValidName(checkout.name)) { setErr('co-name', 'Вкажіть ім’я: 2–50 символів, лише літери, апостроф чи дефіс.'); ok = false; }
    else setErr('co-name', '');
    if (!isValidUAPhone(checkout.phone)) { setErr('co-phone', 'Вкажіть коректний український номер, напр. 067 123 45 67.'); ok = false; }
    else setErr('co-phone', '');
    if (checkout.mode === 'delivery') {
      if (checkout.address.trim().length < 5) { setErr('co-address', 'Вкажіть повну адресу: місто, вулиця, будинок.'); ok = false; }
      else setErr('co-address', '');
    } else {
      if (!checkout.pickupTime.trim()) { setErr('co-time', 'Вкажіть, коли вам зручно забрати замовлення.'); ok = false; }
      else setErr('co-time', '');
    }
    if (!checkout.consent) { setErr('co-consent', 'Без згоди на обробку даних замовлення неможливе.'); ok = false; }
    else setErr('co-consent', '');
    if (!ok) {
      var firstInvalid = drawer.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
    }
    return ok;
  }

  /* ---------- Підтвердження замовлення ---------- */
  function nextOrderId() {
    var seq = 0;
    try { seq = Number(localStorage.getItem(SEQ_KEY)) || 0; } catch (e) {}
    seq += 1;
    try { localStorage.setItem(SEQ_KEY, String(seq)); } catch (e) {}
    var d = new Date();
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    return 'LM-' + dd + mm + '-' + String(seq).padStart(4, '0');
  }

  drawer.addEventListener('submit', function (e) {
    if (e.target.id !== 'checkout-form') return;
    e.preventDefault();
    if (!validateCheckout()) return;

    lastOrder = {
      id: nextOrderId(),
      items: Object.keys(cart).map(function (id) {
        var p = getShopProduct(id);
        return { id: id, name: p.name, qty: cart[id], sum: p.price * cart[id] };
      }),
      total: cartTotal(),
      mode: checkout.mode,
      payment: checkout.payment,
      name: checkout.name.trim(),
      phone: checkout.phone.trim(),
      address: checkout.address.trim(),
      comment: checkout.comment.trim(),
      pickupTime: checkout.pickupTime.trim()
    };

    /* Точка інтеграції: сюди підключається бекенд/CRM та онлайн-оплата (LiqPay/Mono) */
    console.log('ORDER_PAYLOAD', JSON.stringify(lastOrder));

    cart = {};
    saveCart();
    updateBadge();
    view = 'success';
    render();
    announce('Замовлення ' + lastOrder.id + ' підтверджено');
    var title = drawer.querySelector('#order-success-title');
    if (title) title.focus();
  });

  /* ---------- Старт ---------- */
  updateBadge();
})();
