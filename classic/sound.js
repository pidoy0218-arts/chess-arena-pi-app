/*
Professional Sound Module (Web Audio API)
- Pre-loads sounds for low-latency playback.
- Uses stereo panning based on board position.
- Gracefully handles audio context and errors.
*/
const SND = (() => {
  let audioCtx;
  let sounds = {};
  let isInitialized = false;
  const soundNames = ['move', 'capture', 'check', 'win'];

  // Use a root-relative path for sound assets
  const basePath = '/assets/sounds/'; 

  function init() {
    if (isInitialized) return;
    try {
      // Use a single AudioContext
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      isInitialized = true;
      console.log('AudioContext initialized.');

      // Pre-load all sounds
      soundNames.forEach(name => {
        loadSound(name, `${basePath}${name}.mp3`);
      });

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
        sounds[name] = audioCtx.createBuffer(1, 1, 22050); // Silent buffer
        return;
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      sounds[name] = audioBuffer;
      console.log(`Sound '${name}' loaded successfully.`);
    } catch (e) {
      console.error(`Error loading sound: ${name}`, e);
      sounds[name] = audioCtx.createBuffer(1, 1, 22050);
    }
  }

  function play(name, { pan = 0, vol = 0.5 } = {}) {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    if (!audioCtx || !sounds[name] || sounds[name].length === 1) {
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
  }
  
  function fallbackBeep() {
    if(!audioCtx) return;
    try {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.value = 600; g.gain.value = 0.03;
        o.connect(g); g.connect(audioCtx.destination); o.start();
        setTimeout(() => o.stop(), 80);
    } catch(e) {}
  }
  
  // Public API
  return {
    init,
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

// Initialize the sound system on the first user click.
document.addEventListener('click', () => SND.init(), { once: true });
