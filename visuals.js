const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let W, H, CX, CY;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  CX = W / 2; CY = H / 2;
}
window.addEventListener('resize', resize);
resize();

// ---------- Live-adjustable visual parameters (defaults) ----------
let PARTICLE_COUNT = 260;
let hueStart = 260;
let hueRange = 100;
let reactivity = 1.0;
let barHeightScale = 1.0;
let mirrorEnabled = true;
let gapDensity = 0.35;
let waveHeightScale = 1.0;
let bgMedia = null;       // HTMLImageElement or HTMLVideoElement
let bgMediaType = null;   // 'image' | 'video'
let bgObjectUrl = null;
let bgDim = 0.35;
let BLOB_COUNT = 22;
let blobHueStart = 300;
let blobHueRange = 80;
let blobMinSize = 12;
let blobMaxSize = 34;

// ---------- Preset visibility toggles ----------
let circleEnabled = true;
let particlesEnabled = true;
let waveEnabled = true;
let blobsEnabled = true;

function clearBackground() {
  if (bgMediaType === 'video' && bgMedia) {
    bgMedia.pause();
    bgMedia.src = '';
  }
  if (bgObjectUrl) { URL.revokeObjectURL(bgObjectUrl); bgObjectUrl = null; }
  bgMedia = null;
  bgMediaType = null;
}

