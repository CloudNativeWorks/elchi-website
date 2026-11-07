import * as THREE from 'three';

/* Canvas-drawn textures for the hero scene (hero-3d.jsx): brushed metal,
   floor, rack fronts, perforated doors, lens dirt, rack signs, holographic
   endpoint labels and the shield crack. Nothing is downloaded. */

/* ---------- procedural textures (no downloads) ---------- */
export function canvasTex(w, h, draw, { repeat = [1, 1], srgb = false } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// smudges + fingerprint arcs, drawn on top of a roughness map
function smudges(g, w, h, rgba, n) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 20 + Math.random() * 60;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `${rgba}${0.12 + Math.random() * 0.18})`); grd.addColorStop(1, `${rgba}0)`);
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    if (Math.random() < 0.5) { // a fingerprint
      g.strokeStyle = `${rgba}0.22)`; g.lineWidth = 1;
      for (let k = 2; k < 14; k += 1.6) { g.beginPath(); g.ellipse(x, y, k * 1.3, k, Math.random(), 0.2, Math.PI * 1.7); g.stroke(); }
    }
  }
}
let TEX = null;
export function textures() {
  if (TEX) return TEX;
  // brushed metal: fine horizontal streaks (roughness)
  const brushed = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = 'rgb(105,105,105)'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5000; i++) {
      const v = 70 + Math.random() * 90;
      g.fillStyle = `rgba(${v},${v},${v},${0.08 + Math.random() * 0.12})`;
      g.fillRect(Math.random() * w, Math.random() * h, 20 + Math.random() * 180, 1);
    }
    smudges(g, w, h, 'rgba(200,200,200,', 14);
  });
  // glass: mostly clean, a few smudges, fingerprints and dust (roughness)
  const glassRough = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = 'rgb(18,18,18)'; g.fillRect(0, 0, w, h);
    smudges(g, w, h, 'rgba(150,150,150,', 18);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
  });
  // perforated steel door: hex hole grid (alpha) — LEDs show through the holes
  const perforated = canvasTex(256, 768, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#000';
    const r = 4.2, dx = 11, dy = 9.5;
    for (let row = 0, y = 6; y < h - 4; y += dy, row++) {
      for (let x = 6 + (row % 2) * dx / 2; x < w - 4; x += dx) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    }
    g.fillRect(0, 0, w, 0); // frame stays solid via the border below
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10); g.fillRect(0, 0, 10, h); g.fillRect(w - 10, 0, 10, h);
  });
  // lens dirt: soft blotches, a few hairs and specks
  const lensDirt = canvasTex(1024, 576, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 8 + Math.random() * 70;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      const a = 0.08 + Math.random() * 0.22;
      grd.addColorStop(0, `rgba(255,255,255,${a})`); grd.addColorStop(0.7, `rgba(255,255,255,${a * 0.4})`); grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1;
    for (let i = 0; i < 6; i++) { const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 40, y - 30, x + 60, y + 40, x + 110 * Math.random(), y + 20); g.stroke(); }
  }, { srgb: false });
  // polished concrete floor: 4×4 tiles per texture, seams + smudges
  const tile = (g, w, h, base, seam, smudge) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) {
      const v = Math.random();
      g.fillStyle = `rgba(${v > 0.5 ? 255 : 0},${v > 0.5 ? 255 : 0},${v > 0.5 ? 255 : 0},${Math.random() * 0.05})`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 40 + Math.random() * 160;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, smudge); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.fillStyle = seam;
    for (let k = 0; k <= 4; k++) { g.fillRect(k * (w / 4) - 2, 0, 4, h); g.fillRect(0, k * (h / 4) - 2, w, 4); }
  };
  const floorMap = canvasTex(1024, 1024, (g, w, h) => tile(g, w, h, '#16181f', 'rgba(4,5,8,.9)', 'rgba(255,255,255,.035)'), { repeat: [25, 25], srgb: true });
  const floorRough = canvasTex(1024, 1024, (g, w, h) => tile(g, w, h, 'rgb(90,90,90)', 'rgba(255,255,255,.95)', 'rgba(255,255,255,.18)'), { repeat: [25, 25] });
  const floorDistort = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) {
      const v = Math.random() * 255 | 0;
      g.fillStyle = `rgba(${v},${v},${v},.08)`;
      g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 4 + Math.random() * 18, 0, 7); g.fill();
    }
  }, { repeat: [12, 12] });
  // a rack's front: 1U servers, switches and blanks (colour + emissive LED masks)
  const units = [];
  for (let u = 0; u < 30; u++) {
    const r = Math.random();
    units.push(r < 0.62 ? 'server' : r < 0.8 ? 'switch' : r < 0.9 ? 'storage' : 'blank');
  }
  const UH = 1024 / 30;
  const drawRack = (g, w, h, emissive) => {
    g.fillStyle = emissive ? '#000' : '#0d0e12'; g.fillRect(0, 0, w, h);
    units.forEach((kind, u) => {
      const y = u * UH;
      if (!emissive) {
        g.fillStyle = kind === 'blank' ? '#15171c' : '#1d2027';
        g.fillRect(6, y + 1.5, w - 12, UH - 3);
        g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(6, y + 1.5, w - 12, 1);
        g.fillStyle = '#5b616d'; g.fillRect(10, y + 6, 5, UH - 12); g.fillRect(w - 15, y + 6, 5, UH - 12); // handles
      }
      if (kind === 'server') {
        if (!emissive) {
          g.fillStyle = '#07080b';
          for (let x = 24; x < w * 0.55; x += 7) for (let yy = y + 7; yy < y + UH - 6; yy += 6) g.fillRect(x, yy, 4, 3); // vents
          g.fillStyle = '#2a2e37';
          for (let d = 0; d < 4; d++) g.fillRect(w * 0.58 + d * 22, y + 6, 19, UH - 12); // drive bays
        }
        const led = Math.random();
        g.fillStyle = emissive ? (led < 0.85 ? '#3ef08a' : '#ffb020') : '#123';
        g.fillRect(w - 30, y + 9, 5, 4);
        g.fillStyle = emissive ? '#4aa3ff' : '#123';
        if (Math.random() < 0.6) g.fillRect(w - 30, y + UH - 13, 5, 4);
        if (emissive) for (let d = 0; d < 4; d++) if (Math.random() < 0.7) { g.fillStyle = '#56f59a'; g.fillRect(w * 0.58 + d * 22 + 7, y + UH - 10, 5, 3); }
      } else if (kind === 'switch') {
        for (let x = 24; x < w - 40; x += 11) {
          for (let row = 0; row < 2; row++) {
            if (!emissive) { g.fillStyle = '#050608'; g.fillRect(x, y + 6 + row * 12, 8, 8); }
            else if (Math.random() < 0.55) { g.fillStyle = Math.random() < 0.85 ? '#3ef08a' : '#ffb020'; g.fillRect(x + 1, y + 6 + row * 12, 3, 2); }
          }
        }
      } else if (kind === 'storage') {
        for (let d = 0; d < 10; d++) {
          if (!emissive) { g.fillStyle = '#272b33'; g.fillRect(22 + d * 21, y + 5, 18, UH - 10); }
          else if (Math.random() < 0.8) { g.fillStyle = '#4aa3ff'; g.fillRect(22 + d * 21 + 7, y + UH - 9, 4, 3); }
        }
      }
    });
  };
  const rackMap = canvasTex(320, 1024, (g, w, h) => drawRack(g, w, h, false), { srgb: true });
  const rackEmit = canvasTex(320, 1024, (g, w, h) => drawRack(g, w, h, true), { srgb: true });
  TEX = { brushed, floorMap, floorRough, floorDistort, rackMap, rackEmit, glassRough, perforated, lensDirt };
  return TEX;
}

