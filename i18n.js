// ---------- i18n ----------
// All user-facing strings live here, keyed by language then by string key.
// t(key) looks up the current language, falling back to English, then the
// raw key itself so a missing translation never crashes the UI.
const translations = {
  en: {
    settingsTooltip: "Settings",
    langHeading: "Language",
    dispHeading: "Show Graphics",
    circleLabel: "Circular spectrum",
    particlesToggleLabel: "Center particles",
    waveToggleLabel: "Floating waveform ribbon",
    blobsToggleLabel: "Glowing floating blobs",
    saberToggleLabel: "Neon saber ring",
    bgHeading: "Background",
    uploadBgLabel: "🖼️🎬 Upload background image/video",
    removeBgLabel: "Remove background (back to black)",
    bgDimLabel: "Background dim",
    particlesHeading: "Particles",
    particleCountLabel: "Particle count",
    hueStartLabel: "Start color (Hue)",
    hueRangeLabel: "Hue range",
    reactivityLabel: "Beat reactivity",
    spreadLabel: "Particle spread",
    particlePosXLabel: "Origin X",
    particlePosYLabel: "Origin Y",
    reactHeading: "Beat Reaction",
    bandSourceLabel: "React to frequency band",
    bandBass: "Bass (kick / sub)",
    bandMid: "Mids (snare / body)",
    bandTreble: "Treble (hats / air)",
    bandFull: "Full spectrum",
    bandCustom: "Custom range…",
    bandLowLabel: "Range low",
    bandHighLabel: "Range high",
    beatSensLabel: "Beat sensitivity",
    circleHeading: "Circular Spectrum",
    barHeightLabel: "Bar height",
    mirrorLabel: "Mirror left/right (symmetry)",
    gapLabel: "Gaps (some bars stay low)",
    circlePosXLabel: "Position X",
    circlePosYLabel: "Position Y",
    waveHeading: "Floating Waveform",
    waveHeightLabel: "Wave height",
    saberHeading: "Neon Saber Ring",
    saberHueLabel: "Color (Hue)",
    saberGlowLabel: "Glow",
    saberRadiusLabel: "Radius",
    saberPosXLabel: "Position X",
    saberPosYLabel: "Position Y",
    soundSourceHeading: "Sound Source",
    deviceSelectLabel: "Select sound device (mic / sound device)",
    deviceDefaultOption: "-- Press the button below to request access --",
    micPermBtnLabel: "🎤 Grant permission / refresh device list",
    deviceHintText: 'Choose "Stereo Mix" or a virtual audio cable to capture audio playing on this device, or pick a microphone for ambient sound (requires HTTPS or localhost).',
    blobsHeading: "Glowing Floating Blobs",
    blobCountLabel: "Blob count",
    blobMinSizeLabel: "Min size",
    blobMaxSizeLabel: "Max size",
    blobHueStartLabel: "Start color (Hue)",
    blobHueRangeLabel: "Hue range",
    blobGlowLabel: "Glow",
    chooseMusicLabel: "Choose music",
    trackNoneText: "No file chosen",
    trackDemoText: "Demo track (slow/fast/breakdown)",
    trackLiveText: "Sound device (live)",
    demoBtnPlay: "▶ Play demo track",
    demoBtnStop: "⏸ Stop demo track",
    playBtnPlay: "▶ Play",
    playBtnPause: "⏸ Pause",
    hintHTML: 'Choose a music file, or click "Play demo track" &nbsp;·&nbsp; <kbd>H</kbd> hide/show UI &nbsp;·&nbsp; <kbd>F</kbd> fullscreen',
    deviceNoneFound: "No audio devices found",
    deviceFallbackLabel: "Audio device",
    alertNoMediaDevices: "This browser doesn't support sound device selection, or this page isn't served over HTTPS/localhost.",
    alertMicError: "Couldn't access the sound device: ",
    alertUnsupportedFile: "Only image or video files are supported",
  },
  th: {
    settingsTooltip: "ตั้งค่า",
    langHeading: "ภาษา",
    dispHeading: "แสดงกราฟิก",
    circleLabel: "วงกลมสเปกตรัม",
    particlesToggleLabel: "Particle จากศูนย์กลาง",
    waveToggleLabel: "คลื่นลอย (waveform ribbon)",
    blobsToggleLabel: "ก้อนลอยเรืองแสง",
    saberToggleLabel: "วงแหวนนีออน (saber)",
    bgHeading: "พื้นหลัง",
    uploadBgLabel: "🖼️🎬 อัปโหลดรูป/วิดีโอพื้นหลัง",
    removeBgLabel: "ลบพื้นหลัง (กลับเป็นสีดำ)",
    bgDimLabel: "ความมืดพื้นหลัง",
    particlesHeading: "Particles",
    particleCountLabel: "จำนวน particle",
    hueStartLabel: "สีเริ่มต้น (Hue)",
    hueRangeLabel: "ช่วงสี (Hue range)",
    reactivityLabel: "ความไวต่อจังหวะ",
    spreadLabel: "ระยะกระจาย particle",
    particlePosXLabel: "จุดกำเนิด X",
    particlePosYLabel: "จุดกำเนิด Y",
    reactHeading: "การตอบสนองจังหวะ",
    bandSourceLabel: "ตอบสนองย่านความถี่",
    bandBass: "เบส (kick / sub)",
    bandMid: "กลาง (snare / เนื้อเสียง)",
    bandTreble: "แหลม (hi-hat / เสียงสูง)",
    bandFull: "ทั้งสเปกตรัม",
    bandCustom: "กำหนดช่วงเอง…",
    bandLowLabel: "ช่วงต่ำสุด",
    bandHighLabel: "ช่วงสูงสุด",
    beatSensLabel: "ความไวจับจังหวะ",
    circleHeading: "วงกลมสเปกตรัม",
    barHeightLabel: "ความสูงเส้น",
    mirrorLabel: "Mirror ซ้าย/ขวา (symmetry)",
    gapLabel: "ช่องว่าง (บางเส้นไม่ขึ้น)",
    circlePosXLabel: "ตำแหน่ง X",
    circlePosYLabel: "ตำแหน่ง Y",
    waveHeading: "คลื่นลอย",
    waveHeightLabel: "ความสูงคลื่น",
    saberHeading: "วงแหวนนีออน (saber)",
    saberHueLabel: "สี (Hue)",
    saberGlowLabel: "ความเรืองแสง",
    saberRadiusLabel: "รัศมี",
    saberPosXLabel: "ตำแหน่ง X",
    saberPosYLabel: "ตำแหน่ง Y",
    soundSourceHeading: "แหล่งเสียง",
    deviceSelectLabel: "เลือกอุปกรณ์เสียง (ไมค์ / sound device)",
    deviceDefaultOption: "-- กดปุ่มด้านล่างเพื่อขอสิทธิ์เข้าถึง --",
    micPermBtnLabel: "🎤 เปิดสิทธิ์ / รีเฟรชรายการอุปกรณ์",
    deviceHintText: 'เลือก "Stereo Mix" หรือ virtual audio cable เพื่อจับเสียงที่กำลังเล่นจากเครื่อง หรือเลือกไมค์เพื่อจับเสียงรอบข้าง (ต้องเปิดผ่าน HTTPS หรือ localhost)',
    blobsHeading: "ก้อนลอยเรืองแสง",
    blobCountLabel: "จำนวนก้อน",
    blobMinSizeLabel: "ขนาดเล็กสุด",
    blobMaxSizeLabel: "ขนาดใหญ่สุด",
    blobHueStartLabel: "สีเริ่มต้น (Hue)",
    blobHueRangeLabel: "ช่วงสี (Hue range)",
    blobGlowLabel: "ความเรืองแสง",
    chooseMusicLabel: "เลือกเพลง",
    trackNoneText: "ยังไม่ได้เลือกไฟล์",
    trackDemoText: "เพลงตัวอย่าง (ช้า/เร็ว/เบรกดาวน์)",
    trackLiveText: "อุปกรณ์เสียง (live)",
    demoBtnPlay: "▶ เล่นเพลงตัวอย่าง",
    demoBtnStop: "⏸ หยุดเพลงตัวอย่าง",
    playBtnPlay: "▶ เล่น",
    playBtnPause: "⏸ หยุด",
    hintHTML: 'เลือกไฟล์เพลง หรือกด "เล่นเพลงตัวอย่าง" &nbsp;·&nbsp; <kbd>H</kbd> ซ่อน/แสดง UI &nbsp;·&nbsp; <kbd>F</kbd> เต็มจอ',
    deviceNoneFound: "ไม่พบอุปกรณ์เสียง",
    deviceFallbackLabel: "อุปกรณ์เสียง",
    alertNoMediaDevices: "เบราว์เซอร์นี้ไม่รองรับการเลือกอุปกรณ์เสียง หรือหน้านี้ไม่ได้เปิดผ่าน HTTPS/localhost",
    alertMicError: "ไม่สามารถเข้าถึงอุปกรณ์เสียงได้: ",
    alertUnsupportedFile: "รองรับเฉพาะไฟล์รูปภาพหรือวิดีโอ",
  },
};

