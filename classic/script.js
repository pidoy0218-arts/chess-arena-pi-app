// classic/script.js
// Requires chess.js (CDN) loaded before this script.
// Place this file in the same folder as classic.html

const BOARD_EL = document.getElementById('board');
const statusEl = document.getElementById('status');
const movesEl = document.getElementById('moveHistory');
const whiteTimerEl = document.getElementById('whiteTimer');
const blackTimerEl = document.getElementById('blackTimer');
const whiteNameEl = document.getElementById('whiteName');
const blackNameEl = document.getElementById('blackName');
const playerWhiteInput = document.getElementById('playerWhite');
const playerBlackInput = document.getElementById('playerBlack');
const btnBack = document.getElementById('btnBack');
const btnDraw = document.getElementById('btnDraw');
const btnResign = document.getElementById('btnResign');
const btnRematch = document.getElementById('btnRematch');

const confettiCanvas = document.getElementById('confetti');
const ctxC = confettiCanvas.getContext('2d');

let game = new Chess(); // chess.js instance
let selectedSquare = null;
let highlightSquares = [];

let perSideSeconds = 15 * 60; // classic default (15 minutes)
let whiteSeconds = perSideSeconds;
let blackSeconds = perSideSeconds;
let timerInterval = null;
let activeColor = 'w'; // 'w' or 'b'
let running = false;
let movesLog = [];

function resizeCanvas(){
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// board render
function renderBoard(){
  BOARD_EL.innerHTML = '';
  const board = game.board();
  for(let r=0; r<8; r++){
    for(let c=0; c<8; c++){
      const square = document.createElement('div');
      square.className = 'square ' + ((r+c)%2 ? 'dark' : 'light');
      square.dataset.r = r; square.dataset.c = c;
      const piece = board[r][c];
      if(piece){
        const glyph = pieceUnicode(piece);
        square.textContent = glyph;
      }
      if(selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c) square.classList.add('selected');
      if(isHighlighted(r,c)) square.classList.add('highlight');
      square.addEventListener('click', ()=> onSquareClick(r,c));
      BOARD_EL.appendChild(square);
    }
  }
  updateStatus();
  drawMoves();
}

// convert chess.js piece to unicode
function pieceUnicode(piece){
  const map = { p:'♟', r:'♜', n:'♞', b:'♝', q:'♛', k:'♚' };
  const u = map[piece.type];
  return piece.color === 'w' ? u.toUpperCase() : u;
}

// click handling
function onSquareClick(r,c){
  if(game.game_over()) return;
  const squareAlg = rcToAlg(r,c);
  const piece = game.get(squareAlg);
  if(!selectedSquare){
    if(!piece) return;
    if(piece.color !== activeColor) return;
    selectedSquare = [r,c];
    highlightSquares = getLegalMovesFrom(squareAlg);
    renderBoard();
    return;
  } else {
    const from = rcToAlg(selectedSquare[0], selectedSquare[1]);
    const to = squareAlg;
    // handle promotion: auto to queen when pawn reaches last rank
    const moves = game.moves({square: from, verbose:true});
    const candidate = moves.find(m => m.to === to);
    if(candidate){
      let moveObj = { from, to };
      if(candidate.flags.indexOf('p') !== -1 && (to[1] === '8' || to[1] === '1')){
        moveObj.promotion = 'q';
      }
      const res = game.move(moveObj);
      if(res){
        // move success
        movesLog.unshift(res.san);
        playTap();
        switchTurnAfterMove();
      }
    }
    selectedSquare = null;
    highlightSquares = [];
    renderBoard();
  }
}

function getLegalMovesFrom(square){
  return game.moves({square, verbose:false}).map(m => m.to).map(algToRC);
}
function isHighlighted(r,c){
  return highlightSquares.some(([rr,cc]) => rr===r && cc===c);
}
function rcToAlg(r,c){ return 'abcdefgh'[c] + (8 - r); }
function algToRC(al){ return [8 - parseInt(al[1]), al.charCodeAt(0) - 97]; }

// turn switching & timer
function switchTurnAfterMove(){
  activeColor = game.turn();
  resetPerMoveTimerIfNeeded();
  if(!timerInterval) startTimers();
  checkEndConditions();
}

function updateStatus(){
  // show currently active color minimal
  statusEl.textContent = '';
  // update timers display
  whiteTimerEl.textContent = formatTime(whiteSeconds);
  blackTimerEl.textContent = formatTime(blackSeconds);
  // player names
  whiteNameEl.textContent = playerWhiteInput.value.trim() || 'White';
  blackNameEl.textContent = playerBlackInput.value.trim() || 'Black';
}

function formatTime(sec){
  const m = Math.floor(sec/60), s = sec%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// timers
function startTimers(){
  if(timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(()=> {
    if(game.game_over()){ clearInterval(timerInterval); return; }
    if(activeColor === 'w') whiteSeconds--; else blackSeconds--;
    updateStatus();
    if(activeColor === 'w' && whiteSeconds <= 10) highlightCountdown(whiteTimerEl,whiteSeconds);
    if(activeColor === 'b' && blackSeconds <= 10) highlightCountdown(blackTimerEl,blackSeconds);
    if(whiteSeconds <= 0 || blackSeconds <= 0){
      // timeout -> other player wins
      clearInterval(timerInterval);
      const winner = whiteSeconds <= 0 ? 'Black' : 'White';
      onGameEnd(`${winner} wins — timeout`);
    }
  }, 1000);
}

function resetPerMoveTimerIfNeeded(){
  // Classic mode uses accumulated clock; nothing to reset here.
}

function highlightCountdown(el, secs){
  if(secs <= 10) el.classList.add('countdown'); else el.classList.remove('countdown');
}

// moves list
function drawMoves(){
  movesEl.innerHTML = movesLog.slice(0,20).map((m,i) => `<div>${i+1}. ${m}</div>`).join('');
}

// end game
function checkEndConditions(){
  if(game.in_checkmate()){
    const winner = game.turn() === 'w' ? 'Black' : 'White';
    onGameEnd(`${winner} wins — checkmate`);
  } else if(game.in_stalemate()){
    onGameEnd('Draw — stalemate');
  } else if(game.in_threefold_repetition()){
    onGameEnd('Draw — threefold repetition');
  } else if(game.insufficient_material()){
    onGameEnd('Draw — insufficient material');
  } else if(game.in_draw()){
    onGameEnd('Draw');
  }
}

function onGameEnd(message){
  statusEl.textContent = message;
  playVictory();
  confettiBurst();
  // show rematch prompt after 5s
  setTimeout(()=> {
    const again = confirm(message + '\n\nRematch?');
    if(again){
      rematch();
    } else {
      window.location.href = '../menu.html'; // adjust to your menu path
    }
  }, 1500);
}

// rematch/reset
function rematch(){
  game = new Chess();
  selectedSquare = null;
  highlightSquares = [];
  movesLog = [];
  whiteSeconds = perSideSeconds; blackSeconds = perSideSeconds;
  activeColor = 'w';
  renderBoard();
  startTimers();
}

// user actions
btnBack.addEventListener('click', ()=> window.location.href = '../menu.html');
btnDraw.addEventListener('click', ()=> {
  const ok = confirm('Offer draw to opponent? (auto-accept in this demo)');
  if(ok) onGameEnd('Draw — agreed');
});
btnResign.addEventListener('click', ()=> {
  const ok = confirm('Resign?');
  if(ok) onGameEnd((activeColor === 'w' ? 'Black' : 'White') + ' wins — resignation');
});
btnRematch.addEventListener('click', rematch);

// simple sounds
function playTap(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.value = 0.06;
    o.connect(g); g.connect(ctx.destination);
    o.start(); setTimeout(()=>{ o.stop(); }, 80);
  }catch(e){}
}
function playVictory(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
    notes.forEach((freq, i)=>{
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = freq; o.type='triangle';
      o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i*0.14;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12, t+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t+0.6);
      o.start(t); o.stop(t+0.7);
    });
  }catch(e){}
}

