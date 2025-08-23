/***********************
 * Chess Arena for Pi  *
 ***********************/
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const movesEl = document.getElementById("moves");
const whiteCapEl = document.getElementById("whiteCaptured");
const blackCapEl = document.getElementById("blackCaptured");
const whiteTimeEl = document.getElementById("whiteTime");
const blackTimeEl = document.getElementById("blackTime");
const modeSelect = document.getElementById("modeSelect");
const timeSelect = document.getElementById("timeSelect");
const aiLevelSelect = document.getElementById("aiLevel");
const newGameBtn = document.getElementById("newGameBtn");
const undoBtn = document.getElementById("undoBtn");
const flipBtn = document.getElementById("flipBtn");
const soundBtn = document.getElementById("soundBtn");
const turnBadge = document.getElementById("turnBadge");
const promoDialog = document.getElementById("promoDialog");

let game = new Chess();                   // chess.js engine
let selected = null;
let orientation = "white";
let playSounds = true;

// timers
let baseTime = 300; // seconds
let whiteTime = baseTime, blackTime = baseTime;
let timerInterval = null;

// AI
let aiWorker = null;
let aiEnabled = false;
let aiLevel = 3;

// captured arrays (unicode symbols)
const UNI = {
  w: { p:"♙", r:"♖", n:"♘", b:"♗", q:"♕", k:"♔" },
  b: { p:"♟", r:"♜", n:"♞", b:"♝", q:"♛", k:"♚" }
};
const PIECE_UNI = (p) => UNI[p.color][p.type];

const captureBins = { w: [], b: [] };

// Init
init();

function init(){
  setupBoard();
  bindUI();
  setMode(modeSelect.value);
  setBaseTime(parseInt(timeSelect.value,10));
  startNewGame();
  initAI();
}

function bindUI(){
  newGameBtn.onclick = startNewGame;
  undoBtn.onclick = undoMove;
  flipBtn.onclick = flipBoard;
  soundBtn.onclick = () => {
    playSounds = !playSounds;
    soundBtn.textContent = "Sound: " + (playSounds ? "On" : "Off");
  };
  modeSelect.onchange = () => setMode(modeSelect.value);
  timeSelect.onchange = () => {
    setBaseTime(parseInt(timeSelect.value,10));
    startNewGame();
  };
  aiLevelSelect.onchange = () => {
    aiLevel = parseInt(aiLevelSelect.value,10);
  };

  // promotion dialog choices
  promoDialog.querySelectorAll(".promo").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const piece = btn.dataset.piece;
      promoDialog.close(piece);
    });
  });

  // Pi sign-in placeholder
  document.getElementById("piSignIn").onclick = () => {
    localStorage.setItem("pi_user", JSON.stringify({uid:"demo", username:"Demo"}));
    const badge = document.getElementById("piBadge");
    badge.textContent = "Signed in as Demo";
    badge.style.background = "#0b3";
    badge.style.color = "#fff";
  };
}

function setMode(mode){
  aiEnabled = (mode === "hva");
  undoBtn.disabled = aiEnabled; // keep undo only for HvH by default
}

function setBaseTime(seconds){
  baseTime = seconds;
  whiteTime = baseTime;
  blackTime = baseTime;
  updateTimers();
}

function startNewGame(){
  clearInterval(timerInterval);
  game.reset();
  captureBins.w = [];
  captureBins.b = [];
  selected = null;
  whiteTime = baseTime;
  blackTime = baseTime;
  renderBoard();
  renderCaptures();
  renderMoves();
  updateStatus();
  startTimers();
  // if AI is black, let it think when it's its turn
  maybeAIMove();
}

function setupBoard(){
  boardEl.innerHTML = "";
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const sq = document.createElement("div");
      sq.className = "square " + ((r+c)%2===0 ? "light" : "dark");
      sq.dataset.r = r; sq.dataset.c = c;
      sq.addEventListener("click", () => onSquareClick(r,c));
      boardEl.appendChild(sq);
    }
  }
  renderBoard();
}

function coordToAlg(r,c){
  // orientation-aware algebraic
  let file = c, rank = r;
  if(orientation === "white"){
    file = c; rank = r;
  }else{
    file = 7 - c; rank = 7 - r;
  }
  const files = "abcdefgh";
  return files[file] + (8 - rank);
}

function algToRC(alg){
  const files = "abcdefgh";
  let file = files.indexOf(alg[0]);
  let rank = 8 - parseInt(alg[1],10);
  if(orientation === "white"){
    return {r:rank, c:file};
  }else{
    return {r:7-rank, c:7-file};
  }
}

