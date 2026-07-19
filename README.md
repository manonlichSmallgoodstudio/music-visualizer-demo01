# Music Reactive Visualizer

A single-file (`index.html`) music-reactive visualizer built with vanilla JS,
Canvas 2D, and the Web Audio API. No build step, no dependencies — just open
`index.html` in a browser, or deploy via GitHub Pages.

## Features

- **Sound sources**
  - Upload any local music file
  - Built-in synthesized demo track (drum machine + bass + chords) that
    cycles through slow → fast → breakdown sections
  - Live input from a selected sound device (microphone / Stereo Mix /
    virtual audio cable) — requires HTTPS or `localhost`

- **Visual presets** (each toggleable independently in Settings)
  - Circular spectrum ring (mirror/symmetry, bar height, and "gap" density
    all adjustable)
  - Center-burst particles (slow ramp-up on playback start, count, color,
    beat reactivity adjustable)
  - Floating waveform ribbon (layered glowing wave, height adjustable)
  - Glowing floating blobs (count, min/max size, color range, bounce +
    pulse on beat)

- **Background**
  - Upload a custom image or video as the backdrop (auto "cover" fit,
    adjustable dim overlay)

- **UI**
  - Settings gear (top-right) opens/closes a panel with all the sliders/
    toggles above
  - `H` — hide/show all UI chrome (for clean fullscreen playback)
  - `F` — toggle browser fullscreen
  - Language switcher: English (default) / Thai, all UI strings driven by
    a `translations` dictionary in the script

## Project structure

```
index.html   — everything: markup, styles, and script (self-contained)
```

Currently the whole app lives in one file for simplicity. If it keeps
growing, natural next steps are to split out:
- `style.css`
- `i18n.js` (the `translations` dictionary + `t()`/`applyStaticTranslations()`)
- `audio.js` (analyser setup, demo track scheduler, mic/device handling)
- `visuals.js` (Particle/Blob classes, spectrum + waveform drawing, render loop)

## Running locally

Just open `index.html` in a browser. For mic/device selection to work you
need HTTPS or `localhost` — an easy local server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying to GitHub Pages

1. Push this repo to GitHub
2. Repo Settings → Pages → Source: "Deploy from a branch", branch `main`,
   folder `/ (root)`
3. Site will be live at `https://<username>.github.io/<repo>/`

`index.html` is already the correct filename for Pages to serve
automatically as the homepage.

## Known constraints / ideas for follow-up

- Mic/device selection requires user permission each session (browser
  security requirement, can't be bypassed)
- Language preference isn't persisted yet (resets to English on reload) —
  could store in `localStorage`
- No build tooling — intentional for now, but would be needed if this
  grows into a multi-file app
