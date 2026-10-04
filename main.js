(() => {
  'use strict';

  // Effect settings (the design's default props).
  const CONFIG = {
    trailStyle: 'pixels',   // 'pixels' | 'glow'
    showPixelComets: true,
    showAgents: true,
    showMilkyWay: true,
    showTrail: true,
    trailIntensity: 1,      // 0.3 – 2.5
    starCount: 320          // 40 – 800
  };

  const PAL = ['124,108,255', '154,143,255', '34,211,238', '59,74,168', '90,79,207', '28,127,154', '186,178,255'];
  const TAU = 6.283;

  const root = document.getElementById('root');
  const starsCanvas = document.getElementById('stars');
  const trailCanvas = document.getElementById('trail');
  const sponsors = document.getElementById('sponsors');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, dpr = 1;
  let stars = [], parts = [], pix = [], last = null, lastCell = null;
  let meteor = null, nextMeteor = 5000, groups = [], pulses = [], nextPulse = 0, nextHand = 2500;
  let comets = [], lt = 0, sky = null, skyH = 0, scrollRaf = 0;

  /* ---------- Sizing ---------- */

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    if (!W || !H) return;
    [starsCanvas, trailCanvas].forEach(c => {
      c.width = W * dpr; c.height = H * dpr;
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    makeStars(); buildSky(); buildAgents();
  }

  /* ---------- Cursor trail ---------- */

  function onMove(e) {
    const x = e.clientX, y = e.clientY;
    if (!CONFIG.showTrail || reduced) { last = { x, y }; return; }
    const k = CONFIG.trailIntensity;
    if (last) {
      const dx = x - last.x, dy = y - last.y;
      const n = Math.min(6, Math.ceil(Math.hypot(dx, dy) / 5));
      const pixels = CONFIG.trailStyle === 'pixels';
      for (let i = 0; i < n; i++) {
        const t = i / n, px = last.x + dx * t, py = last.y + dy * t;
        if (pixels) {
          const cs = 7, gx = Math.floor(px / cs), gy = Math.floor(py / cs), key = gx + ',' + gy;
          if (key !== lastCell) {
            lastCell = key;
            pix.push({ gx, gy, cs, life: 1, c: PAL[Math.floor(Math.random() * PAL.length)] });
            if (Math.random() < .3) pix.push({ gx: gx - Math.sign(dx || 1), gy: gy - Math.sign(dy || 1), cs, life: .7, c: PAL[Math.floor(Math.random() * PAL.length)] });
          }
        } else {
          parts.push({ x: px, y: py, vx: -dx * .015 + (Math.random() - .5) * .3, vy: -dy * .015 + (Math.random() - .5) * .3, life: 1, r: (.8 + Math.random() * 1.1) * Math.sqrt(k) });
        }
      }
    }
    last = { x, y };
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

  /* ---------- Smooth scroll to sponsors ---------- */

  function smoothTo(el) {
    if (!el) return;
    const start = window.scrollY, end = el.getBoundingClientRect().top + start;
    if (reduced) { window.scrollTo(0, end); return; }
    const dur = 1200, t0 = performance.now();
    const ease = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    cancelAnimationFrame(scrollRaf);
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, start + (end - start) * ease(p));
      if (p < 1) scrollRaf = requestAnimationFrame(step);
    };
    scrollRaf = requestAnimationFrame(step);
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
    const tones = ['124,108,255', '34,170,200', '110,120,200', '70,90,170'];
    for (let i = 0; i < 90; i++) {
      const s = (Math.random() - .5) * L, w = bw * wob(s);
      const [x, y] = at(s, g() * w * .9);
      blob(x, y, W * (.04 + Math.random() * .11), tones[i % 4], .018 + Math.random() * .03);
    }
    for (let i = 0; i < 4200; i++) {
      const s = (Math.random() - .5) * L, w = bw * wob(s);
      const [x, y] = at(s, g() * w);
      c.fillStyle = `rgba(226,232,255,${.12 + Math.random() * .45})`;
      c.beginPath(); c.arc(x, y, .2 + Math.random() * .5, 0, TAU); c.fill();
    }
    for (let i = 0; i < 1800; i++) {
      c.fillStyle = `rgba(226,232,255,${.08 + Math.random() * .28})`;
      c.beginPath(); c.arc(Math.random() * W, Math.random() * h, .2 + Math.random() * .35, 0, TAU); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 34; i++) {
      const s = (Math.random() - .5) * L, w = bw * wob(s);
      const [x, y] = at(s, g() * w * .25);
      blob(x, y, W * (.025 + Math.random() * .05), '11,15,26', .35 + Math.random() * .25);
    }
    const vg = c.createRadialGradient(W * .5, h * .45, Math.min(W, h) * .3, W * .5, h * .45, Math.max(W, h) * .8);
    vg.addColorStop(0, 'rgba(11,15,26,0)'); vg.addColorStop(1, 'rgba(11,15,26,.7)');
    c.fillStyle = vg; c.fillRect(0, 0, W, h);
    const tile = document.createElement('canvas'); tile.width = tile.height = 140;
    const tc = tile.getContext('2d'), id = tc.createImageData(140, 140);
    for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 9; }
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
    pulses = [];
  }

  function drawAgents(c, t, sy) {
    const k = last, pos = (nd, g) => [nd.x, nd.y - sy * g.d];
    for (const g of groups) {
      const gy = g.cy - sy * g.d;
      const near = k ? Math.max(0, 1 - Math.hypot(k.x - g.cx, k.y - gy) / (g.R * 2.2)) : 0;
      g.glow += (near - g.glow) * .08;
      c.lineWidth = 1; c.strokeStyle = `rgba(160,170,255,${.14 + g.glow * .32})`;
      c.beginPath();
      for (const [a, b] of g.edges) { const [ax, ay] = pos(a, g), [bx, by] = pos(b, g); c.moveTo(ax, ay); c.lineTo(bx, by); }
      c.stroke();
    }
    if (!reduced && t > nextPulse && groups.length) {
      const g = groups[Math.floor(Math.random() * groups.length)];
      const e = g.edges[Math.floor(Math.random() * g.edges.length)], flip = Math.random() < .5;
      pulses.push({ a: flip ? e[1] : e[0], b: flip ? e[0] : e[1], ga: g, gb: g, t0: t, dur: 1100 + Math.random() * 600, arc: 0 });
      nextPulse = t + 380 + Math.random() * 520;
    }
    if (!reduced && t > nextHand && groups.length > 1) {
      const i = Math.floor(Math.random() * groups.length);
      let j = Math.floor(Math.random() * (groups.length - 1)); if (j >= i) j++;
      const ga = groups[i], gb = groups[j];
      pulses.push({ a: ga.nodes[Math.floor(Math.random() * ga.nodes.length)], b: gb.nodes[Math.floor(Math.random() * gb.nodes.length)], ga, gb, t0: t, dur: 2600, arc: .22 });
      nextHand = t + 4200 + Math.random() * 3500;
    }
    pulses = pulses.filter(p => {
      const q = (t - p.t0) / p.dur, [ax, ay] = pos(p.a, p.ga), [bx, by] = pos(p.b, p.gb);
      if (q >= 1) { p.b.f = 1; return false; }
      if (q < .05) p.a.f = Math.max(p.a.f, .6);
      let x, y;
      if (p.arc) {
        const mx = (ax + bx) / 2 - (by - ay) * p.arc, my = (ay + by) / 2 + (bx - ax) * p.arc;
        c.setLineDash([2, 6]); c.lineWidth = 1; c.strokeStyle = `rgba(34,211,238,${Math.sin(Math.PI * q) * .16})`;
        c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(mx, my, bx, by); c.stroke(); c.setLineDash([]);
        const u = 1 - q; x = u * u * ax + 2 * u * q * mx + q * q * bx; y = u * u * ay + 2 * u * q * my + q * q * by;
      } else { const e = q * q * (3 - 2 * q); x = ax + (bx - ax) * e; y = ay + (by - ay) * e; }
      c.fillStyle = 'rgba(34,211,238,.22)'; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill();
      c.fillStyle = 'rgba(220,250,255,.95)'; c.beginPath(); c.arc(x, y, 1.5, 0, TAU); c.fill();
      return true;
    });
    for (const g of groups) for (const nd of g.nodes) {
      const [x, y] = pos(nd, g), tw = reduced ? 1 : .8 + .2 * Math.sin(t * .0012 + nd.ph), hot = nd.f;
      c.fillStyle = hot > .1 ? `rgba(34,211,238,${.1 + hot * .3})` : `rgba(124,108,255,${.1 + g.glow * .14})`;
      c.beginPath(); c.arc(x, y, nd.r * (4 + hot * 3), 0, TAU); c.fill();
      c.fillStyle = `rgba(244,246,255,${(.75 + g.glow * .25) * tw})`;
      c.beginPath(); c.arc(x, y, nd.r, 0, TAU); c.fill();
      nd.f *= .955;
    }
  }

  /* ---------- Pixel comets ---------- */

  function spawnComet(t) {
    const up = Math.random() < .6;
    let dx = 1, dy = up ? -(.35 + Math.random() * .45) : (.3 + Math.random() * .4);
    const n = Math.hypot(dx, dy); dx /= n; dy /= n;
    const x = up ? -30 : -30 + Math.random() * W * .3;
    const y = up ? H * (.45 + Math.random() * .5) : -30;
    const cs = 8 + Math.floor(Math.random() * 4);
    const pal = PAL.slice().sort(() => Math.random() - .5).slice(0, 4);
    return { x, y, dx, dy, sp: .045 + Math.random() * .035, cs, pal, steps: [], key: null, max: 16 + Math.floor(Math.random() * 10), born: t };
  }

  function drawComets(c, t, dt) {
    if (reduced) return;
    const want = W < 700 ? 2 : 3;
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
    gr.addColorStop(0, `rgba(220,250,255,${al})`); gr.addColorStop(1, 'rgba(124,108,255,0)');
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
      const tw = reduced ? 1 : .65 + .35 * Math.sin(t * st.sp + st.ph);
      let y = (st.y - sy * st.d) % H; if (y < 0) y += H;
      const col = st.warm ? '200,192,255' : '226,232,250';
      if (st.big) { c.fillStyle = `rgba(${col},${.1 * tw})`; c.beginPath(); c.arc(st.x, y, st.r * 3.5, 0, TAU); c.fill(); }
      c.fillStyle = `rgba(${col},${st.a * tw})`; c.beginPath(); c.arc(st.x, y, st.r, 0, TAU); c.fill();
    }
    if (CONFIG.showPixelComets) drawComets(c, t, dt);
    drawMeteor(c, t);
    if (CONFIG.showAgents) drawAgents(c, t, sy);

    const x = trailCanvas.getContext('2d');
    x.clearRect(0, 0, W, H);
    const k = CONFIG.trailIntensity;
    if (pix.length) {
      pix = pix.filter(p => (p.life -= .028) > 0);
      for (const p of pix) { x.fillStyle = `rgba(${p.c},${Math.min(1, p.life * .6 * k)})`; x.fillRect(p.gx * p.cs, p.gy * p.cs, p.cs - 1, p.cs - 1); }
    }
    if (!parts.length) return;
    x.globalCompositeOperation = 'lighter';
    parts = parts.filter(p => (p.life -= 0.03) > 0);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vx *= .95; p.vy *= .95; p.vy += .02;
      const l = p.life, r = p.r * (0.4 + l), rr = Math.round(124 + 96 * l), g = Math.round(108 + 142 * l * l), a = Math.min(1, l * .32 * k);
      const grd = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
      grd.addColorStop(0, `rgba(${rr},${g},255,${a})`); grd.addColorStop(1, `rgba(${rr},${g},255,0)`);
      x.fillStyle = grd; x.beginPath(); x.arc(p.x, p.y, r * 3, 0, TAU); x.fill();
    }
    x.globalCompositeOperation = 'source-over';
  }

  /* ---------- Wiring ---------- */

  document.querySelectorAll('.js-go-sponsors').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); smoothTo(sponsors);
  }));

  // "Sign up" isn't live yet: block navigation and flash the tooltip on tap.
  document.querySelectorAll('.js-noop').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const wrap = a.closest('.tip-wrap');
    if (!wrap) return;
    wrap.classList.add('is-tapped');
    clearTimeout(wrap._tipTimer);
    wrap._tipTimer = setTimeout(() => wrap.classList.remove('is-tapped'), 1600);
  }));

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onMove);
  document.addEventListener('pointerleave', () => { last = null; });

  resize();
  setupReveal();
  const loop = t => { draw(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
})();