function renderBoard(){
  // clear all squares
  const squares = boardEl.children;
  for(let i=0;i<squares.length;i++){
    const sq = squares[i];
    sq.textContent = "";
    sq.classList.remove("sel");
    const hint = sq.querySelector(".hint");
    if(hint) hint.remove();
  }

  const board = game.board(); // 0..7 rows
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const piece = board[r][c];
      const display = piece ? PIECE_UNI({color:piece.color, type:piece.type}) : "";
      // map actual rc to oriented rc
      let {r:or, c:oc} = (orientation==="white") ? {r, c} : {r:7-r, c:7-c};
      const idx = or*8 + oc;
      const sq = squares[idx];
      sq.textContent = display;
      if(piece && piece.color === "w") sq.style.color = "ivory";
      else if(piece && piece.color === "b") sq.style.color = "black";
      else sq.style.color = "";
    }
  }
}

function onSquareClick(r,c){
  // translate oriented rc back to real board rc
  let rr = (orientation === "white") ? r : 7 - r;
  let cc = (orientation === "white") ? c : 7 - c;

  const board = game.board();
  const piece = board[rr][cc];

  // if nothing selected, select if it's side to move
  if(!selected){
    if(piece && piece.color === game.turn()){
      selected = {r: rr, c: cc};
      highlightSquare({r, c});
      showHintsFrom(selected);
    }
    return;
  }

  // attempt move (handle promotion)
  const from = toAlg(selected.r, selected.c);
  const to = toAlg(rr, cc);

  let move = tryMove(from, to);
  if(!move){
    // reselect if clicked another own piece
    if(piece && piece.color === game.turn()){
      selected = {r: rr, c: cc};
      renderBoard();
      highlightSquare({r, c});
      showHintsFrom(selected);
    }else{
      // clear
      selected = null;
      renderBoard();
    }
    return;
  }

  // success
  onMoveApplied(move);
}

function toAlg(r,c){
  const files = "abcdefgh";
  return files[c] + (8 - r);
}

function tryMove(from, to){
  const needsPromotion = willPromote(from, to);
  if(needsPromotion){
    const piece = openPromotionDialogSync();
    return game.move({from, to, promotion: piece || "q"});
  }else{
    return game.move({from, to});
  }
}

function willPromote(from, to){
  const piece = game.get(from);
  if(!piece || piece.type !== "p") return false;
  const rank = parseInt(to[1], 10);
  return (piece.color === "w" && rank === 8) || (piece.color === "b" && rank === 1);
}

function openPromotionDialogSync(){
  // show <dialog>, wait for close, return chosen piece
  try{
    promoDialog.showModal();
  }catch(e){
    // if dialogs disallowed, default to queen
    return "q";
  }
  return new Promise(resolve=>{
    promoDialog.addEventListener("close", function handler(){
      promoDialog.removeEventListener("close", handler);
      resolve(promoDialog.returnValue || "q");
    }, {once:true});
  });
}

async function onMoveApplied(move){
  // capture register
  if(move.captured){
    // piece that moved captured an enemy piece -> goes to its bin
    const captColor = (move.color === "w") ? "w" : "b";
    const victimColor = (captColor === "w") ? "b" : "w";
    captureBins[captColor].push(UNI[victimColor][move.captured]);
    renderCaptures();
  }

  playSounds && playMoveSound();
  renderBoard();
  addMoveToLog(move);
  updateStatus();

  // stop timers if game over
  if(game.game_over()){
    clearInterval(timerInterval);
    if(game.in_checkmate()) playSounds && playWinSound();
    return;
  }

  // AI turn?
  await maybeAIMove();
}

function renderCaptures(){
  whiteCapEl.textContent = captureBins.w.join(" ");
  blackCapEl.textContent = captureBins.b.join(" ");
}

function addMoveToLog(move){
  const san = move.san;
  const ply = game.history().length;
  const turnNo = Math.ceil(ply/2);
  const div = document.createElement("div");
  div.className = "move";
  if(ply % 2 === 1){
    div.textContent = `${turnNo}. ${san}`;
  }else{
    div.textContent = `${turnNo}... ${san}`;
  }
  movesEl.prepend(div);
}

function renderMoves(){
  movesEl.innerHTML = "";
  let hist = game.history({verbose:true});
  for(let i = hist.length - 1; i >= 0; i--){
    addMoveToLog(hist[i]);
  }
}

function updateStatus(){
  let text = "";
  if(game.in_checkmate()){
    text = "Checkmate! " + (game.turn()==="w" ? "Black" : "White") + " wins.";
  }else if(game.in_draw()){
    text = "Draw.";
  }else if(game.in_check()){
    text = (game.turn()==="w" ? "White" : "Black") + " to move — CHECK!";
  }else{
    text = (game.turn()==="w" ? "White" : "Black") + " to move.";
  }
  statusEl.textContent = text;
  turnBadge.textContent = (game.turn()==="w" ? "White to move" : "Black to move");
}

