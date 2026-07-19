// ---------- Audio setup ----------
const fileInput = document.getElementById('fileInput');
const playBtn = document.getElementById('playBtn');
playBtnRef = playBtn;
const trackName = document.getElementById('trackName');
trackNameRef = trackName;

let audioCtx, analyser, source, audioEl;
let freqData, timeData;
const FFT_SIZE = 512;

// playback "ramp" so particles/blobs start slow and build up over the first few seconds
let playbackStartTime = null;
function markPlaybackStart() { playbackStartTime = performance.now(); }
function markPlaybackStop() { playbackStartTime = null; }

// ---------- Sound device (mic / system input) selection ----------
let micStream = null, micSource = null;
const deviceSelect = document.getElementById('deviceSelect');
deviceSelectRef = deviceSelect;
const micPermBtn = document.getElementById('micPermBtn');

function stopMic() {
  if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
  if (micSource) { micSource.disconnect(); micSource = null; }
}

async function refreshDeviceList(selectDeviceId) {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(d => d.kind === 'audioinput');
    deviceSelect.innerHTML = '';
    if (audioInputs.length === 0) {
      deviceSelect.innerHTML = `<option value="">${t('deviceNoneFound')}</option>`;
      return;
    }
    micPermissionGranted = true;
    audioInputs.forEach((d, i) => {
      const opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || `${t('deviceFallbackLabel')} ${i + 1}`;
      deviceSelect.appendChild(opt);
    });
    if (selectDeviceId) deviceSelect.value = selectDeviceId;
  } catch (err) {
    console.error('refreshDeviceList error', err);
  }
}

async function connectDevice(deviceId) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert(t('alertNoMediaDevices'));
    return;
  }
  try {
    ensureAudioCtx();
    stopDemo();
    if (audioEl && !audioEl.paused) { audioEl.pause(); renderPlayBtnText(); }
    stopMic();
    const constraints = deviceId ? { audio: { deviceId: { exact: deviceId } } } : { audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    micStream = stream;
    micSource = audioCtx.createMediaStreamSource(stream);
    micSource.connect(analyser);
    trackState = { type: 'live', name: '' };
    renderTrackName();
    markPlaybackStart();
    await refreshDeviceList(deviceId);
  } catch (err) {
    alert(t('alertMicError') + err.message);
  }
}

micPermBtn.addEventListener('click', () => connectDevice(deviceSelect.value || undefined));
deviceSelect.addEventListener('change', () => connectDevice(deviceSelect.value));
if (navigator.mediaDevices) {
  navigator.mediaDevices.addEventListener?.('devicechange', () => refreshDeviceList());
}

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  trackState = { type: 'file', name: file.name };
  renderTrackName();
  const url = URL.createObjectURL(file);

  if (!audioEl) {
    audioEl = new Audio();
    audioElRef = audioEl;
    audioEl.crossOrigin = 'anonymous';
    audioEl.addEventListener('play', markPlaybackStart);
    audioEl.addEventListener('pause', markPlaybackStop);
    audioEl.addEventListener('ended', markPlaybackStop);
  }
  audioEl.src = url;
  playBtn.disabled = false;
  renderPlayBtnText();

  ensureAudioCtx();
  if (!source) {
    source = audioCtx.createMediaElementSource(audioEl);
    source.connect(analyser);
  }
});

playBtn.addEventListener('click', async () => {
  if (!audioEl) return;
  stopDemo();
  stopMic();
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  if (audioEl.paused) {
    audioEl.play();
  } else {
    audioEl.pause();
  }
  renderPlayBtnText();
});

// ---------- Synthesized demo track (no external audio file needed) ----------
const demoBtn = document.getElementById('demoBtn');
demoBtnRef = demoBtn;
let demoPlaying = false;
let demoMasterGain, demoTimerID, demoNextStepTime;