// ---------- Particle system (center burst) ----------
class Particle {
  constructor() { this.reset(); }
  reset() {
    const angle = Math.random() * Math.PI * 2;
    this.angle = angle;
    this.radius = 40 + Math.random() * 20;
    this.baseSpeed = 0.6 + Math.random() * 1.2;
    this.speed = this.baseSpeed;
    this.size = 1 + Math.random() * 2;
    this.assignHue();
    this.life = 1;
    this.decay = 0.004 + Math.random() * 0.006;
  }
  assignHue() {
    this.hue = (hueStart + Math.random() * hueRange) % 360;
  }
  update(energyBoost, speedMultiplier) {
    this.speed = this.baseSpeed * speedMultiplier * (1 + energyBoost * 6);
    this.radius += this.speed;
    this.life -= this.decay * (1 + energyBoost * 2) * Math.max(speedMultiplier, 0.15);
    if (this.life <= 0 || this.radius > Math.max(W, H) * 0.75) this.reset();
  }
  draw() {
    const x = CX + Math.cos(this.angle) * this.radius;
    const y = CY + Math.sin(this.angle) * this.radius;
    ctx.beginPath();
    ctx.arc(x, y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue}, 90%, 65%, ${Math.max(this.life, 0)})`;
    ctx.fill();
  }
}

let particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());

function setParticleCount(n) {
  PARTICLE_COUNT = n;
  if (particles.length < n) {
    while (particles.length < n) particles.push(new Particle());
  } else {
    particles.length = n;
  }
}
function recolorParticles() { particles.forEach(p => p.assignHue()); }

// ---------- Floating glowing blobs preset ----------
class Blob {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    const angle = Math.random() * Math.PI * 2;
    this.baseSpeed = 0.3 + Math.random() * 0.7;
    this.vx = Math.cos(angle);
    this.vy = Math.sin(angle);
    this.baseRadius = blobMinSize + Math.random() * (blobMaxSize - blobMinSize);
    this.assignHue();
    this.pulse = 0;
  }
  assignHue() {
    this.hue = (blobHueStart + Math.random() * blobHueRange) % 360;
  }
  update(energyBoost, speedMultiplier, beatFlash) {
    const speed = this.baseSpeed * speedMultiplier * (1 + energyBoost * 5);
    this.x += this.vx * speed;
    this.y += this.vy * speed;
    if (this.x < 0 || this.x > W) { this.vx *= -1; this.x = Math.max(0, Math.min(W, this.x)); }
    if (this.y < 0 || this.y > H) { this.vy *= -1; this.y = Math.max(0, Math.min(H, this.y)); }
    this.pulse = beatFlash;
  }
  draw() {
    const r = this.baseRadius * (1 + this.pulse * 0.9);
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 2.4);
    grad.addColorStop(0, `hsla(${this.hue}, 95%, 72%, ${0.85})`);
    grad.addColorStop(0.4, `hsla(${this.hue}, 95%, 60%, 0.35)`);
    grad.addColorStop(1, `hsla(${this.hue}, 95%, 50%, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

let blobs = Array.from({ length: BLOB_COUNT }, () => new Blob());
function setBlobCount(n) {
  BLOB_COUNT = n;
  if (blobs.length < n) {
    while (blobs.length < n) blobs.push(new Blob());
  } else {
    blobs.length = n;
  }
}
function recolorBlobs() { blobs.forEach(b => b.assignHue()); }
function resizeBlobs() { blobs.forEach(b => { b.baseRadius = blobMinSize + Math.random() * (blobMaxSize - blobMinSize); }); }

// ---------- Beat detection ----------
let bassHistory = [];
const HISTORY_LEN = 30;
let lastBeatTime = 0;

function detectBeat(bassEnergy) {
  bassHistory.push(bassEnergy);
  if (bassHistory.length > HISTORY_LEN) bassHistory.shift();
  const avg = bassHistory.reduce((a, b) => a + b, 0) / bassHistory.length;
  const now = performance.now();
  const isBeat = bassEnergy > avg * 1.35 && bassEnergy > 0.15 && (now - lastBeatTime) > 180;
  if (isBeat) lastBeatTime = now;
  return isBeat;
}

// ---------- Circular spectrum sampling / gap mask ----------
const BAR_COUNT = 200;       // fixed resolution of the ring, independent of FFT bin count
const HALF_BAR_COUNT = BAR_COUNT / 2;
let gapMask = new Array(BAR_COUNT).fill(1);
let lastMaskUpdate = 0;
const MASK_UPDATE_INTERVAL = 550; // ms, how often the "broken" pattern reshuffles

function regenerateGapMask() {
  for (let i = 0; i < BAR_COUNT; i++) {
    gapMask[i] = Math.random() < gapDensity ? (0.08 + Math.random() * 0.18) : 1;
  }
}

function sampleFreqAt(fraction) {
  if (!analyser) return 0.05 + Math.sin(fraction * 20 + Date.now() * 0.001) * 0.03;
  const usableLen = Math.floor(freqData.length * 0.85);
  const idx = Math.min(usableLen - 1, Math.floor(fraction * usableLen));
  return freqData[idx] / 255;
}

function drawMediaCover(media) {
  const mw = media.videoWidth || media.naturalWidth;
  const mh = media.videoHeight || media.naturalHeight;
  if (!mw || !mh) return;
  const canvasRatio = W / H;
  const mediaRatio = mw / mh;
  let sx = 0, sy = 0, sw = mw, sh = mh;
  if (mediaRatio > canvasRatio) {
    sw = mh * canvasRatio;
    sx = (mw - sw) / 2;
  } else {
    sh = mw / canvasRatio;
    sy = (mh - sh) / 2;
  }
  ctx.drawImage(media, sx, sy, sw, sh, 0, 0, W, H);
}

function drawBar(angle, baseRadius, barLength, hue, value) {
  const x1 = Math.cos(angle) * baseRadius;
  const y1 = Math.sin(angle) * baseRadius;
  const x2 = Math.cos(angle) * (baseRadius + barLength);
  const y2 = Math.sin(angle) * (baseRadius + barLength);
  ctx.strokeStyle = `hsla(${hue}, 95%, ${55 + value * 25}%, ${0.55 + value * 0.4})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// ---------- Floating waveform ribbon preset (reference: layered glowing wave) ----------
const WAVE_LAYERS = 30;
const WAVE_POINTS = 100;

function drawWaveFlow(elapsed) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let L = 0; L < WAVE_LAYERS; L++) {
    const layerT = L / (WAVE_LAYERS - 1);      // 0..1
    const offsetFactor = (layerT - 0.5) * 2;   // -1..1
    const dy = offsetFactor * Math.min(H, W) * 0.11;
    const ampScale = 1 - Math.abs(offsetFactor) * 0.55;
    const phase = layerT * 4.0 + elapsed * 0.0006;

    ctx.beginPath();
    for (let p = 0; p <= WAVE_POINTS; p++) {
      const fraction = p / WAVE_POINTS;
      const x = fraction * W;
      const freqVal = sampleFreqAt(fraction);
      const wobble = Math.sin(fraction * 10 + phase) * 0.15;
      const amp = (freqVal * 0.75 + wobble) * ampScale * Math.min(H, W) * 0.26 * waveHeightScale;
      const y = CY + dy + amp * Math.sin(fraction * Math.PI * 2 * 3 + phase * 2);
      if (p === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    const hue = 210 + layerT * 110;
    const alpha = 0.08 + (1 - Math.abs(offsetFactor)) * 0.32;
    ctx.strokeStyle = `hsla(${hue}, 95%, 65%, ${alpha})`;
    ctx.lineWidth = 1.3;
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- Render loop ----------
let beatFlash = 0;
let energySmooth = 0;
const RAMP_DURATION = 5000; // ms — particles/blobs start slow, build up over this window

function draw() {
  requestAnimationFrame(draw);

  if (bgMedia) {
    drawMediaCover(bgMedia);
    ctx.fillStyle = `rgba(5, 5, 10, ${bgDim})`;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = 'rgba(5, 5, 10, 0.28)';
    ctx.fillRect(0, 0, W, H);
  }

  let bassEnergy = 0, overallEnergy = 0;

  if (analyser) {
    analyser.getByteFrequencyData(freqData);

    const bassEnd = Math.floor(freqData.length * 0.12);
    for (let i = 0; i < bassEnd; i++) bassEnergy += freqData[i];
    bassEnergy = bassEnergy / bassEnd / 255;

    for (let i = 0; i < freqData.length; i++) overallEnergy += freqData[i];
    overallEnergy = overallEnergy / freqData.length / 255;
  }

  energySmooth += (overallEnergy - energySmooth) * 0.15;

  const isBeat = analyser ? detectBeat(bassEnergy) : false;
  if (isBeat) beatFlash = 1;
  beatFlash *= 0.9;

  const now = performance.now();
  if (now - lastMaskUpdate > MASK_UPDATE_INTERVAL) {
    regenerateGapMask();
    lastMaskUpdate = now;
  }

  // ---- Circular spectrum ----
  if (circleEnabled) {
    const baseRadius = Math.min(W, H) * 0.16 * (1 + beatFlash * 0.06);
    ctx.save();
    ctx.translate(CX, CY);

    if (mirrorEnabled) {
      for (let i = 0; i < HALF_BAR_COUNT; i++) {
        const fraction = i / HALF_BAR_COUNT;
        const value = sampleFreqAt(fraction);
        const mask = gapMask[i];
        const barLength = (6 + value * Math.min(W, H) * 0.22 * barHeightScale) * mask;
        const angleStep = Math.PI / HALF_BAR_COUNT;
        const angleRight = -Math.PI / 2 + i * angleStep;
        const angleLeft = -Math.PI / 2 - i * angleStep;
        const hue = 190 + fraction * 160;
        drawBar(angleRight, baseRadius, barLength, hue, value);
        drawBar(angleLeft, baseRadius, barLength, hue, value);
      }
    } else {
      for (let i = 0; i < BAR_COUNT; i++) {
        const fraction = i / BAR_COUNT;
        const value = sampleFreqAt(fraction);
        const mask = gapMask[i];
        const barLength = (6 + value * Math.min(W, H) * 0.22 * barHeightScale) * mask;
        const angle = fraction * Math.PI * 2;
        const hue = 190 + fraction * 160;
        drawBar(angle, baseRadius, barLength, hue, value);
      }
    }
    ctx.restore();

    // ---- Center glow (part of the circular spectrum preset) ----
    const glowR = baseRadius * (0.9 + beatFlash * 0.5);
    const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, glowR);
    grad.addColorStop(0, `rgba(180, 130, 255, ${0.25 + beatFlash * 0.35})`);
    grad.addColorStop(1, 'rgba(180, 130, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(CX, CY, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Floating waveform ribbon ----
  if (waveEnabled) drawWaveFlow(now);

  // ---- Particles & blobs: slow start, then build up clearly with the music ----
  const rampProgress = playbackStartTime ? Math.min((now - playbackStartTime) / RAMP_DURATION, 1) : 0;
  const speedMultiplier = 0.05 + 0.95 * rampProgress;
  const energyBoost = (energySmooth * 0.6 + beatFlash * 0.8) * reactivity * rampProgress;

  if (particlesEnabled) {
    particles.forEach(p => { p.update(energyBoost, speedMultiplier); p.draw(); });
  }
  if (blobsEnabled) {
    blobs.forEach(b => { b.update(energyBoost, speedMultiplier, beatFlash); b.draw(); });
  }
}
