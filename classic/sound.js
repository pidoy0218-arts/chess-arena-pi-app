/*
Professional Sound Module (Web Audio API)
- Pre-loads sounds for low-latency playback.
- Uses stereo panning based on board position.
- Gracefully handles audio context and errors.
- Debug mode shows console logs + floating text overlay.
*/
const SND = (() => {
  let audioCtx;
  let sounds = {};
  let isInitialized = false;
  let loadPromises = [];
  const soundNames = ['move', 'capture', 'check', 'win'];

  const basePath = './assets/sounds/';
  let debug = true; // toggle on/off

  // Floating debug overlay
  let overlay;

  function createOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '20px';
    overlay.style.right = '20px';
    overlay.style.padding = '8px 14px';
    overlay.style.borderRadius = '8px';
    overlay.style.background = 'rgba(0,0,0,0.7)';
    overlay.style.color = '#fff';
    overlay.style.fontFamily = 'monospace';
    overlay.style.fontSize = '14px';
    overlay.style.zIndex = '9999';
    overlay.style.pointerEvents = 'none';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    document.body.appendChild(overlay);
  }

  function showOverlay(text) {
    if (!debug) return;
    createOverlay();
    overlay.textContent = text;
    overlay.style.opacity = '1';
    overlay.style.transform = 'translateY(0)';
    setTimeout(() => {
      overlay.style.opacity = '0';
      overlay.style.transform = 'translateY(-10px)';
    }, 1200);
  }

  function log(...args) {
    if (debug) console.log('[SND]', ...args);
  }

  function init() {
    if (isInitialized) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      isInitialized = true;
      log('AudioContext initialized.');

      loadPromises = soundNames.map(name =>
        loadSound(name, `${basePath}${name}.mp3`)
      );

    } catch (e) {
      console.error('Web Audio API is not supported in this browser.', e);
    }
  }

  async function loadSound(name, url) {
    if (!audioCtx) return;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Could not fetch sound: ${url}. Using silent fallback.`);
        sounds[name] = audioCtx.createBuffer(1, 1, 22050);
        return;
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      sounds[name] = audioBuffer;
      log(`Sound '${name}' loaded successfully.`);
    } catch (e) {
      console.error(`Error loading sound: ${name}`, e);
      sounds[name] = audioCtx.createBuffer(1, 1, 22050);
    }
  }

  async function whenReady() {
    await Promise.all(loadPromises);
  }

  function play(name, { pan = 0, vol = 0.5 } = {}) {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (!audioCtx || !sounds[name] || !sounds[name].duration) {
      log(`Fallback beep for '${name}'`);
      showOverlay(`Beep (fallback)`);
      fallbackBeep();
      return;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = sounds[name];

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);

    const pannerNode = audioCtx.createStereoPanner();
    pannerNode.pan.setValueAtTime(pan, audioCtx.currentTime);

    source.connect(pannerNode).connect(gainNode).connect(audioCtx.destination);
    source.start(0);

    log(`Playing '${name}' | vol=${vol}, pan=${pan.toFixed(2)}`);
    showOverlay(`🔊 ${name.toUpperCase()}`);
  }

  function fallbackBeep() {
    if (!audioCtx) return;
    try {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = 600;
      g.gain.value = 0.03;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      setTimeout(() => o.stop(), 80);
    } catch (e) {}
  }

  // Public API
  return {
    init,
    whenReady,
    debug: (enabled) => { debug = enabled; },
    move: (options) => {
      const pan = (options && options.to ? (options.to.c / 7) * 1.6 - 0.8 : 0);
      play('move', { pan, vol: 0.6 });
    },
    capture: (options) => {
      const pan = (options && options.to ? (options.to.c / 7) * 1.6 - 0.8 : 0);
      play('capture', { pan, vol: 0.7 });
    },
    check: () => play('check', { pan: 0, vol: 0.5 }),
    win: () => play('win', { pan: 0, vol: 0.8 }),
    tick: () => play('move', { pan: 0, vol: 0.3 })
  };
})();

// Initialize sound system on first interaction
['click', 'keydown', 'touchstart'].forEach(evt => {
  document.addEventListener(evt, () => SND.init(), { once: true });
});