let currentLang = 'en';
let micPermissionGranted = false;
function t(key) { return (translations[currentLang] && translations[currentLang][key]) ?? translations.en[key] ?? key; }

// Element refs assigned once by audio.js (once those DOM-driven objects exist),
// but declared here since applyStaticTranslations() / render*() need them.
let deviceSelectRef = null, trackNameRef = null, demoBtnRef = null, playBtnRef = null, audioElRef = null;

function applyStaticTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  document.getElementById('hint').innerHTML = t('hintHTML');
  if (deviceSelectRef && deviceSelectRef.options.length === 1 && deviceSelectRef.options[0].value === '') {
    deviceSelectRef.options[0].textContent = micPermissionGranted ? t('deviceNoneFound') : t('deviceDefaultOption');
  }
}

let trackState = { type: 'none', name: '' };
function renderTrackName() {
  if (!trackNameRef) return;
  if (trackState.type === 'file') trackNameRef.textContent = trackState.name;
  else if (trackState.type === 'demo') trackNameRef.textContent = t('trackDemoText');
  else if (trackState.type === 'live') trackNameRef.textContent = t('trackLiveText');
  else trackNameRef.textContent = t('trackNoneText');
}
function renderDemoBtnText() {
  if (demoBtnRef) demoBtnRef.textContent = demoPlaying ? t('demoBtnStop') : t('demoBtnPlay');
}
function renderPlayBtnText() {
  if (!playBtnRef) return;
  playBtnRef.textContent = (audioElRef && !audioElRef.paused) ? t('playBtnPause') : t('playBtnPlay');
}

const langSelect = document.getElementById('langSelect');
langSelect.addEventListener('change', () => setLanguage(langSelect.value));
function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  langSelect.value = lang;
  applyStaticTranslations();
  renderDemoBtnText();
  renderPlayBtnText();
  renderTrackName();
}
