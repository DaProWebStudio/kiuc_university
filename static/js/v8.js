// ==========================================================================
// Design system v8 — client behaviour (topbar, sliders, rails, reveal)
// Zero dependencies. Loaded from templates/base/scripts.html.
// ==========================================================================

(function () {
  'use strict';

  // -------------------------------------------------------------------- //
  // Scroll progress bar
  // -------------------------------------------------------------------- //
  const prog = document.getElementById('scrollProg');
  if (prog) {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const r = max > 0 ? window.scrollY / max : 0;
      prog.style.transform = 'scaleX(' + r + ')';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // -------------------------------------------------------------------- //
  // Reveal on scroll
  // -------------------------------------------------------------------- //
  const revealTargets = document.querySelectorAll('.reveal');
  if (revealTargets.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('in'));
  }

  // -------------------------------------------------------------------- //
  // Mobile nav burger
  // -------------------------------------------------------------------- //
  const burger = document.querySelector('[data-nav-toggle]');
  const navList = document.querySelector('[data-nav-list]');
  if (burger && navList) {
    // Создаём backdrop один раз, переиспользуем для последующих открытий
    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(backdrop);

    const setOpen = (open) => {
      navList.classList.toggle('_active', open);
      burger.classList.toggle('_active', open);
      backdrop.classList.toggle('_active', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('_lock', open);
    };

    burger.addEventListener('click', () => setOpen(!navList.classList.contains('_active')));
    backdrop.addEventListener('click', () => setOpen(false));

    // Закрываем меню при клике на любой реальный линк внутри
    navList.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => setOpen(false));
    });

    // Закрываем по Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navList.classList.contains('_active')) setOpen(false);
    });
  }

  // -------------------------------------------------------------------- //
  // Sub-menu toggles (mobile tap)
  // -------------------------------------------------------------------- //
  document.querySelectorAll('[data-submenu-toggle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // На десктопе sub-меню открывается через :hover — трогаем только мобильный.
      if (window.matchMedia('(min-width: 981px)').matches) return;
      e.preventDefault();
      const li = btn.closest('li');
      if (!li) return;
      const wasActive = li.classList.contains('_active');
      li.parentElement.querySelectorAll(':scope > li._active').forEach(other => {
        if (other !== li) other.classList.remove('_active');
      });
      li.classList.toggle('_active', !wasActive);
    });
  });

  // -------------------------------------------------------------------- //
  // Language switcher — сабмит скрытой формы при клике на pill
  // -------------------------------------------------------------------- //
  const langForm = document.querySelector('[data-lang-form]');
  if (langForm) {
    const select = langForm.querySelector('select[name="language"]');
    langForm.querySelectorAll('button[type="submit"][name="language"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!select) return;
        select.value = btn.value;
      });
    });
  }

  // -------------------------------------------------------------------- //
  // Header auto-slider
  // -------------------------------------------------------------------- //
  const headerSlider = document.querySelector('[data-slider]');
  if (headerSlider) {
    const items = headerSlider.querySelectorAll('.header__slider-item');
    const dots = headerSlider.querySelectorAll('[data-dots] button');
    const bar = headerSlider.querySelector('[data-slider-bar]');
    if (items.length > 0) {
      const dur = 5200;
      let idx = 0;
      let startT = null;
      let paused = false;

      const go = (i) => {
        items.forEach(x => x.classList.remove('active'));
        dots.forEach(d => d.classList.remove('on'));
        items[i].classList.add('active');
        if (dots[i]) dots[i].classList.add('on');
        idx = i;
        startT = performance.now();
        if (bar) bar.style.width = '0%';
      };

      const tick = (t) => {
        if (!paused) {
          if (!startT) startT = t;
          const p = Math.min(1, (t - startT) / dur);
          if (bar) bar.style.width = (p * 100) + '%';
          if (p >= 1) go((idx + 1) % items.length);
        } else {
          startT = t;
        }
        requestAnimationFrame(tick);
      };

      dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
      headerSlider.addEventListener('mouseenter', () => { paused = true; });
      headerSlider.addEventListener('mouseleave', () => { paused = false; startT = null; });

      go(0);
      requestAnimationFrame(tick);
    }
  }

  // -------------------------------------------------------------------- //
  // Rails prev/next (горизонтальные слайдеры карточек)
  // -------------------------------------------------------------------- //
  document.querySelectorAll('[data-rail-prev],[data-rail-next]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.railPrev || btn.dataset.railNext;
      const rail = document.querySelector('[data-rail="' + key + '"]');
      if (!rail) return;
      const card = rail.querySelector('*');
      const step = card ? card.getBoundingClientRect().width + 20 : 320;
      const dir = btn.dataset.railPrev ? -1 : 1;
      rail.scrollBy({ left: dir * step, behavior: 'smooth' });
    });
  });

  // -------------------------------------------------------------------- //
  // Scroll-to-top button (переиспользуем существующий #button_up)
  // -------------------------------------------------------------------- //
  const upBtn = document.getElementById('button_up');
  if (upBtn) {
    const toggleUp = () => {
      upBtn.classList.toggle('upShow__hide', window.scrollY < 400);
    };
    window.addEventListener('scroll', toggleUp, { passive: true });
    upBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    toggleUp();
  }

  // -------------------------------------------------------------------- //
  // Lightbox — zero-dep галерея (заменяет magnific-popper)
  // -------------------------------------------------------------------- //
  // Триггер: клик по <a href="image.jpg"> внутри .gallery-v8 или .gallery-list.
  // Группируется по ближайшему галерейному контейнеру — стрелки листают
  // изображения этой группы, Esc / клик по фону / × закрывают.
  const galleryGroups = document.querySelectorAll('.gallery-v8, .gallery-list');
  if (galleryGroups.length) {
    let lb = null;
    let current = [];
    let idx = 0;

    const build = () => {
      const el = document.createElement('div');
      el.className = 'lightbox';
      el.innerHTML =
        '<button class="lightbox__close" aria-label="Закрыть">&times;</button>' +
        '<button class="lightbox__nav lightbox__nav--prev" aria-label="Назад">&#8249;</button>' +
        '<button class="lightbox__nav lightbox__nav--next" aria-label="Вперёд">&#8250;</button>' +
        '<figure class="lightbox__stage"><img alt=""><figcaption class="lightbox__count"></figcaption></figure>';
      document.body.appendChild(el);
      el.addEventListener('click', (e) => {
        if (e.target === el) close();
      });
      el.querySelector('.lightbox__close').addEventListener('click', close);
      el.querySelector('.lightbox__nav--prev').addEventListener('click', () => step(-1));
      el.querySelector('.lightbox__nav--next').addEventListener('click', () => step(1));
      return el;
    };

    const render = () => {
      if (!lb) return;
      const img = lb.querySelector('img');
      img.src = current[idx];
      lb.querySelector('.lightbox__count').textContent = (idx + 1) + ' / ' + current.length;
      const multi = current.length > 1;
      lb.querySelector('.lightbox__nav--prev').style.display = multi ? '' : 'none';
      lb.querySelector('.lightbox__nav--next').style.display = multi ? '' : 'none';
    };

    const step = (dir) => {
      idx = (idx + dir + current.length) % current.length;
      render();
    };

    const open = (items, startIdx) => {
      current = items;
      idx = startIdx;
      if (!lb) lb = build();
      lb.classList.add('_open');
      document.body.classList.add('_lock');
      render();
    };

    const close = () => {
      if (!lb) return;
      lb.classList.remove('_open');
      document.body.classList.remove('_lock');
    };

    galleryGroups.forEach(group => {
      const items = Array.from(group.querySelectorAll('a'))
        .filter(a => /\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i.test(a.href));
      if (!items.length) return;
      const urls = items.map(a => a.href);
      items.forEach((a, i) => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          open(urls, i);
        });
      });
    });

    document.addEventListener('keydown', (e) => {
      if (!lb || !lb.classList.contains('_open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });
  }

  // -------------------------------------------------------------------- //
  // Motion — морф приветствия, word-stagger, counter, 3D-tilt, magnetic
  // -------------------------------------------------------------------- //
  // Всё поведение отключается при prefers-reduced-motion — стилями CSS и здесь.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Morph title: циклически активирует следующий .morph__word ------- //
  document.querySelectorAll('[data-morph]').forEach(host => {
    const words = host.querySelectorAll('.morph__word');
    if (words.length < 2 || reduceMotion) return;
    // Устанавливаем min-width контейнера по самому широкому слову — чтобы
    // не «прыгала» соседняя разметка при переключении.
    let maxW = 0;
    words.forEach(w => {
      w.classList.add('is-active');
      const r = w.getBoundingClientRect();
      if (r.width > maxW) maxW = r.width;
      w.classList.remove('is-active');
    });
    if (maxW) host.style.minWidth = Math.ceil(maxW) + 'px';
    words[0].classList.add('is-active');
    let cur = 0;
    setInterval(() => {
      words[cur].classList.remove('is-active');
      cur = (cur + 1) % words.length;
      words[cur].classList.add('is-active');
    }, 2600);
  });

  // ---- Word stagger: автосплит текста на <span class="word"> ----------- //
  document.querySelectorAll('[data-split-words]').forEach(el => {
    if (el.dataset.splitDone) return;
    const nodes = Array.from(el.childNodes);
    const wrap = document.createElement('span');
    wrap.style.display = 'contents';
    nodes.forEach(n => {
      if (n.nodeType === Node.TEXT_NODE) {
        const parts = n.textContent.split(/(\s+)/);
        parts.forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) {
            wrap.appendChild(document.createTextNode(' '));
          } else {
            const w = document.createElement('span');
            w.className = 'word';
            w.textContent = p;
            wrap.appendChild(w);
          }
        });
      } else {
        // Элементы (как .ital-decor) — оборачиваем целиком как одно «слово»,
        // чтобы сохранить внутренний markup и курсив.
        const w = document.createElement('span');
        w.className = 'word';
        w.appendChild(n);
        wrap.appendChild(w);
      }
    });
    el.innerHTML = '';
    while (wrap.firstChild) el.appendChild(wrap.firstChild);
    el.dataset.splitDone = '1';
  });

  // ---- Counter: 0 → data-count с easeOutCubic, при попадании во вьюпорт  //
  const counters = document.querySelectorAll('.counter[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const runCounter = (el) => {
      const target = parseFloat(el.dataset.count) || 0;
      const suffix = el.dataset.suffix || '';
      if (reduceMotion) { el.textContent = target + suffix; return; }
      const dur = 1400;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const v = Math.round(target * easeOutCubic(p));
        el.textContent = v + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          runCounter(e.target);
          cio.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(c => cio.observe(c));
  }

  // ---- 3D tilt: наклон по mousemove, мягкий сброс на mouseleave --------- //
  document.querySelectorAll('[data-tilt]').forEach(el => {
    if (reduceMotion) return;
    const max = 5; // максимальный угол в градусах
    let frame = null;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;  // 0..1
      const y = (e.clientY - r.top) / r.height;  // 0..1
      const rx = (0.5 - y) * max * 2;
      const ry = (x - 0.5) * max * 2;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.transform = 'perspective(800px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      });
    };
    const onLeave = () => {
      if (frame) cancelAnimationFrame(frame);
      el.style.transform = 'perspective(800px) rotateX(0) rotateY(0)';
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
  });

  // ---- Magnetic: кнопка «тянется» к курсору в радиусе 110 px ----------- //
  document.querySelectorAll('.magnetic').forEach(el => {
    if (reduceMotion) return;
    const radius = 110;
    const strength = 0.28;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) {
        el.style.transform = '';
        return;
      }
      el.style.transform = 'translate(' + (dx * strength).toFixed(1) + 'px,' + (dy * strength).toFixed(1) + 'px)';
    };
    const onLeave = () => { el.style.transform = ''; };
    window.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave);
  });

  // -------------------------------------------------------------------- //
  // LAB — эффекты, активные только на странице /lab/ (по data-атрибутам)
  // -------------------------------------------------------------------- //

  // ---- Letter reveal: разрезает текст на <span class="ch"> -------------- //
  document.querySelectorAll('[data-letter-reveal]').forEach(el => {
    if (el.dataset.letterDone) return;
    const text = el.textContent;
    el.textContent = '';
    let i = 0;
    for (const ch of text) {
      const span = document.createElement('span');
      span.className = 'ch';
      span.textContent = ch === ' ' ? ' ' : ch;
      span.style.animationDelay = (i * 0.03).toFixed(2) + 's';
      el.appendChild(span);
      i++;
    }
    el.dataset.letterDone = '1';
  });

  // ---- Scramble text: случайные символы → финальная строка -------------- //
  const scrambleTargets = document.querySelectorAll('[data-scramble]');
  if (scrambleTargets.length && 'IntersectionObserver' in window) {
    const CHARS = '0123456789АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ!@#$%';
    const runScramble = (el) => {
      const finalText = el.dataset.scramble || '';
      if (reduceMotion) { el.textContent = finalText; return; }
      const dur = 1200;
      const start = performance.now();
      const len = finalText.length;
      const tick = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const settled = Math.floor(len * p);
        let out = finalText.slice(0, settled);
        for (let j = settled; j < len; j++) {
          const src = finalText[j];
          out += /\s/.test(src)
            ? src
            : CHARS[Math.floor(Math.random() * CHARS.length)];
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = finalText;
      };
      requestAnimationFrame(tick);
    };
    const sio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          runScramble(e.target);
          sio.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    scrambleTargets.forEach(t => sio.observe(t));
  }

  // ---- Parallax layers: перемещение по data-speed при скролле ----------- //
  const parallaxRoots = document.querySelectorAll('[data-parallax]');
  if (parallaxRoots.length && !reduceMotion) {
    const update = () => {
      parallaxRoots.forEach(root => {
        const r = root.getBoundingClientRect();
        // Прогресс 0..1: когда центр корня проходит через центр экрана.
        const center = r.top + r.height / 2;
        const vh = window.innerHeight;
        const progress = (vh / 2 - center) / vh; // может быть отрицательным
        root.querySelectorAll('[data-speed]').forEach(layer => {
          const speed = parseFloat(layer.dataset.speed) || 0;
          // Читаем исходный inline-transform (если есть) и добавляем сдвиг.
          const baseTx = layer.dataset.baseTransform || layer.style.transform || '';
          if (!layer.dataset.baseTransform) layer.dataset.baseTransform = baseTx;
          const dy = progress * speed * 200; // 200 = ход эффекта в px
          layer.style.transform = baseTx + ' translate3d(0,' + dy.toFixed(1) + 'px,0)';
        });
      });
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // ---- SVG building: поэлементное рисование контура stroke-dashoffset'ом  //
  document.querySelectorAll('[data-build]').forEach(svg => {
    const els = Array.from(svg.querySelectorAll('.b-line'));
    if (!els.length) return;

    // Сохраняем оригинальный dasharray (у пунктирных линий он свой).
    els.forEach(el => {
      if (!el.dataset.origDasharray) {
        el.dataset.origDasharray = el.getAttribute('stroke-dasharray') || '';
      }
    });

    const lens = els.map(el => {
      try { return typeof el.getTotalLength === 'function' ? el.getTotalLength() : 240; }
      catch (_) { return 240; }
    });

    const reset = () => {
      els.forEach((el, i) => {
        try { el.getAnimations().forEach(a => a.cancel()); } catch (_) {}
        const len = lens[i];
        if (el.classList.contains('b-dash')) {
          el.style.opacity = '0';
          // исходный dasharray оставляем (пунктир),
        } else {
          el.style.strokeDasharray = String(len);
          el.style.strokeDashoffset = String(len);
        }
      });
    };

    const run = () => {
      if (reduceMotion) {
        els.forEach(el => {
          el.style.strokeDashoffset = '0';
          el.style.opacity = '1';
          if (el.dataset.origDasharray) el.style.strokeDasharray = el.dataset.origDasharray;
        });
        return;
      }
      reset();
      svg.getBoundingClientRect(); // принудительный reflow
      const speed = 350;  // px/s — средняя скорость рисования
      const gap = 70;     // ms между стартами соседних штрихов
      let cursor = 0;
      els.forEach((el, i) => {
        const len = lens[i];
        if (el.classList.contains('b-dash')) {
          el.animate(
            [{ opacity: 0 }, { opacity: 1 }],
            { duration: 500, delay: cursor, fill: 'forwards', easing: 'ease-out' }
          );
          cursor += gap;
          return;
        }
        const dur = Math.max(200, (len / speed) * 1000);
        const anim = el.animate(
          [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
          { duration: dur, delay: cursor, fill: 'forwards', easing: 'ease-out' }
        );
        anim.onfinish = () => {
          // Фиксируем финальное состояние и возвращаем пунктир, если был.
          el.style.strokeDashoffset = '0';
          if (el.dataset.origDasharray) el.style.strokeDasharray = el.dataset.origDasharray;
          else el.style.strokeDasharray = 'none';
        };
        cursor += gap;
      });
    };

    svg._runBuild = run;

    // Сразу переводим в «невидимое» состояние, чтобы не мигало до IO-триггера.
    if (!reduceMotion) reset();

    if ('IntersectionObserver' in window) {
      const bio = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            run();
            bio.unobserve(e.target);
          }
        });
      }, { threshold: 0.25 });
      bio.observe(svg);
    } else {
      run();
    }
  });

  document.querySelectorAll('[data-build-replay]').forEach(btn => {
    btn.addEventListener('click', () => {
      const root = btn.closest('.building');
      if (!root) return;
      const svg = root.querySelector('[data-build]');
      if (svg && svg._runBuild) svg._runBuild();
    });
  });

  // ---- Timeline path: выставляем реальную длину path'а перед запуском ---- //
  document.querySelectorAll('[data-timeline]').forEach(root => {
    const path = root.querySelector('.timeline__path');
    if (path && typeof path.getTotalLength === 'function') {
      try {
        const len = path.getTotalLength();
        path.style.setProperty('--len', len);
      } catch (_) {}
    }
    if ('IntersectionObserver' in window) {
      const tio = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            root.classList.add('is-in');
            tio.unobserve(e.target);
          }
        });
      }, { threshold: 0.25 });
      tio.observe(root);
    } else {
      root.classList.add('is-in');
    }
  });

  // ---- Partners map: длина каждой дуги + триггер по скроллу ------------ //
  document.querySelectorAll('[data-pmap]').forEach(root => {
    root.querySelectorAll('.pmap__arc').forEach(arc => {
      if (typeof arc.getTotalLength === 'function') {
        try {
          const len = arc.getTotalLength();
          arc.style.setProperty('--len', len);
          arc.style.strokeDasharray = len;
          arc.style.strokeDashoffset = len;
        } catch (_) {}
      }
    });
    if ('IntersectionObserver' in window) {
      const pio = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            root.classList.add('is-in');
            pio.unobserve(e.target);
          }
        });
      }, { threshold: 0.3 });
      pio.observe(root);
    } else {
      root.classList.add('is-in');
    }
  });

  // ---- Mouse-parallax hero --------------------------------------------- //
  document.querySelectorAll('[data-mparallax]').forEach(root => {
    if (reduceMotion) return;
    const layers = root.querySelectorAll('[data-mp]');
    if (!layers.length) return;
    let rect = root.getBoundingClientRect();
    const upd = () => { rect = root.getBoundingClientRect(); };
    window.addEventListener('resize', upd);
    window.addEventListener('scroll', upd, { passive: true });

    let frame = null;
    root.addEventListener('mousemove', (e) => {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        layers.forEach(layer => {
          const k = parseFloat(layer.dataset.mp) || 0;
          layer.style.transform = 'translate3d(' + (dx * k).toFixed(1) + 'px,' + (dy * k).toFixed(1) + 'px,0)';
        });
      });
    });
    root.addEventListener('mouseleave', () => {
      if (frame) cancelAnimationFrame(frame);
      layers.forEach(layer => { layer.style.transform = ''; });
    });
  });

  // ---- Custom cursor (в пределах зоны) --------------------------------- //
  document.querySelectorAll('[data-cursor-area]').forEach(area => {
    if (reduceMotion) return;
    if (window.matchMedia('(hover: none)').matches) return; // touch
    const follower = area.querySelector('.cursor-follower');
    const label = area.querySelector('.cursor-follower__label');
    if (!follower) return;

    let tx = 0, ty = 0, cx = 0, cy = 0;
    let inside = false;
    const lerp = 0.18;

    const onMove = (e) => {
      const r = area.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!inside) {
        cx = tx; cy = ty;
        inside = true;
        follower.classList.add('is-active');
      }
    };
    const onLeave = () => {
      inside = false;
      follower.classList.remove('is-active', 'is-expanded');
    };

    area.addEventListener('mousemove', onMove);
    area.addEventListener('mouseleave', onLeave);

    // Hover-targets: расширяем + показываем подпись.
    area.querySelectorAll('[data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        follower.classList.add('is-expanded');
        if (label) label.textContent = el.dataset.cursor || '';
      });
      el.addEventListener('mouseleave', () => {
        follower.classList.remove('is-expanded');
      });
    });

    const loop = () => {
      cx += (tx - cx) * lerp;
      cy += (ty - cy) * lerp;
      follower.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px) translate(-50%, -50%)';
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });

  // ---- Clip-path reveal: добавляем .is-in когда тайл попадает во вьюпорт  //
  const clipTiles = document.querySelectorAll('[data-clip-tile]');
  if (clipTiles.length && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          cio.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });
    clipTiles.forEach(t => cio.observe(t));
  } else {
    clipTiles.forEach(t => t.classList.add('is-in'));
  }

})();
