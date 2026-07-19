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
let particleSpread = 1.6;   // how far particles travel before recycling
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
let blobGlow = 1.0;       // scales the soft halo around each blob

// ---------- Positions (fractions of the viewport, 0..1) ----------
let circlePosX = 0.5, circlePosY = 0.5;     // circular spectrum ring + its center glow
let particlePosX = 0.5, particlePosY = 0.5; // where center-burst particles emit from
let particleOX = 0, particleOY = 0;         // resolved pixel origin, set each frame

// ---------- Neon saber ring preset ----------
let saberHue = 180;        // turquoise like the reference by default
let saberGlow = 1.0;       // glow / bloom intensity
let saberRadius = 0.18;    // fraction of min(W, H)
let saberPosX = 0.5, saberPosY = 0.5;

// ---------- Beat / frequency-band reactivity ----------
// The visuals react to one slice of the spectrum. Presets name the slice after
// the instrument that usually lives there; 'custom' lets the user dial it in.
const BAND_PRESETS = {
  bass:   [0.00, 0.12],   // kick / sub
  mid:    [0.12, 0.45],   // snare / body
  treble: [0.45, 0.90],   // hats / air
  full:   [0.00, 1.00],
};
let bandSource = 'bass';
let bandLow = 0.00;
let bandHigh = 0.12;
let beatSensitivity = 1.30;   // how far above the running average counts as a beat
let beatMinInterval = 110;    // ms — lower lets fast tracks retrigger

// ---------- Preset visibility toggles ----------
let circleEnabled = true;
let particlesEnabled = true;
let waveEnabled = true;
let blobsEnabled = true;
let saberEnabled = true;

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
    this.baseSpeed = 0.8 + Math.random() * 1.6;
    this.speed = this.baseSpeed;
    this.size = 1 + Math.random() * 2;
    this.assignHue();
    this.life = 1;
    // baseDecay is divided by particleSpread at update time, so raising the
    // spread slider keeps particles alive long enough to actually get there
    this.baseDecay = 0.0025 + Math.random() * 0.0045;
    this.impulse = 0;
  }
  assignHue() {
    this.hue = (hueStart + Math.random() * hueRange) % 360;
  }
  update(energyBoost, speedMultiplier, beatImpulse) {
    // each beat slams the particle outward, then the kick bleeds off
    this.impulse = Math.max(this.impulse * 0.90, beatImpulse);
    this.speed = this.baseSpeed * speedMultiplier * (1 + energyBoost * 10 + this.impulse * 9);
    this.radius += this.speed;
    const decay = this.baseDecay / particleSpread;
    this.life -= decay * (1 + energyBoost * 2) * Math.max(speedMultiplier, 0.15);
    if (this.life <= 0 || this.radius > Math.max(W, H) * 0.75 * particleSpread) this.reset();
  }
  draw() {
    const x = particleOX + Math.cos(this.angle) * this.radius;
    const y = particleOY + Math.sin(this.angle) * this.radius;
    ctx.beginPath();
    ctx.arc(x, y, this.size * (1 + this.impulse * 0.6), 0, Math.PI * 2);
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
    this.burst = 0;
  }
  assignHue() {
    this.hue = (blobHueStart + Math.random() * blobHueRange) % 360;
  }
  update(energyBoost, speedMultiplier, beatFlash, isBeat) {
    // On every detected beat the blob veers and lunges, so even on fast tracks
    // (where the smoothed energy barely moves) the motion still reads clearly.
    if (isBeat) {
      const a = Math.atan2(this.vy, this.vx) + (Math.random() - 0.5) * 0.9;
      this.vx = Math.cos(a);
      this.vy = Math.sin(a);
      this.burst = 1;
    }
    this.burst *= 0.90;
    const speed = this.baseSpeed * speedMultiplier * (1 + energyBoost * 6 + this.burst * 6);
    this.x += this.vx * speed;
    this.y += this.vy * speed;
    if (this.x < 0 || this.x > W) { this.vx *= -1; this.x = Math.max(0, Math.min(W, this.x)); }
    if (this.y < 0 || this.y > H) { this.vy *= -1; this.y = Math.max(0, Math.min(H, this.y)); }
    this.pulse = Math.max(beatFlash, this.burst);
  }
  draw() {
    const r = this.baseRadius * (1 + this.pulse * 0.9);
    const R = r * 2.6 * blobGlow;   // halo size scales with the glow slider
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, R);
    // Additive blending (set by drawBlobs) means alphas stack, so these stay low
    // and the outer stop fades to a fully transparent version of the SAME hue —
    // never toward black, which is what used to leave dark rings on overlap.
    grad.addColorStop(0,    `hsla(${this.hue}, 100%, 82%, 0.55)`);
    grad.addColorStop(0.16, `hsla(${this.hue}, 96%, 66%, 0.30)`);
    grad.addColorStop(0.45, `hsla(${this.hue}, 95%, 58%, 0.10)`);
    grad.addColorStop(1,    `hsla(${this.hue}, 95%, 55%, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, R, 0, Math.PI * 2);
    ctx.fill();

    // tight bright core for a bit of sparkle
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue}, 100%, 90%, ${0.28 + this.pulse * 0.35})`;
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

function drawBlobs(energyBoost, speedMultiplier, beatFlash, isBeat) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  blobs.forEach(b => { b.update(energyBoost, speedMultiplier, beatFlash, isBeat); b.draw(); });
  ctx.restore();
}

// ---------- Beat detection ----------
let bandHistory = [];
const HISTORY_LEN = 43;   // ~0.7s at 60fps
let lastBeatTime = 0;

