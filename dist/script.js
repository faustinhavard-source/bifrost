/* An articulated mosaic of type, numbers, symbols and pixel patterns. */
(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const INK = '#111111';
  const DATA = '0123456789<>[]{}()/\\+=_*:;.,!?|#%@$';
  const COPY = [
    'BIFROST',
    'THE NEXT MOVE IS PHYSICAL.',
    'ROBOTICS PROGRAM',
    'ZURICH TO SHENZHEN',
    'A CALL TO BUILD',
    'HUMANOIDS. MACHINES.',
    'THINGS THAT MOVE.',
    "LET'S GET TO WORK.",
    '45 ROBOTICS FOUNDERS.',
    'ZURICH FIRST. THEN SHENZHEN.',
    '1 WEEK IN ZURICH',
    'THEN 2 WEEKS IN SHENZHEN',
    'BY THE BRIDGE',
    '× PLUTO HOUSE',
  ];
  const CHEST = [
    'BIFROST / BIFROST', 'ROBOTICS PROGRAM', 'THE NEXT MOVE', 'IS PHYSICAL.',
    '45 ROBOTICS FOUNDERS.', '1 WEEK IN ZURICH.', '2 WEEKS IN SHENZHEN.',
    'HUMANOIDS. MACHINES.', 'THINGS THAT MOVE.', 'A CALL TO BUILD',
    "LET'S GET TO WORK.", 'THE BRIDGE', '× PLUTO HOUSE',
  ];

  const add = (a, b) => a.map((v, i) => v + b[i]);
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const mul = (a, n) => a.map(v => v * n);
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const length = a => Math.hypot(...a);
  const unit = a => mul(a, 1 / (length(a) || 1));
  const mix = (a, b, t) => add(a, mul(sub(b, a), t));
  const yaw = 0.59;
  const pitch = -0.055;
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);

  function camera(p) {
    const z = -p[0] * sy + p[2] * cy;
    return [p[0] * cy + p[2] * sy, p[1] * cp - z * sp, p[1] * sp + z * cp];
  }

  function profile(stops, t) {
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const a = stops[i - 1], b = stops[i];
        const f = (t - a[0]) / (b[0] - a[0]);
        return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
      }
    }
    return stops[stops.length - 1].slice(1);
  }

  const profiles = {
    head: [[0, 12, 13], [.1, 25, 24], [.3, 31, 28], [.64, 30, 28], [.83, 25, 26], [1, 15, 18]],
    neck: [[0, 15, 15], [1, 16, 16]],
    torso: [[0, 47, 25], [.11, 69, 36], [.28, 72, 38], [.55, 61, 33], [.8, 45, 26], [1, 40, 25]],
    pelvis: [[0, 42, 25], [.4, 52, 30], [.75, 51, 28], [1, 39, 23]],
    arm: [[0, 18, 18], [.15, 24, 24], [.43, 23, 22], [.83, 17, 17], [1, 14, 14]],
    forearm: [[0, 14, 14], [.22, 19, 19], [.62, 16, 16], [1, 10, 11]],
    hand: [[0, 9, 7], [.25, 14, 8], [.75, 14, 7], [1, 12, 6]],
    finger: [[0, 2.7, 3], [.75, 2.7, 3], [1, 1.7, 2]],
    thigh: [[0, 22, 23], [.2, 29, 29], [.56, 27, 25], [.9, 18, 18], [1, 16, 16]],
    shin: [[0, 16, 16], [.24, 21, 23], [.52, 19, 20], [.85, 12, 13], [1, 12, 12]],
    foot: [[0, 11, 14], [.38, 15, 25], [.72, 17, 32], [1, 17, 32]],
  };

  function skeleton(phase) {
    const parts = [];
    const bob = Math.cos(phase * 2) * 2.6;
    const sway = Math.sin(phase) * 2;
    const origin = [sway, bob, 0];
    const at = p => add(p, origin);
    const make = (name, a, b, offset, twist = 0) => {
      const axis = unit(sub(b, a));
      const u = unit(cross(axis, [Math.sin(twist), 0, Math.cos(twist)]));
      const v = unit(cross(u, axis));
      parts.push({ name, a, b, axis, u, v, stops: profiles[name], offset, depth: camera(mix(a, b, .5))[2] });
    };
    const trimmed = (name, a, b, offset) => {
      const trim = 2 / length(sub(b, a));
      make(name, mix(a, b, trim), mix(a, b, 1 - trim), offset);
    };

    for (const side of [-1, 1]) {
      const p = phase + (side === 1 ? Math.PI : 0);
      const hip = at([side * 31, -5, 0]);
      const ankle = [side * 33 + sway, 268 - Math.pow(Math.max(0, -Math.sin(p)), 1.5) * 47, Math.cos(p) * 68];
      const delta = sub(ankle, hip);
      const d = Math.hypot(delta[1], delta[2]);
      const upper = 144, lower = 145;
      const along = (upper * upper - lower * lower + d * d) / (2 * d);
      const bend = Math.sqrt(Math.max(0, upper * upper - along * along));
      const knee = [hip[0], hip[1] + delta[1] / d * along - delta[2] / d * bend, hip[2] + delta[2] / d * along + delta[1] / d * bend];
      trimmed('thigh', hip, knee, side === 1 ? 10 : 8);
      trimmed('shin', knee, ankle, side === 1 ? 11 : 9);
      // Keep each sole level with the ground, independently of the shin angle.
      make('foot', add(ankle, [0, -8, 14]), add(ankle, [0, 16, 14]), 3);

      const swing = -.48 * Math.cos(p);
      const shoulder = at([side * 79, -171, -3]);
      const elbow = add(shoulder, [side * 9, 101 * Math.cos(swing), 101 * Math.sin(swing)]);
      const wrist = add(elbow, [-side * 4, 88 * Math.cos(swing + .24), 88 * Math.sin(swing + .24)]);
      const handDown = [0, Math.cos(swing + .17), Math.sin(swing + .17)];
      const knuckles = add(wrist, mul(handDown, 25));
      trimmed('arm', shoulder, elbow, side === 1 ? 2 : 4);
      trimmed('forearm', elbow, wrist, side === 1 ? 5 : 6);
      trimmed('hand', wrist, knuckles, 7);
      for (let finger = 0; finger < 4; finger++) {
        const spread = (finger - 1.5) * 6.8;
        const base = add(knuckles, [spread, -2, 0]);
        const tip = add(add(base, mul(handDown, [18, 23, 21, 16][finger])), [spread * .12, 0, 3]);
        make('finger', base, tip, 14 + finger);
      }
      const thumb = add(add(wrist, mul(handDown, 10)), [-side * 12, 0, 0]);
      make('finger', thumb, add(thumb, [-side * 11, 14, 4]), 18);
    }

    const twist = Math.sin(phase) * .045;
    make('pelvis', at([0, -54, -1]), at([0, 6, 0]), 12, -twist);
    make('torso', at([0, -188, 5]), at([0, -58, -1]), 0, twist);
    make('neck', at([0, -208, 7]), at([0, -187, 5]), 0);
    make('head', at([0, -279, 7]), at([0, -211, 9]), 0, -.05);
    return parts.sort((a, b) => a.depth - b.depth);
  }

  function hull(points) {
    points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const turn = (o, a, b) => (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]);
    const lower = [], upper = [];
    for (const p of points) {
      while (lower.length >= 2 && turn(lower[lower.length-2], lower[lower.length-1], p) <= 0) lower.pop();
      lower.push(p);
    }
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i];
      while (upper.length >= 2 && turn(upper[upper.length-2], upper[upper.length-1], p) <= 0) upper.pop();
      upper.push(p);
    }
    lower.pop(); upper.pop();
    return lower.concat(upper);
  }

  function surfacePoint(part, t, angle, radii) {
    return add(mix(part.a, part.b, t), add(mul(part.u, Math.sin(angle) * radii[0]), mul(part.v, Math.cos(angle) * radii[1])));
  }

  function createGlyphAtlas(makeCanvas, fontSize = 20) {
    const characters = [...new Set([...COPY, ...CHEST, DATA].join(''))].filter(c => c !== ' ');
    const cellWidth = Math.ceil(fontSize * .8), cellHeight = Math.ceil(fontSize * 1.2);
    const atlas = makeCanvas(cellWidth * 16, Math.ceil(characters.length / 16) * cellHeight);
    const brush = atlas.getContext('2d');
    const glyphs = {};
    brush.font = `${fontSize}px Terminal`;
    brush.fillStyle = INK;
    brush.strokeStyle = INK;
    brush.lineWidth = .6;
    brush.lineJoin = 'round';
    brush.textAlign = 'center';
    brush.textBaseline = 'middle';
    characters.forEach((character, index) => {
      const x = index % 16 * cellWidth, y = Math.floor(index / 16) * cellHeight;
      brush.strokeText(character, x + cellWidth / 2, y + cellHeight / 2);
      brush.fillText(character, x + cellWidth / 2, y + cellHeight / 2);
      glyphs[character] = [x, y];
    });
    return { atlas, glyphs, fontSize, cellWidth, cellHeight };
  }

  function drawGlyph(ctx, char, size, type) {
    if (type) {
      const glyph = type.glyphs[char];
      const w = type.cellWidth / type.fontSize * size, h = type.cellHeight / type.fontSize * size;
      ctx.drawImage(type.atlas, glyph[0], glyph[1], type.cellWidth, type.cellHeight, -w / 2, -h / 2, w, h);
    } else {
      ctx.font = `${size}px Terminal`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char, 0, 0);
    }
  }

  function drawDataTile(ctx, kind, char, width, height, size, type, column, row) {
    const x = -width / 2, y = -height / 2;
    if (kind < 3) {
      ctx.fillRect(x, y, width * 1.03, height * 1.03);
    } else if (kind < 5) {
      const step = size * .2;
      for (let r = 0; r < height / step; r++) {
        for (let c = 0; c < width / step; c++) {
          if ((r + c) % 2 === 0 || kind === 4) ctx.fillRect(x + c * step, y + r * step, step * .5, step * .5);
        }
      }
    } else if (kind === 5) {
      for (let stripe = y; stripe < y + height; stripe += size * .22) ctx.fillRect(x, stripe, width, size * .075);
    } else if (kind === 8) {
      if (column % 3 === 1 && row % 3 === 1) drawGlyph(ctx, char, size * 2.2, type);
    } else {
      drawGlyph(ctx, char, size, type);
    }
  }

  function drawPart(ctx, part, screen, scale, type) {
    const outline = [];
    for (const stop of part.stops) {
      for (let j = 0; j < 24; j++) outline.push(screen(surfacePoint(part, stop[0], j / 24 * TAU, stop.slice(1))));
    }
    const boundary = hull(outline);
    ctx.beginPath();
    boundary.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.closePath();
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

    const size = part.name === 'head' ? 9.2 : part.name === 'finger' ? 5 : part.name === 'foot' ? 6.5 : 10;
    const rowHeight = part.name === 'head' ? 7.7 : part.name === 'finger' || part.name === 'foot' ? 3.5 : 8.5;
    const nRows = Math.max(2, Math.floor(length(sub(part.b, part.a)) / rowHeight));
    const cameraDown = camera(part.axis);

    for (let row = 0; row < nRows; row++) {
      const t = (row + .5) / nRows;
      const radii = profile(part.stops, t);
      const circumference = Math.PI * (3 * (radii[0] + radii[1]) - Math.sqrt((3*radii[0]+radii[1])*(radii[0]+3*radii[1])));
      const nChars = Math.max(8, Math.round(circumference / (size * .43)));
      const text = part.name === 'torso' ? CHEST[row % CHEST.length] : COPY[(row + part.offset) % COPY.length];
      const line = text + '  ';
      const front = -Math.atan2(sy, cy);
      const copyRow = (part.name === 'torso' && [1, 5, 9, 13].includes(row)) || (part.name === 'head' && row === 1);

      for (let i = 0; i < nChars; i++) {
        // Centre each sentence on the visible face; the remaining type wraps around the volume.
        const index = i - Math.floor(nChars / 2);
        const angle = front + index / nChars * TAU;
        const normal = unit(add(mul(part.u, Math.sin(angle) / radii[0]), mul(part.v, Math.cos(angle) / radii[1])));
        const light = camera(normal)[2];
        if (light < .12) continue;
        const charIndex = ((index + Math.floor(text.length / 2)) % line.length + line.length) % line.length;
        const patch = (Math.imul(Math.floor(i / 3) + 1, 73856093) ^ Math.imul(Math.floor(row / 3) + 1, 19349663) ^ Math.imul(part.offset + part.name.length, 83492791)) >>> 0;
        const extremity = ['hand', 'finger', 'foot'].includes(part.name);
        const kind = patch % (extremity ? 8 : 10);
        const char = copyRow ? line[charIndex] : kind === 6 ? String((i + row + part.offset) % 10) : DATA[(patch + i + row * 7) % DATA.length];
        if (copyRow && char === ' ') continue;
        const point = screen(surfacePoint(part, t, angle, radii));
        const tangent = camera(unit(add(mul(part.u, Math.cos(angle) * radii[0]), mul(part.v, -Math.sin(angle) * radii[1]))));
        ctx.save();
        ctx.translate(point[0], point[1]);
        ctx.transform(tangent[0], tangent[1], cameraDown[0], cameraDown[1], 0, 0);
        ctx.fillStyle = INK;
        if (copyRow) drawGlyph(ctx, char, size * scale, type);
        else drawDataTile(ctx, kind, char, circumference / nChars * scale, length(sub(part.b, part.a)) / nRows * scale, size * scale, type, i, row);
        ctx.restore();
      }
    }
  }

  function drawFrame(ctx, width, height, milliseconds = 0, type) {
    ctx.clearRect(0, 0, width, height);
    const portrait = width <= 650 && height > width;
    const scale = Math.min(width / 355, height / (portrait ? 755 : 665));
    const screen = p => {
      const q = camera(p);
      return [width / 2 + (q[0] - 6) * scale, height * (portrait ? .46 : .5) + (q[1] - 2) * scale];
    };
    const phase = milliseconds / 2800 * TAU + .85;
    for (const part of skeleton(phase)) drawPart(ctx, part, screen, scale, type);
  }

  // The same renderer produces the static fallback and allows motion bounds to be checked offline.
  if (typeof module !== 'undefined' && module.exports) module.exports = { drawFrame, createGlyphAtlas, skeleton, camera, COPY };
  if (typeof document === 'undefined') return;

  const figure = document.querySelector('.figure');
  const canvas = figure.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reducedMotion.matches;
  let width = 0, height = 0, elapsed = 0, previous = 0, painted = 0, frame = 0;
  let type;

  function paint() { drawFrame(ctx, width, height, elapsed, type); }
  function resize() {
    const rect = figure.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width; height = rect.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    paint();
  }
  function tick(now) {
    if (previous) elapsed += Math.min(now - previous, 80);
    previous = now;
    if (now - painted >= 1000 / 30) { paint(); painted = now; }
    frame = requestAnimationFrame(tick);
  }
  function syncMotion() {
    cancelAnimationFrame(frame);
    previous = 0;
    figure.setAttribute('aria-pressed', String(paused));
    figure.setAttribute('aria-label', paused ? 'Play the walking humanoid' : 'Pause the walking humanoid');
    if (!paused && !document.hidden) frame = requestAnimationFrame(tick);
    else paint();
  }

  document.fonts.load('10px Terminal').then(async () => {
    type = createGlyphAtlas((w, h) => {
      const sheet = document.createElement('canvas');
      sheet.width = w; sheet.height = h;
      return sheet;
    });
    if (typeof createImageBitmap === 'function') {
      try { type.atlas = await createImageBitmap(type.atlas); } catch { /* Canvas remains a valid atlas. */ }
    }
    resize();
    figure.classList.add('ready');
    syncMotion();
    new ResizeObserver(resize).observe(figure);
    figure.addEventListener('click', () => { paused = !paused; syncMotion(); });
    reducedMotion.addEventListener('change', e => { paused = e.matches; syncMotion(); });
    document.addEventListener('visibilitychange', syncMotion);
  }).catch(() => { /* Keep the rendered still if the font cannot load. */ });
})();
