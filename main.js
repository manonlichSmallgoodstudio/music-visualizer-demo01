// ---------- Keyboard shortcuts: H = hide/show UI, F = fullscreen ----------
window.addEventListener('keydown', (e) => {
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' && document.activeElement.type !== 'range' && document.activeElement.type !== 'checkbox') return;

  if (e.key.toLowerCase() === 'h') {
    document.body.classList.toggle('ui-hidden');
  } else if (e.key.toLowerCase() === 'f') {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }
});

// ---------- Settings panel ----------
const settingsToggleBtn = document.getElementById('settingsToggleBtn');
const settingsPanel = document.getElementById('settingsPanel');
settingsToggleBtn.addEventListener('click', () => {
  settingsPanel.classList.toggle('collapsed');
});

// ---------- Preset visibility toggles ----------
document.getElementById('toggleCircle').addEventListener('change', e => circleEnabled = e.target.checked);
document.getElementById('toggleParticles').addEventListener('change', e => particlesEnabled = e.target.checked);
document.getElementById('toggleWave').addEventListener('change', e => waveEnabled = e.target.checked);
document.getElementById('toggleBlobs').addEventListener('change', e => blobsEnabled = e.target.checked);
document.getElementById('toggleSaber').addEventListener('change', e => saberEnabled = e.target.checked);

function bindSlider(id, valId, formatter, onChange) {
  const el = document.getElementById(id);
  const valEl = document.getElementById(valId);
  el.addEventListener('input', () => {
    const v = parseFloat(el.value);
    valEl.textContent = formatter(v);
    onChange(v);
  });
}

bindSlider('particleCount', 'particleCountVal', v => Math.round(v), v => setParticleCount(Math.round(v)));
bindSlider('hueStart', 'hueStartVal', v => Math.round(v) + '°', v => { hueStart = v; recolorParticles(); });
bindSlider('hueRange', 'hueRangeVal', v => Math.round(v) + '°', v => { hueRange = v; recolorParticles(); });
bindSlider('reactivity', 'reactivityVal', v => v.toFixed(1) + 'x', v => { reactivity = v; });
bindSlider('particleSpread', 'particleSpreadVal', v => v.toFixed(1) + 'x', v => { particleSpread = v; });
bindSlider('particlePosX', 'particlePosXVal', v => Math.round(v) + '%', v => { particlePosX = v / 100; });
bindSlider('particlePosY', 'particlePosYVal', v => Math.round(v) + '%', v => { particlePosY = v / 100; });
bindSlider('barHeight', 'barHeightVal', v => v.toFixed(1) + 'x', v => { barHeightScale = v; });
bindSlider('circlePosX', 'circlePosXVal', v => Math.round(v) + '%', v => { circlePosX = v / 100; });
bindSlider('circlePosY', 'circlePosYVal', v => Math.round(v) + '%', v => { circlePosY = v / 100; });
bindSlider('gapDensity', 'gapVal', v => Math.round(v) + '%', v => { gapDensity = v / 100; });
bindSlider('waveHeight', 'waveHeightVal', v => v.toFixed(1) + 'x', v => { waveHeightScale = v; });
bindSlider('bgDim', 'bgDimVal', v => Math.round(v) + '%', v => { bgDim = v / 100; });

const bgFileInput = document.getElementById('bgFileInput');
const bgRemoveBtn = document.getElementById('bgRemoveBtn');

bgFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  clearBackground();
  const url = URL.createObjectURL(file);
  bgObjectUrl = url;

  if (file.type.startsWith('video/')) {
    const vid = document.createElement('video');
    vid.src = url;
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.autoplay = true;
    vid.addEventListener('loadeddata', () => {
      bgMedia = vid;
      bgMediaType = 'video';
      bgRemoveBtn.disabled = false;
    });
    vid.play().catch(() => {});
  } else if (file.type.startsWith('image/')) {
    const img = new Image();
    img.onload = () => {
      bgMedia = img;
      bgMediaType = 'image';
      bgRemoveBtn.disabled = false;
    };
    img.src = url;
  } else {
    alert(t('alertUnsupportedFile'));
  }
});
bgRemoveBtn.addEventListener('click', () => {
  clearBackground();
  bgRemoveBtn.disabled = true;
  bgFileInput.value = '';
});