// Average energy across the currently selected slice of the spectrum.
function bandEnergy(lowFrac, highFrac) {
  if (!analyser) return 0;
  const n = freqData.length;
  const start = Math.max(0, Math.floor(n * lowFrac));
  const end = Math.max(start + 1, Math.min(n, Math.floor(n * highFrac)));
  let sum = 0;
  for (let i = start; i < end; i++) sum += freqData[i];
  return sum / (end - start) / 255;
}

function detectBeat(energy) {
  bandHistory.push(energy);
  if (bandHistory.length > HISTORY_LEN) bandHistory.shift();
  const avg = bandHistory.reduce((a, b) => a + b, 0) / bandHistory.length;
  // Variance term: on busy/loud passages the average alone stops discriminating,
  // so require the peak to also stand out from the recent spread.
  const variance = bandHistory.reduce((a, b) => a + (b - avg) * (b - avg), 0) / bandHistory.length;
  const threshold = avg * beatSensitivity + Math.sqrt(variance) * 0.4;
  const now = performance.now();
  const isBeat = energy > threshold && energy > 0.08 && (now - lastBeatTime) > beatMinInterval;
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

// ---------- Neon saber ring preset (glowing soundwave circle, saber bloom) ----------
const SABER_LAYERS = 3;
const SABER_POINTS = 170;

function drawSaberRing(elapsed) {
  const ox = W * saberPosX, oy = H * saberPosY;
  const baseR = Math.min(W, H) * saberRadius * (1 + beatFlash * 0.10);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  for (let layer = 0; layer < SABER_LAYERS; layer++) {
    const layerPhase = elapsed * 0.0004 + layer * 1.7;
    const layerAmp = 1 - layer * 0.16;

    ctx.beginPath();
    for (let i = 0; i <= SABER_POINTS; i++) {
      const frac = i / SABER_POINTS;
      const ang = frac * Math.PI * 2;
      const value = sampleFreqAt(frac);
      // organic multi-harmonic wobble so the ring breathes like the reference,
      // riding on top of the actual spectrum displacement
      const wob = Math.sin(ang * 3 + layerPhase) * 0.5
                + Math.sin(ang * 5 - layerPhase * 1.3) * 0.3
                + Math.sin(ang * 8 + layerPhase * 0.6) * 0.2;
      const disp = (value * 0.85 + wob * 0.14) * baseR * 0.55 * layerAmp;
      const r = baseR + disp;
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // saber bloom: wide soft passes underneath, thin bright core on top
    const g = saberGlow;
    ctx.strokeStyle = `hsla(${saberHue}, 100%, 55%, ${0.05 * g})`;
    ctx.lineWidth = 26 * g;
    ctx.stroke();
    ctx.strokeStyle = `hsla(${saberHue}, 100%, 60%, ${0.11 * g})`;
    ctx.lineWidth = 12 * g;
    ctx.stroke();
    ctx.strokeStyle = `hsla(${saberHue}, 100%, 72%, 0.45)`;
    ctx.lineWidth = 3.2;
    ctx.stroke();
    ctx.strokeStyle = `hsla(${saberHue}, 100%, 94%, 0.9)`;   // white-hot core line
    ctx.lineWidth = 1.3;
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- Render loop ----------
let beatFlash = 0;
let beatImpulse = 0;
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

  let selectedEnergy = 0;

  if (analyser) {
    analyser.getByteFrequencyData(freqData);
    selectedEnergy = bandEnergy(bandLow, bandHigh);
  }

  energySmooth += (selectedEnergy - energySmooth) * 0.15;

  const isBeat = analyser ? detectBeat(selectedEnergy) : false;
  if (isBeat) { beatFlash = 1; beatImpulse = 1; }
  beatFlash *= 0.88;
  beatImpulse *= 0.85;

  const now = performance.now();
  if (now - lastMaskUpdate > MASK_UPDATE_INTERVAL) {
    regenerateGapMask();
    lastMaskUpdate = now;
  }

  // ---- Circular spectrum ----
  const circleOX = W * circlePosX, circleOY = H * circlePosY;
  if (circleEnabled) {
    const baseRadius = Math.min(W, H) * 0.16 * (1 + beatFlash * 0.06);
    ctx.save();
    ctx.translate(circleOX, circleOY);

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
    const grad = ctx.createRadialGradient(circleOX, circleOY, 0, circleOX, circleOY, glowR);
    grad.addColorStop(0, `rgba(180, 130, 255, ${0.25 + beatFlash * 0.35})`);
    grad.addColorStop(1, 'rgba(180, 130, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(circleOX, circleOY, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Floating waveform ribbon ----
  if (waveEnabled) drawWaveFlow(now);

  // ---- Neon saber ring ----
  if (saberEnabled) drawSaberRing(now);

  // ---- Particles & blobs: slow start, then build up clearly with the music ----
  const rampProgress = playbackStartTime ? Math.min((now - playbackStartTime) / RAMP_DURATION, 1) : 0;
  const speedMultiplier = 0.05 + 0.95 * rampProgress;
  const energyBoost = (energySmooth * 0.6 + beatFlash * 0.8) * reactivity * rampProgress;
  const impulse = beatImpulse * reactivity * rampProgress;

  if (particlesEnabled) {
    particleOX = W * particlePosX;
    particleOY = H * particlePosY;
    particles.forEach(p => { p.update(energyBoost, speedMultiplier, impulse); p.draw(); });
  }
  if (blobsEnabled) {
    drawBlobs(energyBoost, speedMultiplier, beatFlash, isBeat && rampProgress > 0);
  }
}
