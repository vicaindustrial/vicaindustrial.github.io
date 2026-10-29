/* VICA Industrial · interacción del sitio (sin dependencias).
   Todo lo que hace este archivo es opcional: sin JavaScript la página se ve completa. */
(function () {
  'use strict';
  var doc = document, html = doc.documentElement;
  html.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var EN = (html.lang || '').indexOf('en') === 0;

  /* ---------- menú en celular */
  var header = doc.querySelector('.site-header');
  var menuBtn = header && header.querySelector('.menu-btn');
  function setMenu(open) {
    header.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', menuBtn.getAttribute(open ? 'data-close' : 'data-open'));
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(!header.classList.contains('is-open')); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && header.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });
    header.querySelectorAll('.nav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  /* ---------- sombra del encabezado al bajar (sin escuchar cada scroll) */
  if (header && 'IntersectionObserver' in window) {
    var sentinel = doc.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none';
    doc.body.prepend(sentinel);
    new IntersectionObserver(function (en) { header.classList.toggle('is-scrolled', !en[0].isIntersecting); }).observe(sentinel);
  }

  /* ---------- fotos de la portada */
  var show = doc.querySelector('[data-slideshow]');
  if (show) (function () {
    var slides = [].slice.call(show.querySelectorAll('.slide'));
    var cap = show.querySelector('.slides__cap'), capText = show.querySelector('.slides__text'), capCount = show.querySelector('.slides__count');
    var btn = show.querySelector('.slides__toggle');
    if (slides.length < 2 || !btn) return;
    var ICON_PAUSE = '<path d="M9 5v14M15 5v14"></path>', ICON_PLAY = '<path d="M8 5l11 7-11 7z" fill="currentColor"></path>';
    var saveData = !!(navigator.connection && navigator.connection.saveData);
    var i = 0, timer = null, busy = false, userPaused = reduce.matches || saveData, hovered = false, visible = true, DWELL = 6000;
    function vid(s) { return s.querySelector('video'); }
    function syncVideo() {
      slides.forEach(function (s, k) {
        var v = vid(s); if (!v) return;
        if (k === i && playing()) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause();
      });
    }
    btn.hidden = false;
    function playing() { return !userPaused && visible && !doc.hidden; }   // video y zoom
    function running() { return playing() && !hovered; }                   // cambio automático de foto
    function kenBurns(s) {
      if (reduce.matches || vid(s)) return;
      s.classList.remove('kb'); void s.offsetWidth; s.classList.add('kb');
    }
    function setBtn() {
      btn.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
      btn.setAttribute('aria-label', show.getAttribute(userPaused ? 'data-play' : 'data-pause'));
      btn.querySelector('svg').innerHTML = userPaused ? ICON_PLAY : ICON_PAUSE;
    }
    function schedule() {
      clearTimeout(timer); timer = null;
      show.classList.toggle('is-paused', !playing());
      syncVideo();
      if (running()) timer = setTimeout(next, +slides[i].getAttribute('data-dwell') || DWELL);
    }
    function next() {
      if (busy) return;
      var from = slides[i], n = (i + 1) % slides.length, to = slides[n], img = to.querySelector('img');
      var tv = vid(to);
      if (tv) { tv.currentTime = 0; var pr = tv.play(); if (pr && pr.catch) pr.catch(function () {}); }
      busy = true;
      var go = function () {
        to.classList.add('is-next'); kenBurns(to);
        void to.offsetWidth;
        to.classList.add('is-in');
        cap.classList.add('is-swapping');
        var done = function () {
          to.removeEventListener('transitionend', done);
          from.classList.remove('is-active', 'kb'); from.setAttribute('aria-hidden', 'true');
          to.classList.remove('is-next', 'is-in'); to.classList.add('is-active'); to.removeAttribute('aria-hidden');
          i = n; busy = false; schedule();
        };
        to.addEventListener('transitionend', done);
        setTimeout(function () { if (busy) done(); }, 1600);
        setTimeout(function () {
          capText.textContent = to.getAttribute('data-caption');
          cap.setAttribute('href', to.getAttribute('data-href'));
          capCount.textContent = (n + 1) + ' ' + show.getAttribute('data-of') + ' ' + slides.length;
          cap.classList.remove('is-swapping');
        }, 220);
      };
      (img && img.decode ? img.decode() : Promise.resolve()).then(go, go);
    }
    btn.addEventListener('click', function () { userPaused = !userPaused; setBtn(); schedule(); });
    show.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hovered = true; schedule(); } });
    show.addEventListener('pointerleave', function () { if (hovered) { hovered = false; schedule(); } });
    show.addEventListener('focusin', function (e) { if (e.target !== btn) { hovered = true; schedule(); } });
    show.addEventListener('focusout', function () { hovered = false; schedule(); });
    doc.addEventListener('visibilitychange', schedule);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; schedule(); }).observe(show);
    kenBurns(slides[0]); setBtn(); schedule();
  })();

  /* ---------- videos en silencio: se reproducen solo mientras se ven */
  doc.querySelectorAll('[data-vid]').forEach(function (box) {
    var v = box.querySelector('video'), b = box.querySelector('.vid__toggle');
    var userPaused = reduce.matches || !!(navigator.connection && navigator.connection.saveData), seen = false;
    var ICON_PAUSE = '<path d="M9 5v14M15 5v14"></path>', ICON_PLAY = '<path d="M8 5l11 7-11 7z" fill="currentColor"></path>';
    function upd() {
      b.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
      b.setAttribute('aria-label', box.getAttribute(userPaused ? 'data-play' : 'data-pause'));
      b.querySelector('svg').innerHTML = userPaused ? ICON_PLAY : ICON_PAUSE;
      if (seen && !userPaused && !doc.hidden) { v.preload = 'auto'; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause();
    }
    b.hidden = false;
    b.addEventListener('click', function () { userPaused = !userPaused; upd(); });
    doc.addEventListener('visibilitychange', upd);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { seen = en[0].isIntersecting; upd(); }, { threshold: 0.4 }).observe(box);
    upd();
  });

  /* ---------- servicios: la foto sigue al servicio activo */
  doc.querySelectorAll('[data-svc]').forEach(function (box) {
    var imgs = box.querySelectorAll('.svc__media img'), items = box.querySelectorAll('.svc__item');
    var wide = window.matchMedia('(min-width: 901px)');
    function activate(k) {
      items.forEach(function (it) { it.classList.toggle('is-active', it.getAttribute('data-i') === k); });
      imgs.forEach(function (im) { im.classList.toggle('is-active', im.getAttribute('data-i') === k); });
    }
    items.forEach(function (it) {
      var k = it.getAttribute('data-i');
      it.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && wide.matches) activate(k); });
      it.addEventListener('focus', function () { activate(k); });
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        if (!wide.matches) return;
        en.forEach(function (e) { if (e.isIntersecting) activate(e.target.getAttribute('data-i')); });
      }, { rootMargin: '-45% 0px -45% 0px' });
      items.forEach(function (it) { io.observe(it); });
    }
  });

  /* ---------- comparador antes / después */
  doc.querySelectorAll('[data-compare]').forEach(function (box) {
    var before = box.querySelector('.compare__before'), handle = box.querySelector('.compare__handle');
    var pos = 50, dragging = false, pid = null, w = box.clientWidth;
    handle.style.left = '0';
    function paint() {
      before.style.clipPath = 'inset(0 ' + (100 - pos) + '% 0 0)';
      handle.style.transform = 'translateX(' + (pos / 100 * w) + 'px)';
      handle.setAttribute('aria-valuenow', Math.round(pos));
      handle.setAttribute('aria-valuetext', Math.round(pos) + ' %');
    }
    function fromX(x) { var r = box.getBoundingClientRect(); pos = Math.max(0, Math.min(100, (x - r.left) / r.width * 100)); paint(); }
    box.addEventListener('pointerdown', function (e) {
      if (dragging || (e.pointerType === 'mouse' && e.button !== 0)) return;
      dragging = true; pid = e.pointerId; box.classList.add('is-dragging');
      try { box.setPointerCapture(pid); } catch (err) {}
      fromX(e.clientX);
    });
    box.addEventListener('pointermove', function (e) { if (dragging && e.pointerId === pid) fromX(e.clientX); });
    function end(e) { if (e.pointerId !== pid) return; dragging = false; pid = null; box.classList.remove('is-dragging'); }
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
    handle.addEventListener('keydown', function (e) {
      var k = e.key, step = e.shiftKey ? 10 : 5;
      if (k === 'ArrowLeft' || k === 'ArrowDown') pos -= step;
      else if (k === 'ArrowRight' || k === 'ArrowUp') pos += step;
      else if (k === 'PageDown') pos -= 10; else if (k === 'PageUp') pos += 10;
      else if (k === 'Home') pos = 0; else if (k === 'End') pos = 100;
      else return;
      e.preventDefault(); pos = Math.max(0, Math.min(100, pos)); paint();
    });
    if ('ResizeObserver' in window) new ResizeObserver(function () { w = box.clientWidth; paint(); }).observe(box);
    paint();
  });

  /* ---------- visor de fotos (página de proyectos) */
  var zooms = [].slice.call(doc.querySelectorAll('[data-zoom]'));
  if (zooms.length && window.HTMLDialogElement) (function () {
    var T = EN ? { close: 'Close', prev: 'Previous photo', next: 'Next photo', of: 'of' } : { close: 'Cerrar', prev: 'Foto anterior', next: 'Foto siguiente', of: 'de' };
    var svgI = function (p) { return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; };
    var dlg = doc.createElement('dialog');
    dlg.className = 'lightbox';
    dlg.setAttribute('aria-label', EN ? 'Photo viewer' : 'Visor de fotos');
    dlg.innerHTML = '<figure><img alt=""><figcaption><span></span><b></b></figcaption></figure>' +
      '<button class="lb-close" type="button" aria-label="' + T.close + '">' + svgI('<path d="M6 6l12 12M18 6 6 18"></path>') + '</button>' +
      '<button class="lb-prev" type="button" aria-label="' + T.prev + '">' + svgI('<path d="m15 6-6 6 6 6"></path>') + '</button>' +
      '<button class="lb-next" type="button" aria-label="' + T.next + '">' + svgI('<path d="m9 6 6 6-6 6"></path>') + '</button>';
    doc.body.appendChild(dlg);
    var im = dlg.querySelector('img'), count = dlg.querySelector('figcaption span'), text = dlg.querySelector('figcaption b');
    text.style.fontWeight = '400';
    var cur = 0, opener = null;
    function load(k) {
      cur = (k + zooms.length) % zooms.length;
      var a = zooms[cur], src = a.querySelector('img');
      im.src = a.getAttribute('href'); im.alt = src ? src.alt : '';
      text.textContent = src ? src.alt : '';
      count.textContent = (cur + 1) + ' ' + T.of + ' ' + zooms.length;
    }
    zooms.forEach(function (a, k) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault(); opener = a; load(k); dlg.showModal();
      });
    });
    dlg.querySelector('.lb-close').addEventListener('click', function () { dlg.close(); });
    dlg.querySelector('.lb-prev').addEventListener('click', function () { load(cur - 1); });
    dlg.querySelector('.lb-next').addEventListener('click', function () { load(cur + 1); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); load(cur - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); load(cur + 1); }
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.tagName === 'FIGURE') dlg.close(); });
    dlg.addEventListener('close', function () { if (opener) opener.focus(); });
    var sx = null;
    dlg.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) load(cur + (dx < 0 ? 1 : -1));
    });
  })();

  /* ---------- aparición suave de tarjetas al bajar (una vez) */
  var groups = doc.querySelectorAll('[data-reveal]');
  if (groups.length && 'IntersectionObserver' in window) {
    var vh = window.innerHeight;
    var rio = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        var g = e.target;
        [].forEach.call(g.children, function (c, k) { c.style.setProperty('--d', Math.min(k, 6) * 50 + 'ms'); });
        g.classList.add('is-in');
        rio.unobserve(g);
        setTimeout(function () { [].forEach.call(g.children, function (c) { c.style.removeProperty('--d'); }); }, 700);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    groups.forEach(function (g) {
      if (g.getBoundingClientRect().top < vh * 0.9) g.classList.add('is-in');
      else rio.observe(g);
    });
  } else {
    groups.forEach(function (g) { g.classList.add('is-in'); });
  }
})();
