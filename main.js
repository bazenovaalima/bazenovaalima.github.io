// ===== Badge: drops in (CSS), then swings like a pendulum and can be dragged =====
(() => {
  const badge = document.getElementById('badge');
  if (!badge) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let angle = 0, velocity = 0, dragging = false, ready = false;
  const STIFFNESS = 0.012, DAMPING = 0.965, MAX = 55;

  const pivot = () => {
    const r = badge.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top };
  };
  const pointerAngle = (e) => {
    // angle of the pointer relative to the pivot, measured from straight down
    const p = pivot();
    const a = Math.atan2(p.x - e.clientX, e.clientY - p.y) * 180 / Math.PI;
    // CSS rotate(+) swings the bottom to the left, so pointer-right → negative angle
    return Math.max(-MAX, Math.min(MAX, a));
  };

  const start = () => {
    ready = true;
    badge.style.animation = 'none';
    velocity = reduce ? 0 : 1.2; // a small leftover swing after the drop
    requestAnimationFrame(tick);
  };
  badge.addEventListener('animationend', start, { once: true });
  // fallback if the animation is skipped (reduced motion etc.)
  setTimeout(() => { if (!ready) start(); }, 2200);

  let lastAngle = 0;
  function tick() {
    if (!dragging) {
      velocity += -angle * STIFFNESS;
      velocity *= DAMPING;
      angle += velocity;
      if (Math.abs(angle) < 0.01 && Math.abs(velocity) < 0.01) angle = velocity = 0;
    }
    badge.style.transform = `rotate(${angle.toFixed(3)}deg)`;
    requestAnimationFrame(tick);
  }

  badge.addEventListener('pointerdown', (e) => {
    if (!ready) return;
    dragging = true;
    badge.classList.add('is-dragging');
    badge.setPointerCapture(e.pointerId);
    lastAngle = angle;
  });
  badge.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const target = pointerAngle(e);
    angle += (target - angle) * 0.35;
    velocity = angle - lastAngle;   // keep momentum for the release
    lastAngle = angle;
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    badge.classList.remove('is-dragging');
  };
  badge.addEventListener('pointerup', release);
  badge.addEventListener('pointercancel', release);

  // a gentle nudge when the page scrolls, as if the badge were hanging in the room
  let lastY = scrollY;
  addEventListener('scroll', () => {
    if (!ready || reduce) return;
    const dy = scrollY - lastY; lastY = scrollY;
    if (dragging || scrollY > innerHeight) return; // badge is off-screen, don't wind it up
    // small nudge, capped so fast scrolling back to the top never builds a big swing
    const SCROLL_MAX_ANGLE = 4;
    const push = Math.max(-0.25, Math.min(0.25, dy * 0.004));
    if (Math.sign(push) === Math.sign(angle) && Math.abs(angle) > SCROLL_MAX_ANGLE) return;
    velocity = Math.max(-0.6, Math.min(0.6, velocity + push));
  }, { passive: true });
})();

// ===== Scroll reveal =====
(() => {
  const els = document.querySelectorAll('.section__head, .about__grid, .folder, .log__entry, .pub, .bench__col, .contact > *');
  els.forEach((el) => el.classList.add('reveal'));
  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    io.observe(el);
  });
})();

// ===== Active nav link =====
(() => {
  const links = [...document.querySelectorAll('.nav__links a')];
  const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const sections = [...map.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((l) => l.classList.remove('is-active'));
      map.get(en.target.id)?.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => io.observe(s));
})();

// ===== Case files: open a folder into the dossier dialog =====
(() => {
  const dialog = document.getElementById('dossier');
  const content = document.getElementById('dossier-content');
  let opener = null;

  const open = (id, fromEl) => {
    const tpl = document.getElementById(`case-${id}`);
    if (!tpl) return;
    opener = fromEl || null;
    content.replaceChildren(tpl.content.cloneNode(true));
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add('no-scroll');
    if (location.hash !== `#case-${id}`) history.replaceState(null, '', `#case-${id}`);
  };
  const close = () => dialog.open && dialog.close();

  document.querySelectorAll('.folder').forEach((f) =>
    f.addEventListener('click', () => open(f.dataset.case, f)));

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('[data-close]')) close();
  });
  dialog.addEventListener('close', () => {
    content.querySelectorAll('video').forEach((v) => v.pause());
    content.replaceChildren();
    document.body.classList.remove('no-scroll');
    history.replaceState(null, '', '#archive');
    opener?.focus({ preventScroll: true });
  });

  // deep links like /#case-pollen open the file directly
  const m = location.hash.match(/^#case-(\w+)/);
  if (m) setTimeout(() => open(m[1]), 300);
})();
