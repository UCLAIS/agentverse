(() => {
  'use strict';

  // Effect settings (the design's default props).
  const CONFIG = {
    showPixelComets: true,
    showAgents: true,
    showMilkyWay: true,
    showTrail: true,
    trailIntensity: .85,    // 0.3 - 2.5
    starCount: 140          // 40 – 800
  };

  const PAL = ['112,82,240', '180,166,255', '34,208,232', '85,62,190', '148,123,255', '250,249,255'];
  const TAU = 6.283;

  const root = document.getElementById('root');
  const starsCanvas = document.getElementById('stars');
  const trailCanvas = document.getElementById('trail');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, dpr = 1;
  let stars = [], pix = [], last = null;
  let meteor = null, nextMeteor = 5000, groups = [];
  let comets = [], lt = 0, sky = null, skyH = 0;

  // A persistent star layer spans the entire page underneath the moving sky.
  // This also keeps every section atmospheric when animation is reduced.
  function buildStarMap() {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 1024;
    const c = tile.getContext('2d');
    let seed = 2026;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 180; i++) {
      const x = Math.floor(rand() * 1024), y = Math.floor(rand() * 1024);
      const color = i % 13 === 0 ? PAL[2] : i % 7 === 0 ? PAL[1] : '244,242,255';
      c.fillStyle = `rgba(${color},${.1 + rand() * .25})`;
      c.fillRect(x, y, 1, 1);
    }
    root.style.setProperty('--star-map', `url("${tile.toDataURL()}")`);
  }

  /* ---------- Sizing ---------- */

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    if (!W || !H) return;
    [starsCanvas, trailCanvas].forEach(c => {
      c.width = W * dpr; c.height = H * dpr;
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    resetPointer();
    makeStars(); buildSky(); buildAgents(); drawLandscapes();
    // Only size the host iframe; Devfolio owns the button's font and colours.
    document.querySelectorAll('.devfolio-apply').forEach(container => {
      const width = Math.floor(container.clientWidth);
      if (!width) return;
      const placeholder = container.querySelector('.apply-button');
      if (placeholder) {
        placeholder.dataset.buttonWidth = String(width);
        placeholder.style.width = width + 'px';
      }
      const frame = container.querySelector('.devfolio-button-iframe');
      if (frame) frame.style.width = width + 'px';
    });
    if (reduced) draw(0);
  }

  /* ---------- Pixel nebula horizons, rendered once per resize ---------- */

  function drawLandscapes() {
    document.querySelectorAll('[data-landscape]').forEach(canvas => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = w * dpr; canvas.height = h * dpr;
      const c = canvas.getContext('2d'); c.scale(dpr, dpr);
      const noise = (x, y) => {
        const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return v - Math.floor(v);
      };
      const edge = (x, layer) => h * (.35 + layer * .12)
        + Math.sin(x / w * 13 + layer * 1.8) * h * .07
        + Math.sin(x / w * 39 + layer) * h * .022
        + Math.sin(x / w * 113 + layer * .4) * h * .009;
      if (canvas.dataset.landscape === 'nebula') {
        for (let x = 0; x < w; x += 3) {
          const mid = h * .5 + Math.sin(x / w * 8) * h * .13 + Math.sin(x / w * 29) * h * .035;
          for (let y = 0; y < h; y += 3) {
            const spread = Math.exp(-Math.pow((y - mid) / (h * .13), 2));
            const alpha = spread * (.1 + noise(x, y) * .45);
            if (alpha < .015) continue;
            c.fillStyle = `rgba(144,109,255,${alpha})`;
            c.fillRect(x, y, 3, 3);
          }
        }
        return;
      }
      const colors = ['47,25,107', '76,43,154', '125,94,230', '75,45,147'];
      colors.forEach((rgb, layer) => {
        const gradient = c.createLinearGradient(0, h * .25, 0, h);
        gradient.addColorStop(0, `rgba(${rgb},.85)`);
        gradient.addColorStop(1, 'rgba(16,11,41,1)');
        c.fillStyle = gradient; c.beginPath();
        c.moveTo(0, h);
        for (let x = 0; x <= w + 3; x += 3) c.lineTo(x, Math.round(edge(x, layer) / 2) * 2);
        c.lineTo(w, h); c.closePath(); c.fill();
        c.strokeStyle = layer === 2 ? 'rgba(180,166,255,.7)' : 'rgba(112,82,240,.4)';
        c.lineWidth = 1; c.beginPath();
        for (let x = 0; x <= w + 3; x += 3) {
          const y = Math.round(edge(x, layer) / 2) * 2;
          if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
      });
      for (let x = 0; x < w; x += 3) {
        const top = edge(x, 2);
        for (let y = Math.ceil(top / 3) * 3; y < Math.min(h, top + h * .2); y += 3) {
          if (noise(x, y) < .65) continue;
          c.fillStyle = `rgba(180,166,255,${.22 * (1 - (y - top) / (h * .2))})`;
          c.fillRect(x, y, 2, 2);
        }
      }
    });
  }

  /* ---------- Cursor trail ---------- */

  const TRAIL_SPACING = 3, TRAIL_LIFETIME = 220, TRAIL_LIMIT = 240;

  function resetPointer() {
    last = null;
    pix = [];
    trailCanvas.getContext('2d').clearRect(0, 0, W, H);
  }

  function addTrailPoint(x, y, born) {
    const px = Math.round(x), py = Math.round(y), previous = pix[pix.length - 1];
    if (previous && previous.x === px && previous.y === py) previous.born = born;
    else pix.push({ x: px, y: py, born });
  }

  function onMove(e) {
    if (!CONFIG.showTrail || reduced || e.pointerType !== 'mouse' || e.target?.tagName === 'IFRAME') {
      resetPointer(); return;
    }
    const now = performance.now();
    const samples = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    // Coalesced samples retain curves; the final event always supplies the head.
    for (const sample of [...samples, e]) {
      const x = sample.clientX, y = sample.clientY;
      const eventTime = Number.isFinite(sample.timeStamp) && sample.timeStamp > 0 && sample.timeStamp <= now ? sample.timeStamp : now;
      const born = Math.max(last?.born || 0, eventTime);
      if (!last) addTrailPoint(x, y, born);
      else {
        const dx = x - last.x, dy = y - last.y;
        const count = Math.max(1, Math.ceil(Math.hypot(dx, dy) / TRAIL_SPACING));
        // Discard only the oldest portion of an exceptionally long sweep.
        for (let i = Math.max(1, count - TRAIL_LIMIT + 1); i <= count; i++) {
          addTrailPoint(last.x + dx * i / count, last.y + dy * i / count, last.born + (born - last.born) * i / count);
        }
      }
      if (pix.length > TRAIL_LIMIT) pix.splice(0, pix.length - TRAIL_LIMIT);
      last = { x, y, born };
    }
  }

  function drawTrail(t) {
    const c = trailCanvas.getContext('2d');
    c.clearRect(0, 0, W, H);
    pix = pix.filter(p => t - p.born < TRAIL_LIFETIME);
    for (const p of pix) {
      const age = Math.max(0, (t - p.born) / TRAIL_LIFETIME);
      const r = Math.round(34 + 78 * age), g = Math.round(208 - 126 * age), b = Math.round(232 + 8 * age);
      c.fillStyle = `rgba(${r},${g},${b},${.75 * CONFIG.trailIntensity * (1 - age) ** 2})`;
      c.fillRect(p.x - 1, p.y - 1, 3, 3);
    }
  }

  /* ---------- Scroll reveal ---------- */

  function setupReveal() {
    if (reduced || !('IntersectionObserver' in window)) return;
    const els = [...root.querySelectorAll('[data-reveal]')];
    els.forEach(el => el.style.setProperty('--i', +el.getAttribute('data-reveal') || 0));
    root.classList.add('reveal-ready');
    const show = el => { el.classList.add('is-in'); io.unobserve(el); };
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) show(en.target); });
    }, { threshold: .15 });
    els.forEach(el => io.observe(el));
    // Don't rely on the observer for what's already on screen at load.
    requestAnimationFrame(() => els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) show(el);
    }));
  }

  /* ---------- Section navigation ---------- */

  function smoothTo(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
  }

  /* ---------- Starfield ---------- */

  function makeStars() {
    stars = Array.from({ length: CONFIG.starCount }, () => {
      const big = Math.random() < 0.045;
      return {
        x: Math.random() * W, y: Math.random() * H,
        r: big ? 1.1 + Math.random() * .6 : .25 + Math.random() * .7,
        a: big ? .95 : .2 + Math.random() * .55,
        ph: Math.random() * TAU, sp: .0005 + Math.random() * .0015,
        d: .04 + Math.random() * .22, big, warm: Math.random() < .14
      };
    });
  }

  /* ---------- Milky Way (pre-rendered offscreen) ---------- */

  function buildSky() {
    const h = H * 1.4;
    const off = document.createElement('canvas');
    off.width = W * dpr; off.height = h * dpr;
    const c = off.getContext('2d'); c.scale(dpr, dpr);
    const g = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    const ang = -0.5, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const ox = W * .5, oy = h * .52, L = Math.hypot(W, h) * 1.1, bw = Math.max(W, h) * .11;
    const at = (s, o) => [ox + dx * s + nx * o, oy + dy * s + ny * o];
    const wob = s => 1 + .35 * Math.sin(s / L * 9) + .2 * Math.sin(s / L * 23);
    const blob = (x, y, r, rgb, a) => {
      const gr = c.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
      c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    };
    c.globalCompositeOperation = 'lighter';
    const tones = ['112,82,240', '92,56,184', '148,123,255', '65,43,132'];
    for (let i = 0; i < 90; i++) {
      const s = (Math.random() - .5) * L, w = bw * wob(s);
      const [x, y] = at(s, g() * w * .9);
      blob(x, y, W * (.04 + Math.random() * .11), tones[i % 4], .018 + Math.random() * .03);
    }
    for (let i = 0; i < 450; i++) {
      const s = (Math.random() - .5) * L, w = bw * wob(s);
      const [x, y] = at(s, g() * w);
      c.fillStyle = `rgba(226,232,255,${.08 + Math.random() * .25})`;
      c.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
    for (let i = 0; i < 120; i++) {
      c.fillStyle = `rgba(226,232,255,${.06 + Math.random() * .18})`;
      c.fillRect(Math.floor(Math.random() * W), Math.floor(Math.random() * h), 1, 1);
    }
    c.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 34; i++) {
      const s = (Math.random() - .5) * L, w = bw * wob(s);
      const [x, y] = at(s, g() * w * .25);
      blob(x, y, W * (.025 + Math.random() * .05), '8,7,25', .35 + Math.random() * .25);
    }
    const vg = c.createRadialGradient(W * .5, h * .45, Math.min(W, h) * .3, W * .5, h * .45, Math.max(W, h) * .8);
    vg.addColorStop(0, 'rgba(8,7,25,0)'); vg.addColorStop(1, 'rgba(8,7,25,.7)');
    c.fillStyle = vg; c.fillRect(0, 0, W, h);
    const tile = document.createElement('canvas'); tile.width = tile.height = 140;
    const tc = tile.getContext('2d'), id = tc.createImageData(140, 140);
    for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 3; }
    tc.putImageData(id, 0, 0);
    c.fillStyle = c.createPattern(tile, 'repeat'); c.fillRect(0, 0, W, h);
    sky = off; skyH = h;
  }

  /* ---------- Agent constellations ---------- */

  function buildAgents() {
    const m = W < 700;
    const centers = m ? [[.7, .16], [.28, .3], [.78, .44]] : [[.58, .2], [.84, .36], [.36, .13], [.7, .58], [.14, .26], [.93, .72]];
    const R = Math.min(W, H) * (m ? .16 : .1);
    groups = centers.map(([u, v], gi) => {
      const n = 4 + Math.floor(Math.random() * 3), cx = u * W, cy = v * H, nodes = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + Math.random() * .8, d = R * (.35 + Math.random() * .65);
        nodes.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * .8, r: 1.3 + Math.random() * 1, f: 0, ph: Math.random() * TAU });
      }
      nodes.sort((p, q) => Math.atan2(p.y - cy, p.x - cx) - Math.atan2(q.y - cy, q.x - cx));
      const edges = [];
      for (let i = 0; i < n - 1; i++) edges.push([nodes[i], nodes[i + 1]]);
      if (Math.random() < .7) edges.push([nodes[0], nodes[Math.floor(n / 2)]]);
      return { cx, cy, R, nodes, edges, glow: 0, d: .1 + gi * .015 };
    });
  }

  function drawAgents(c, t, sy) {
    for (const g of groups) {
      const pos = nd => [nd.x, ((nd.y - sy * g.d) % H + H) % H];
      c.setLineDash([3, 8]); c.strokeStyle = 'rgba(180,166,255,.15)'; c.lineWidth = .7;
      for (const [a, b] of g.edges) {
        const [ax, ay] = pos(a), [bx, by] = pos(b);
        if (Math.abs(ay - by) > g.R * 3) continue;
        c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
      }
      c.setLineDash([]);
      for (let i = 0; i < g.nodes.length; i++) {
        const nd = g.nodes[i], [x, y] = pos(nd);
        const alpha = reduced ? .6 : .45 + .2 * Math.sin(t * .0006 + nd.ph);
        const size = i === 0 ? 5 : 3;
        c.fillStyle = `rgba(${i === 0 ? PAL[2] : PAL[0]},${alpha})`;
        c.fillRect(Math.round(x), Math.round(y), size, size);
      }
    }
  }

  /* ---------- Pixel comets ---------- */

  function spawnComet(t) {
    const up = Math.random() < .6;
    let dx = 1, dy = up ? -(.35 + Math.random() * .45) : (.3 + Math.random() * .4);
    const n = Math.hypot(dx, dy); dx /= n; dy /= n;
    const x = up ? -30 : -30 + Math.random() * W * .3;
    const y = up ? H * (.45 + Math.random() * .5) : -30;
    const cs = 2 + Math.floor(Math.random() * 2);
    const pal = PAL.slice().sort(() => Math.random() - .5).slice(0, 4);
    return { x, y, dx, dy, sp: .045 + Math.random() * .035, cs, pal, steps: [], key: null, max: 16 + Math.floor(Math.random() * 10), born: t };
  }

  function drawComets(c, t, dt) {
    if (reduced) return;
    const want = W < 700 ? 1 : 2;
    while (comets.length < want) {
      const cm = spawnComet(t);
      const d = comets.length * (W * .35);
      cm.x += cm.dx * d; cm.y += cm.dy * d;
      comets.push(cm);
    }
    comets = comets.filter(cm => {
      cm.x += cm.dx * cm.sp * dt; cm.y += cm.dy * cm.sp * dt;
      const gx = Math.floor(cm.x / cm.cs), gy = Math.floor(cm.y / cm.cs), key = gx + ',' + gy;
      if (key !== cm.key) {
        cm.key = key;
        const step = [{ gx, gy, c: cm.pal[Math.floor(Math.random() * cm.pal.length)] }];
        if (Math.random() < .55) step.push({ gx, gy: gy + (cm.dy < 0 ? 1 : -1), c: cm.pal[Math.floor(Math.random() * cm.pal.length)] });
        if (Math.random() < .12) step.push({ gx: gx - 2, gy: gy + (cm.dy < 0 ? 2 : -2), c: cm.pal[0] });
        cm.steps.unshift(step);
        if (cm.steps.length > cm.max) cm.steps.pop();
      }
      cm.steps.forEach((st, i) => {
        const a = Math.pow(1 - i / cm.max, 1.5) * .7;
        for (const p of st) { c.fillStyle = `rgba(${p.c},${a})`; c.fillRect(p.gx * cm.cs, p.gy * cm.cs, cm.cs - 1, cm.cs - 1); }
      });
      return !(cm.x > W + 300 || cm.y < -300 || cm.y > H + 300);
    });
  }

  /* ---------- Shooting star ---------- */

  function drawMeteor(c, t) {
    if (reduced) return;
    if (!meteor && t > nextMeteor) {
      const ang = Math.PI * (.78 + Math.random() * .1);
      meteor = { x: W * (.3 + Math.random() * .7), y: H * Math.random() * .4, vx: Math.cos(ang), vy: Math.sin(ang), t0: t, len: 90 + Math.random() * 80 };
    }
    const m = meteor; if (!m) return;
    const p = (t - m.t0) / 900;
    if (p >= 1) { meteor = null; nextMeteor = t + 7000 + Math.random() * 9000; return; }
    const d = p * 420, hx = m.x + m.vx * d, hy = m.y + m.vy * d, tx = hx - m.vx * m.len, ty = hy - m.vy * m.len, al = Math.sin(Math.PI * p) * .8;
    const gr = c.createLinearGradient(hx, hy, tx, ty);
    gr.addColorStop(0, `rgba(220,250,255,${al})`); gr.addColorStop(1, 'rgba(112,82,240,0)');
    c.strokeStyle = gr; c.lineWidth = 1.2; c.beginPath(); c.moveTo(hx, hy); c.lineTo(tx, ty); c.stroke();
  }

  /* ---------- Frame ---------- */

  function draw(t) {
    if (!W || !H) return;
    const dt = Math.min(50, t - (lt || t)); lt = t;
    const sy = window.scrollY || 0, c = starsCanvas.getContext('2d');
    c.clearRect(0, 0, W, H);
    if (sky && CONFIG.showMilkyWay) c.drawImage(sky, 0, -Math.min(sy * .06, skyH - H), W, skyH);
    for (const st of stars) {
      const tw = reduced ? 1 : .75 + .25 * Math.sin(t * st.sp + st.ph);
      let y = (st.y - sy * st.d) % H; if (y < 0) y += H;
      const col = st.warm ? PAL[1] : '244,242,255';
      const size = st.big ? 2 : 1;
      c.fillStyle = `rgba(${col},${st.a * tw * .75})`;
      c.fillRect(Math.round(st.x), Math.round(y), size, size);
      if (st.big) {
        c.fillStyle = `rgba(${col},${st.a * tw * .18})`;
        c.fillRect(Math.round(st.x) - 2, Math.round(y), 6, 1);
        c.fillRect(Math.round(st.x), Math.round(y) - 2, 1, 6);
      }
    }
    if (CONFIG.showPixelComets) drawComets(c, t, dt);
    drawMeteor(c, t);
    if (CONFIG.showAgents) drawAgents(c, t, sy);

    drawTrail(t);
  }

  /* ---------- Wiring ---------- */

  function setupSectionNavigation() {
    const links = [...document.querySelectorAll('.header-nav a')];
    const markCurrent = id => links.forEach(link => {
      if (link.getAttribute('href') === '#' + id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) markCurrent(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
    document.querySelectorAll('main > section').forEach(section => observer.observe(section));
  }

  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const target = document.getElementById(a.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault(); smoothTo(target);
    history.replaceState(null, '', a.getAttribute('href'));
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }));

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', resetPointer);
  document.addEventListener('pointerover', e => {
    if (e.target?.tagName === 'IFRAME') resetPointer();
  });
  document.addEventListener('pointerout', e => {
    if (e.relatedTarget?.tagName === 'IFRAME') resetPointer();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) resetPointer();
  });
  window.addEventListener('blur', resetPointer);

  buildStarMap();
  resize();
  setupReveal();
  setupSectionNavigation();
  const loop = t => { draw(t); requestAnimationFrame(loop); };
  if (!reduced) requestAnimationFrame(loop);
})();
