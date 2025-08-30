// quick-logic-quick.js
// Requires chess.js to be loaded globally (window.Chess)
// Place this file at ../quick-logic-quick.js relative to quick.html

// If you want non-module, remove "type=module" from HTML and this file can be plain script.
// I write as module to avoid polluting globals.

const ASSETS = {
  move: '../assets/move.mp3',
  capture: '../assets/capture.mp3',
  win: '../assets/win.mp3',
  lose: '../assets/lose.mp3'
};

let chess;
let boardEl;
let selectedSquare = null;
let highlightSquares = [];
let moveHistory = [];
let capturedWhite = [];
let capturedBlack = [];

// timers for quick mode (per-move)
let perMoveSeconds = 30; // quick move time
let activeColor = 'w';
let moveTimer = null;
let timeLeft = perMoveSeconds;

// DOM nodes
const whiteTimerEl = document.getElementById('whiteTimer');
const blackTimerEl = document.getElementById('blackTimer');
const movesListEl = document.getElementById('movesList');
const whiteCapturedEl = document.getElementById('whiteCaptured');
const blackCapturedEl = document.getElementById('blackCaptured');
const promotionModal = document.getElementById('promotionModal');

const moveSound = document.getElementById('moveSound');
const captureSound = document.getElementById('captureSound');
const winSound = document.getElementById('winSound');
const loseSound = document.getElementById('loseSound');

function playSound(el){
  try { el.currentTime = 0; el.play(); } catch(e){ /* ignore */ }
}

// create initial board DOM and attach handlers
function init(){
  boardEl = document.getElementById('board');
  chess = new window.Chess(); // from chess.js
  renderBoard();
  updateMoveHistory();
  setupControls();
  startMoveTimer(); // quick mode per-move timer
}

function setupControls(){
  document.getElementById('restartBtn').addEventListener('click', resetGame);
  document.getElementById('backBtn').addEventListener('click', ()=> { window.history.back(); });
  // promotion switch handlers
  promotionModal.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', ()=> {
      const piece = btn.dataset.piece;
      promotionModal.classList.add('hidden');
      // store selected promotion piece and execute pending move
      executePendingMove(piece);
    });
  });
}

// Render board from chess.board()
function renderBoard(){
  boardEl.innerHTML = '';
  const board = chess.board(); // array [rank 8 -> 1] as rows
  // chess.js board returns rows from 8 to 1
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const sqIndex = r*8 + c;
      const isLight = ((r + c) % 2 === 0);
      const sq = document.createElement('div');
      sq.className = 'square ' + (isLight ? 'light' : 'dark');
      const file = 'abcdefgh'[c];
      const rank = 8 - r;
      const sqName = file + rank;
      sq.dataset.square = sqName;

      // highlight if in highlightSquares
      if(highlightSquares.includes(sqName)){
        sq.classList.add('highlight');
      }

      const piece = board[r][c];
      if(piece){
        const pieceEl = document.createElement('div');
        pieceEl.className = 'piece';
        pieceEl.textContent = unicodeForPiece(piece);
        sq.appendChild(pieceEl);
      }

      sq.addEventListener('click', () => onSquareClick(sqName));
      boardEl.appendChild(sq);
    }
  }
}

// Map chess.js piece to unicode piece glyph (classic look)
function unicodeForPiece(piece){
  // piece: { type: 'p','r','n','b','q','k', color: 'w'|'b' }
  const map = {
    p: {w:'♙', b:'♟'},
    r: {w:'♖', b:'♜'},
    n: {w:'♘', b:'♞'},
    b: {w:'♗', b:'♝'},
    q: {w:'♕', b:'♛'},
    k: {w:'♔', b:'♚'}
  };
  return map[piece.type][piece.color];
}

// click handler
let pendingPromotion = null; // {from,to,color}
function onSquareClick(sq){
  // if promotion modal open ignore
  if(!promotionModal.classList.contains('hidden')) return;

  const piece = chess.get(sq);
  if(!selectedSquare){
    // select only if square has player's piece (we allow both for local testing — treat as friendly)
    if(piece){
      selectedSquare = sq;
      highlightSquares = chess.moves({ square: selectedSquare, verbose: true }).map(m => m.to);
      renderBoard();
    }
    return;
  }

  // attempt move
  const moves = chess.moves({ verbose: true, square: selectedSquare });
  const move = moves.find(m => m.to === sq);
  if(!move){
    // if clicked another friendly piece, reselect
    if(piece && piece.color === chess.get(selectedSquare).color){
      selectedSquare = sq;
      highlightSquares = chess.moves({ square: selectedSquare, verbose: true }).map(m => m.to);
      renderBoard();
      return;
    }
    // else reset selection
    selectedSquare = null;
    highlightSquares = [];
    renderBoard();
    return;
  }

  // handle promotion
  if(move.flags.includes('p') && (move.promotion === undefined)){
    // need to choose promotion piece
    pendingPromotion = { from: selectedSquare, to: sq, color: chess.get(selectedSquare).color };
    promotionModal.classList.remove('hidden');
    return;
  }

  // perform move
  const res = chess.move({ from: selectedSquare, to: sq, promotion: (move.promotion || 'q') });
  if(res){
    onMoveExecuted(res);
  }
  selectedSquare = null;
  highlightSquares = [];
  renderBoard();
}

