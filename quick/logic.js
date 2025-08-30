// quick/logic.js
// Quick game: 30s per move. Uses chess.js and chessboard.js (loaded from CDN in quick.html).

let board = null;
let game = new Chess();

const START_PER_MOVE = 30; // seconds
let whiteRemaining = START_PER_MOVE;
let blackRemaining = START_PER_MOVE;
let activeColor = 'w'; // 'w' or 'b' -- whose move to track timer for
let timerInterval = null;
let running = false;

// UI elements
const whiteTimerEl = document.getElementById('whiteTimer');
const blackTimerEl = document.getElementById('blackTimer');
const statusEl = document.getElementById('status');
const movesEl = document.getElementById('moves');
const capturedEl = document.getElementById('captured');

const sndMove = document.getElementById('sndMove');
const sndCapture = document.getElementById('sndCapture');
const sndCheck = document.getElementById('sndCheck');
const sndWin = document.getElementById('sndWin');
const sndLose = document.getElementById('sndLose');

document.getElementById('btnBack').addEventListener('click', ()=> { window.history.back(); });
document.getElementById('btnReset').addEventListener('click', resetGame);

// chessboard config
const cfg = {
  draggable: true,
  position: 'start',
  pieceTheme: 'https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/img/chesspieces/wikipedia/{piece}.png',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
};

board = Chessboard('board', cfg);
updateTimersUI();

// prevent dragging if game over or not player's turn - but for demo we allow both local sides
function onDragStart (source, piece, position, orientation) {
  if (game.game_over()) return false;
  // We allow local dragging both sides for testing; production should restrict by player side.
  // Start timers on first drag
  if (!running) {
    startTimers();
  }
}

function onDrop (source, target) {
  // see if the move is legal
  const move = game.move({ from: source, to: target, promotion: 'q' });
  if (move === null) {
    return 'snapback';
  } else {
    // play sounds
    if (move.captured) playSound(sndCapture); else playSound(sndMove);
    // update UI
    updateMoves();
    // switch active color & reset that player's per-move timer
    activeColor = game.turn(); // now returns next turn color
    resetActiveTimer();
    // check for check / checkmate / gameover
    if (game.in_checkmate()) {
      playSound(sndWin);
      endGame(`${move.color === 'w' ? 'White' : 'Black'} wins by checkmate!`);
    } else if (game.in_stalemate() || game.in_draw() || game.insufficient_material()) {
      playSound(sndMove);
      endGame('Draw / Stalemate / Insufficient material');
    } else if (game.in_check()) {
      playSound(sndCheck);
      statusEl.textContent = 'Check!';
    } else {
      statusEl.textContent = (game.turn() === 'w' ? 'White to move' : 'Black to move');
    }
  }
}

function onSnapEnd () {
  board.position(game.fen());
}

// TIMERS
function startTimers() {
  running = true;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!running) return;
    if (activeColor === 'w') {
      whiteRemaining--;
      if (whiteRemaining <= 0) {
        timeExpired('w');
      }
    } else {
      blackRemaining--;
      if (blackRemaining <= 0) {
        timeExpired('b');
      }
    }
    updateTimersUI();
  }, 1000);
}

function resetActiveTimer(){
  // When it's a player's turn, their per-move timer starts from START_PER_MOVE
  if (activeColor === 'w') whiteRemaining = START_PER_MOVE;
  else blackRemaining = START_PER_MOVE;
  updateTimersUI();
}

function updateTimersUI(){
  whiteTimerEl.textContent = `${whiteRemaining}s`;
  blackTimerEl.textContent = `${blackRemaining}s`;
  // red warning when <=10 for per-move mode
  if (activeColor === 'w' && whiteRemaining <= 10) whiteTimerEl.classList.add('warning'); else whiteTimerEl.classList.remove('warning');
  if (activeColor === 'b' && blackRemaining <= 10) blackTimerEl.classList.add('warning'); else blackTimerEl.classList.remove('warning');
}

// time expired: immediate loss for that side
function timeExpired(color){
  running = false;
  clearInterval(timerInterval);
  const loser = color === 'w' ? 'White' : 'Black';
  const winner = color === 'w' ? 'Black' : 'White';
  playSound(sndLose);
  endGame(`${loser} ran out of time — ${winner} wins`);
}

function endGame(reason){
  statusEl.textContent = reason;
  board.draggable = false;
  // freeze board visually (disable drag)
  board.destroy();
  // show final position
  Chessboard('board', {position: game.fen(), draggable: false});
}

// MOVES UI
function updateMoves(){
  const history = game.history({ verbose: true });
  movesEl.innerHTML = '';
  let rows = [];
  for (let i = 0; i < history.length; i+=2){
    const w = history[i] ? history[i].san : '';
    const b = history[i+1] ? history[i+1].san : '';
    const moveNumber = (i/2)+1;
    const div = document.createElement('div');
    div.textContent = `${moveNumber}. ${w} ${b}`;
    movesEl.appendChild(div);
  }
  updateCaptured();
}

function updateCaptured(){
  const history = game.history({ verbose: true });
  const captured = { w: [], b: [] };
  history.forEach(m => { if (m.captured) captured[m.color].push(m.captured); });
  const out = `White captured: ${captured.w.join(', ') || '—'}\nBlack captured: ${captured.b.join(', ') || '—'}`;
  capturedEl.textContent = out;
}

// SOUND
function playSound(audioEl){
  try { audioEl.currentTime = 0; audioEl.play(); } catch(e) {}
}

// RESET / START
function resetGame(){
  clearInterval(timerInterval);
  game = new Chess();
  board.destroy();
  board = Chessboard('board', cfg);
  whiteRemaining = START_PER_MOVE;
  blackRemaining = START_PER_MOVE;
  activeColor = 'w';
  running = false;
  statusEl.textContent = 'Quick: 30s per move — make a move to start';
  movesEl.innerHTML = '';
  capturedEl.textContent = '—';
  updateTimersUI();
}

// initialize small UI
(function init(){
  statusEl.textContent = 'Quick: 30s per move — make a move to start';
  whiteTimerEl.textContent = `${START_PER_MOVE}s`;
  blackTimerEl.textContent = `${START_PER_MOVE}s`;
})();
