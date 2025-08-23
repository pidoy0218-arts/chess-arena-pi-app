// Small, no-framework sound helpers
const MOVE_SFX = "https://assets.mixkit.co/sfx/download/mixkit-hard-typewriter-click-1119.wav";
const WIN_SFX  = "https://assets.mixkit.co/sfx/download/mixkit-winning-chimes-2015.wav";

window.playMoveSound = () => new Audio(MOVE_SFX).play().catch(()=>{});
window.playWinSound  = () => new Audio(WIN_SFX).play().catch(()=>{});