// Called after a move is executed via chess.move()
function onMoveExecuted(move){
  // move: { color, from, to, flags, piece, san, captured?, promotion? }
  moveHistory.unshift(move.san || (move.from + '-' + move.to));
  updateMoveHistory();

  // sounds
  if(move.captured) playSound(captureSound); else playSound(moveSound);

  // update captured lists
  if(move.captured){
    const cap = move.captured;
    if(move.color === 'w'){
      capturedWhite.push(cap);
    } else {
      capturedBlack.push(cap);
    }
    renderCaptured();
  }

  // reset per-move timer for quick mode
  resetMoveTimer();

  // check endgame
  if(chess.in_checkmate()){
    showEndGame(move.color === 'w' ? 'White wins' : 'Black wins', 'checkmate');
    playSound(winSound);
    confettiBurst();
    clearInterval(moveTimer);
  } else if(chess.in_stalemate()){
    showEndGame('Draw', 'stalemate');
    playSound(loseSound);
    clearInterval(moveTimer);
  } else if(chess.in_draw() || chess.insufficient_material()){
    showEndGame('Draw', 'draw');
    clearInterval(moveTimer);
  } else {
    // continue
  }

  renderBoard();
}

function updateMoveHistory(){
  movesListEl.innerHTML = '';
  for(let i=0;i<moveHistory.length;i++){
    const d = document.createElement('div');
    d.textContent = (i+1) + '. ' + moveHistory[i];
    d.className = 'moveItem';
    movesListEl.appendChild(d);
  }
}

function renderCaptured(){
  whiteCapturedEl.innerHTML = capturedWhite.map(p => unicodeForPiece({type:p, color:'b'})).join(' ');
  blackCapturedEl.innerHTML = capturedBlack.map(p => unicodeForPiece({type:p, color:'w'})).join(' ');
}

// promotion selection handler
function executePendingMove(pick){
  if(!pendingPromotion) return;
  const res = chess.move({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: pick });
  if(res){
    onMoveExecuted(res);
  }
  pendingPromotion = null;
}

// timers: quick per-move timer
function startMoveTimer(){
  timeLeft = perMoveSeconds;
  activeColor = chess.turn(); // 'w' or 'b'
  updateTimerDisplays();
  if(moveTimer) clearInterval(moveTimer);
  moveTimer = setInterval(()=>{
    timeLeft--;
    updateTimerDisplays();
    if(timeLeft <= 0){
      clearInterval(moveTimer);
      // activeColor failed to move -> they lose
      const loser = activeColor === 'w' ? 'White' : 'Black';
      const winner = activeColor === 'w' ? 'Black' : 'White';
      showEndGame(`${winner} wins — ${loser} timed out`, 'timeout');
      playSound(loseSound);
    }
  }, 1000);
}

function resetMoveTimer(){
  // called after move executed
  timeLeft = perMoveSeconds;
  activeColor = chess.turn();
  updateTimerDisplays();
}

function updateTimerDisplays(){
  // show per-move time as seconds
  whiteTimerEl.textContent = (chess.turn() === 'w' ? `▶ ${formatTime(timeLeft)}` : formatTime(timeLeft));
  blackTimerEl.textContent = (chess.turn() === 'b' ? `▶ ${formatTime(timeLeft)}` : formatTime(timeLeft));
  // warning
  if(timeLeft <= 10){
    if(chess.turn() === 'w') whiteTimerEl.classList.add('warning'); else whiteTimerEl.classList.remove('warning');
    if(chess.turn() === 'b') blackTimerEl.classList.add('warning'); else blackTimerEl.classList.remove('warning');
  } else {
    whiteTimerEl.classList.remove('warning');
    blackTimerEl.classList.remove('warning');
  }
}

function formatTime(sec){
  if(sec < 0) sec = 0;
  const s = Math.floor(sec % 60).toString().padStart(2,'0');
  const m = Math.floor(sec/60).toString();
  return (m + ':' + s);
}

function showEndGame(text, reason){
  alert(`Game over: ${text} (${reason})`);
}

function resetGame(){
  chess.reset();
  moveHistory = [];
  capturedWhite = [];
  capturedBlack = [];
  selectedSquare = null;
  highlightSquares = [];
  renderBoard();
  updateMoveHistory();
  resetMoveTimer();
  startMoveTimer();
}

function confettiBurst(){
  // small confetti; keep light
  try {
    const c = document.getElementById('confetti');
    const ctx = c.getContext('2d');
    const w = innerWidth, h = innerHeight;
    c.width = w; c.height = h;
    const pieces = 40;
    const colors = ["#f44336","#e91e63","#2196f3","#4caf50","#ffeb3b","#d4a34a"];
    const drops = Array.from({length:pieces}).map(()=> ({
      x: Math.random()*w, y: -20, vy: Math.random()*3+2, color: colors[Math.floor(Math.random()*colors.length)], r: Math.random()*4+2
    }));
    let t=0;
    function step(){
      ctx.clearRect(0,0,w,h);
      drops.forEach(d=>{
        d.y += d.vy;
        ctx.fillStyle = d.color;
        ctx.fillRect(d.x, d.y, d.r, d.r);
      });
      if(++t<90) requestAnimationFrame(step);
      else ctx.clearRect(0,0,w,h);
    }
    requestAnimationFrame(step);
  } catch(e){}
}

// init when DOM ready
document.addEventListener('DOMContentLoaded', init);
