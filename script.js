let boardEl = document.getElementById("board");
let timerEl = document.getElementById("timer");
let whiteCapEl = document.getElementById("white-captures");
let blackCapEl = document.getElementById("black-captures");
let resultEl = document.getElementById("result");
let moveSound = document.getElementById("move-sound");
let winSound = document.getElementById("win-sound");
let loseSound = document.getElementById("lose-sound");

let game = new Chess();
let board = [];
let timer = 300; // 5 mins

function startGame() {
  document.querySelector(".welcome").classList.add("hidden");
  document.getElementById("game-container").classList.remove("hidden");
  drawBoard();
  updateTimer();
  setInterval(countdown, 1000);
}

function drawBoard() {
  boardEl.innerHTML = "";
  const position = game.board();
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square", (row + col) % 2 === 0 ? "light" : "dark");
      const piece = position[row][col];
      square.dataset.square = "abcdefgh"[col] + (8 - row);
      if (piece) square.textContent = getPieceSymbol(piece);
      square.onclick = () => handleSquareClick(square);
      boardEl.appendChild(square);
    }
  }
  updateCaptured();
}

let selected = null;

function handleSquareClick(square) {
  const sq = square.dataset.square;
  if (selected) {
    let move = game.move({ from: selected, to: sq, promotion: "q" });
    if (move) {
      moveSound.play();
      drawBoard();
      setTimeout(aiMove, 400);
      checkGameOver();
    }
    selected = null;
  } else {
    const piece = game.get(sq);
    if (piece && piece.color === "w") {
      selected = sq;
    }
  }
}

function aiMove() {
  if (game.game_over()) return;
  const moves = game.moves();
  const move = moves[Math.floor(Math.random() * moves.length)];
  game.move(move);
  moveSound.play();
  drawBoard();
  checkGameOver();
}

function checkGameOver() {
  if (game.in_checkmate()) {
    resultEl.textContent = game.turn() === "w" ? "Black Wins!" : "White Wins!";
    resultEl.classList.remove("hidden");
    triggerWinEffect(game.turn() === "w" ? "black" : "white");
  } else if (game.in_draw()) {
    resultEl.textContent = "Draw!";
    resultEl.classList.remove("hidden");
  }
}

function triggerWinEffect(winner) {
  if (winner === "white") winSound.play();
  else loseSound.play();
  document.body.style.background = "#dfffe2";
}

function updateCaptured() {
  let history = game.history({ verbose: true });
  let white = [], black = [];
  for (let move of history) {
    if (move.captured) {
      if (move.color === "w") black.push(move.captured);
      else white.push(move.captured);
    }
  }
  whiteCapEl.textContent = white.map(getPieceSymbol).join(" ");
  blackCapEl.textContent = black.map(getPieceSymbol).join(" ");
}

function updateTimer() {
  let mins = Math.floor(timer / 60);
  let secs = timer % 60;
  timerEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function countdown() {
  if (timer > 0) {
    timer--;
    updateTimer();
  } else {
    resultEl.textContent = "Time's up!";
    resultEl.classList.remove("hidden");
  }
}

function getPieceSymbol(piece) {
  const symbols = {
    p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
    P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
  };
  return symbols[piece.type.toUpperCase() === piece.type ? piece.type : piece.type.toLowerCase()];
}