/* ---------- signage ---------- */
const MONO = '"Geist Mono", ui-monospace, Menlo, monospace';
function textCanvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const paint = () => { const g = c.getContext('2d'); g.clearRect(0, 0, w, h); draw(g, w, h); tex.needsUpdate = true; };
  paint();
  document.fonts?.ready.then(paint); // repaint once Geist Mono is in
  return tex;
}
// rack sign: dark acrylic, edge-lit service colour, status on the right
export function signTexture(label, color, down) {
  const col = down ? '#fb7185' : color;
  return textCanvas(1024, 250, (g, w, h) => {
    g.fillStyle = '#05070c';
    g.fillRect(0, 0, w, h);
    g.fillStyle = col; g.fillRect(0, h - 10, w, 10);
    g.shadowColor = col; g.shadowBlur = 30;
    g.beginPath(); g.arc(w - 64, h / 2 - 3, 20, 0, 7); g.fill();
    let size = 104;
    g.font = `600 ${size}px ${MONO}`;
    const text = down ? `${label.toUpperCase()} · DOWN` : label.toUpperCase();
    while (g.measureText(text).width > w - 260 && size > 56) { size -= 6; g.font = `600 ${size}px ${MONO}`; }
    g.textBaseline = 'middle';
    g.textAlign = 'center'; // centred: a neighbouring cabinet can't clip the start of the name
    g.fillStyle = down ? '#ffd1d9' : '#f4f7ff';
    g.shadowColor = col; g.shadowBlur = 22;
    g.fillText(text, (w - 100) / 2, h / 2);
  });
}
export const SIGN_COLORS = { orders: '#22d3ee', usersA: '#8b93ff', usersB: '#8b93ff', pay: '#34d399', payNew: '#34d399' };
export function holoTexture(text) {
  return textCanvas(1024, 160, (g, w, h) => {
    g.font = `500 64px ${MONO}`;
    const tw = g.measureText(text).width + 70;
    g.fillStyle = 'rgba(60,70,180,0.22)';
    g.fillRect(0, 20, tw, h - 40);
    g.fillStyle = 'rgba(170,185,255,0.9)';
    g.fillRect(0, 20, 5, h - 40);
    for (let y = 22; y < h - 20; y += 6) { g.fillStyle = 'rgba(255,255,255,0.035)'; g.fillRect(0, y, tw, 2); }
    g.textBaseline = 'middle';
    g.fillStyle = '#dbe2ff';
    g.shadowColor = '#7c8cff'; g.shadowBlur = 16;
    g.fillText(text, 36, h / 2 + 3);
  });
}


/* ---------- Shield impact: cracked glass ---------- */
export const crackTexture = () => canvasTex(256, 256, (g, w, h) => {
  const cx = w / 2, cy = h / 2;
  g.strokeStyle = 'rgba(255,215,225,.95)';
  g.lineCap = 'round';
  for (let r = 0; r < 11; r++) {
    let a = (r / 11) * Math.PI * 2 + Math.random() * 0.4;
    let x = cx, y = cy;
    g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(x, y);
    const len = 50 + Math.random() * 70;
    for (let s = 0; s < 7; s++) {
      a += (Math.random() - 0.5) * 0.5;
      x += Math.cos(a) * (len / 7); y += Math.sin(a) * (len / 7);
      g.lineTo(x, y);
      g.lineWidth = Math.max(0.6, g.lineWidth - 0.3);
      if (Math.random() < 0.25) { // a short branch
        g.moveTo(x, y);
        g.lineTo(x + Math.cos(a + 0.9) * 14, y + Math.sin(a + 0.9) * 14);
        g.moveTo(x, y);
      }
    }
    g.stroke();
  }
});