// confetti (lightweight)
function confettiBurst(){
  const W = confettiCanvas.width, H = confettiCanvas.height;
  const pieces = Array.from({length:80}).map(()=>({
    x: Math.random()*W, y:-20, vx:(Math.random()-0.5)*6, vy: Math.random()*3+2, r:Math.random()*6+4, c: randomColor()
  }));
  let t=0;
  function frame(){
    ctxC.clearRect(0,0,W,H);
    pieces.forEach(p=>{
      p.x += p.vx; p.y += p.vy; p.vy += 0.08;
      ctxC.fillStyle = p.c; ctxC.fillRect(p.x,p.y,p.r,p.r*0.6);
    });
    t++;
    if(t<160) requestAnimationFrame(frame); else ctxC.clearRect(0,0,W,H);
  }
  frame();
}
function randomColor(){
  const palette = ['#f44336','#ffeb3b','#8bc34a','#03a9f4','#9c27b0','#ff9800'];
  return palette[Math.floor(Math.random()*palette.length)];
}

// initialize UI & start
function init(){
  // read player names if any
  playerWhiteInput.addEventListener('input', ()=> whiteNameEl.textContent = playerWhiteInput.value || 'White');
  playerBlackInput.addEventListener('input', ()=> blackNameEl.textContent = playerBlackInput.value || 'Black');

  // initial render
  renderBoard();
  // start timer loop
  startTimers();
}

init();