// Three alternating sections: slow -> fast -> breakdown (quiet/medium) -> repeat
const SECTIONS = [
  {
    name: 'slow', bpm: 72, bars: 4, volume: 0.85,
    kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hat:   [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    bass:  [0,null,null,null, 3,null,null,null, -2,null,null,null, 1,null,null,null],
    chordSteps: [0, 8],
  },
  {
    name: 'fast', bpm: 160, bars: 4, volume: 1.0,
    kick:  [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
    hat:   [0,1,1,1, 0,1,1,1, 0,1,1,1, 0,1,1,1],
    bass:  [0,null,0,null, 3,null,3,null, -2,null,-2,null, 1,null,1,null],
    chordSteps: [0, 4, 8, 12],
  },
  {
    name: 'breakdown', bpm: 100, bars: 4, volume: 0.45,
    kick:  [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    hat:   [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
    bass:  [0,null,null,null, null,null,null,null, -2,null,null,null, null,null,null,null],
    chordSteps: [0],
  },
];
const CHORD_NOTES = [0, 3, 7];
const LOOKAHEAD = 0.1; // seconds to schedule ahead

function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (!analyser) {
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.8;
    freqData = new Uint8Array(analyser.frequencyBinCount);
    timeData = new Uint8Array(analyser.fftSize);
    analyser.connect(audioCtx.destination);
  }
}

function freqFromSemitone(base, semitone) {
  return base * Math.pow(2, semitone / 12);
}

function scheduleKick(time, vol) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
  gain.gain.setValueAtTime(0.9 * vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
  osc.connect(gain).connect(demoMasterGain);
  osc.start(time);
  osc.stop(time + 0.25);
}

function scheduleHat(time, vol) {
  const bufferSize = audioCtx.sampleRate * 0.05;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 7000;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.25 * vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  noise.connect(filter).connect(gain).connect(demoMasterGain);
  noise.start(time);
  noise.stop(time + 0.06);
}

function scheduleSnare(time, vol) {
  const bufferSize = audioCtx.sampleRate * 0.15;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.5 * vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  noise.connect(filter).connect(gain).connect(demoMasterGain);
  noise.start(time);
  noise.stop(time + 0.16);
}

function scheduleBass(time, semitone, sixteenth, vol) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freqFromSemitone(110, semitone), time);
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.5 * vol, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, time + sixteenth * 1.8);
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 500;
  osc.connect(filter).connect(gain).connect(demoMasterGain);
  osc.start(time);
  osc.stop(time + sixteenth * 2);
}

function scheduleChord(time, sixteenth, vol) {
  CHORD_NOTES.forEach(n => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freqFromSemitone(220, n), time);
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.18 * vol, time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, time + sixteenth * 6);
    osc.connect(gain).connect(demoMasterGain);
    osc.start(time);
    osc.stop(time + sixteenth * 6.2);
  });
}

let demoSectionIdx = 0;
let demoBarInSection = 0;
let demoStepInBar = 0;

function currentSection() { return SECTIONS[demoSectionIdx]; }

function advanceStep() {
  demoStepInBar++;
  if (demoStepInBar >= 16) {
    demoStepInBar = 0;
    demoBarInSection++;
    if (demoBarInSection >= currentSection().bars) {
      demoBarInSection = 0;
      demoSectionIdx = (demoSectionIdx + 1) % SECTIONS.length;
    }
  }
}

function demoScheduler() {
  while (demoNextStepTime < audioCtx.currentTime + LOOKAHEAD) {
    const section = currentSection();
    const sixteenth = 60 / section.bpm / 4;
    const step = demoStepInBar;
    const vol = section.volume;

    if (section.kick[step]) scheduleKick(demoNextStepTime, vol);
    if (section.snare[step]) scheduleSnare(demoNextStepTime, vol);
    if (section.hat[step]) scheduleHat(demoNextStepTime, vol);
    if (section.bass[step] !== null) scheduleBass(demoNextStepTime, section.bass[step], sixteenth, vol);
    if (section.chordSteps.includes(step)) scheduleChord(demoNextStepTime, sixteenth, vol);

    demoNextStepTime += sixteenth;
    advanceStep();
  }
  demoTimerID = setTimeout(demoScheduler, 25);
}

async function startDemo() {
  ensureAudioCtx();
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  if (audioEl && !audioEl.paused) { audioEl.pause(); renderPlayBtnText(); }
  stopMic();

  demoMasterGain = audioCtx.createGain();
  demoMasterGain.gain.value = 0.9;
  demoMasterGain.connect(analyser);

  demoSectionIdx = 0;
  demoBarInSection = 0;
  demoStepInBar = 0;
  demoNextStepTime = audioCtx.currentTime + 0.05;
  demoPlaying = true;
  renderDemoBtnText();
  trackState = { type: 'demo', name: '' };
  renderTrackName();
  markPlaybackStart();
  demoScheduler();
}

function stopDemo() {
  if (!demoPlaying) return;
  demoPlaying = false;
  clearTimeout(demoTimerID);
  if (demoMasterGain) demoMasterGain.disconnect();
  renderDemoBtnText();
  markPlaybackStop();
}

demoBtn.addEventListener('click', () => {
  if (demoPlaying) stopDemo();
  else startDemo();
});