function highlightSquare({r,c}){
  // oriented coords
  const or = (orientation==="white") ? r : 7 - r;
  const oc = (orientation==="white") ? c : 7 - c;
  const idx = or*8 + oc;
  const squares = boardEl.children;
  squares[idx].classList.add("sel");
}

function showHintsFrom(sel){
  const fromAlg = toAlg(sel.r, sel.c);
  const moves = game.moves({square: fromAlg, verbose:true});
  const squares = boardEl.children;
  moves.forEach(m=>{
    const {r,c} = algToRC(m.to);
    const idx = r*8 + c;
    const dot = document.createElement("div");
    dot.className = "hint";
    squares[idx].appendChild(dot);
  });
}

function undoMove(){
  if(aiEnabled) return; // keep it simple for HvH
  // undo last two plies for full move
  game.undo();
  game.undo();
  captureBins.w = [];
  captureBins.b = [];
  rebuildCapturesFromHistory();
  renderBoard();
  renderMoves();
  updateStatus();
}

function rebuildCapturesFromHistory(){
  const temp = new Chess();
  captureBins.w = []; captureBins.b = [];
  const hist = game.history({verbose:true});
  hist.forEach(m=>{
    const preCap = temp.get(m.to);
    temp.move(m);
    if(m.captured){
      const captBy = m.color; // w or b
      const victim = m.captured; // p/r/n/b/q
      const victimColor = (captBy === "w") ? "b" : "w";
      captureBins[captBy].push(UNI[victimColor][victim]);
    }
  });
}

function flipBoard(){
  orientation = (orientation === "white") ? "black" : "white";
  renderBoard();
}

function startTimers(){
  clearInterval(timerInterval);
  updateTimers();
  timerInterval = setInterval(()=>{
    if(game.game_over()) return clearInterval(timerInterval);
    if(game.turn() === "w"){
      whiteTime = Math.max(0, whiteTime - 1);
    }else{
      blackTime = Math.max(0, blackTime - 1);
    }
    updateTimers();
    if(whiteTime === 0 || blackTime === 0){
      clearInterval(timerInterval);
      statusEl.textContent = (whiteTime === 0) ? "White flagged. Black wins." : "Black flagged. White wins.";
    }
  }, 1000);
}

function updateTimers(){
  whiteTimeEl.textContent = fmt(whiteTime);
  blackTimeEl.textContent = fmt(blackTime);
}
function fmt(s){
  const m = Math.floor(s/60).toString().padStart(2,"0");
  const ss = (s%60).toString().padStart(2,"0");
  return `${m}:${ss}`;
}

/***************
 * AI (Stockfish)
 ***************/
function initAI(){
  try{
    aiWorker = new Worker(STOCKFISH_CDN);
    aiWorker.onmessage = (e)=>{
      const line = (typeof e === "string") ? e : e.data;
      if(typeof line !== "string") return;
      // find bestmove
      if(line.startsWith("bestmove")){
        const parts = line.split(" ");
        const uci = parts[1];
        applyUCIMove(uci);
      }
    };
  }catch(e){
    aiWorker = null;
    console.warn("Stockfish worker unavailable; will use random AI fallback.");
  }
}

async function maybeAIMove(){
  if(!aiEnabled) return;
  const turn = game.turn(); // whose turn now
  // Let AI play black by default; if you want AI to play side that is to move, remove next line
  if(turn !== "b") return;

  // small delay to feel natural
  await new Promise(r=>setTimeout(r, 200));

  if(aiWorker){
    const fen = game.fen();
    aiWorker.postMessage("uci");
    aiWorker.postMessage("ucinewgame");
    aiWorker.postMessage("isready");
    aiWorker.postMessage(`position fen ${fen}`);
    aiWorker.postMessage(`go depth ${aiLevel}`);
  }else{
    // random legal move fallback
    const ms = game.moves({verbose:true});
    const pick = ms[Math.floor(Math.random()*ms.length)];
    const move = game.move(pick);
    onMoveApplied(move);
  }
}

function applyUCIMove(uci){
  const from = uci.slice(0,2);
  const to   = uci.slice(2,4);
  const prom = uci[4] || undefined;
  const move = game.move({from, to, promotion: prom});
  if(move) onMoveApplied(move);
}

/***************
 * Sounds
 ***************/
function playMoveSound(){ try{ window.playMoveSound && window.playMoveSound(); }catch{} }
function playWinSound(){ try{ window.playWinSound && window.playWinSound(); }catch{} }
