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
bindSlider('barHeight', 'barHeightVal', v => v.toFixed(1) + 'x', v => { barHeightScale = v; });
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
document.getElementById('mirrorToggle').addEventListener('change', (e) => { mirrorEnabled = e.target.checked; });

// ---------- Initial language render (English default) ----------
applyStaticTranslations();
renderDemoBtnText();
renderPlayBtnText();
renderTrackName();

draw();