bindSlider('blobCount', 'blobCountVal', v => Math.round(v), v => setBlobCount(Math.round(v)));
bindSlider('blobMinSize', 'blobMinSizeVal', v => Math.round(v) + 'px', v => { blobMinSize = Math.min(v, blobMaxSize); resizeBlobs(); });
bindSlider('blobMaxSize', 'blobMaxSizeVal', v => Math.round(v) + 'px', v => { blobMaxSize = Math.max(v, blobMinSize); resizeBlobs(); });
bindSlider('blobHueStart', 'blobHueStartVal', v => Math.round(v) + '°', v => { blobHueStart = v; recolorBlobs(); });
bindSlider('blobHueRange', 'blobHueRangeVal', v => Math.round(v) + '°', v => { blobHueRange = v; recolorBlobs(); });
bindSlider('blobGlow', 'blobGlowVal', v => v.toFixed(1) + 'x', v => { blobGlow = v; });
document.getElementById('mirrorToggle').addEventListener('change', (e) => { mirrorEnabled = e.target.checked; });

// ---------- Neon saber ring controls ----------
bindSlider('saberHue', 'saberHueVal', v => Math.round(v) + '°', v => { saberHue = v; });
bindSlider('saberGlow', 'saberGlowVal', v => v.toFixed(1) + 'x', v => { saberGlow = v; });
bindSlider('saberRadius', 'saberRadiusVal', v => Math.round(v) + '%', v => { saberRadius = v / 100; });
bindSlider('saberPosX', 'saberPosXVal', v => Math.round(v) + '%', v => { saberPosX = v / 100; });
bindSlider('saberPosY', 'saberPosYVal', v => Math.round(v) + '%', v => { saberPosY = v / 100; });

// ---------- Beat reaction: frequency-band source + custom range + sensitivity ----------
const bandSourceSel = document.getElementById('bandSource');
const bandLowRow = document.getElementById('bandLowRow');
const bandHighRow = document.getElementById('bandHighRow');
const bandLowSlider = document.getElementById('bandLow');
const bandHighSlider = document.getElementById('bandHigh');

function applyBandFromSlidersOrPreset() {
  if (bandSource === 'custom') {
    // keep low < high so the band is always valid
    let lo = parseInt(bandLowSlider.value, 10);
    let hi = parseInt(bandHighSlider.value, 10);
    if (lo >= hi) { lo = Math.min(lo, hi - 1); bandLowSlider.value = lo; }
    bandLow = lo / 100;
    bandHigh = hi / 100;
  } else {
    const preset = BAND_PRESETS[bandSource] || BAND_PRESETS.bass;
    bandLow = preset[0];
    bandHigh = preset[1];
  }
  bandHistory = [];   // forget old averages so the new band re-baselines cleanly
}

bandSourceSel.addEventListener('change', () => {
  bandSource = bandSourceSel.value;
  const custom = bandSource === 'custom';
  bandLowRow.style.display = custom ? '' : 'none';
  bandHighRow.style.display = custom ? '' : 'none';
  applyBandFromSlidersOrPreset();
});

bindSlider('bandLow', 'bandLowVal', v => Math.round(v) + '%', () => applyBandFromSlidersOrPreset());
bindSlider('bandHigh', 'bandHighVal', v => Math.round(v) + '%', () => applyBandFromSlidersOrPreset());
bindSlider('beatSens', 'beatSensVal', v => v.toFixed(2), v => { beatSensitivity = v; });

// ---------- Initial language render (English default) ----------
applyStaticTranslations();
renderDemoBtnText();
renderPlayBtnText();
renderTrackName();

draw();
