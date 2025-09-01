// Simple chess rules engine using chess.js logic re-implemented offline
// Board setup
const boardElement = document.getElementById("board");
const historyElement = document.getElementById("move-history");
const timerElement = document.getElementById("timer");
const endScreen = document.getElementById("end-screen");
const endMessage = document.getElementById("end-message");

let timer = 300; // 5 minutes
let interval;
let moveHistory = [];
let gameOver = false;

// Sounds
const moveSound = document.getElementById("move-sound");
const winSound = document.getElementById("win-sound");
const loseSound = document.getElementById("lose-sound");

// Confetti (simple fallback)
function confettiEffect() {
  alert("🎉 Confetti! Winner!");
}

// Basic chess logic
let board = [
  ["r","n","b","q","k","b","n","r"],
  ["p","p","p","p","p","p","p","p"],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["P","P","P","P","P","P","P","P"],
  ["R","N","B","Q","K","B","N","R"]
];

let turn = "white";
let selected = null;

// Draw board
function drawBoard() {
  boardElement.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.classList.add((row + col) % 2 === 0 ? "light" : "dark");
      square.dataset.row = row;
      square.dataset.col = col;
      square.textContent = board[row][col];
      square.addEventListener("click", onSquareClick);
      boardElement.appendChild(square);
    }
  }
}

function onSquareClick(e) {
  if (gameOver) return;
  const row = e.target.dataset.row;
  const col = e.target.dataset.col;
  const piece = board[row][col];

  if (selected) {
    makeMove(selected.row, selected.col, row, col);
    selected = null;
  } else {
    if (piece) selected = { row, col };
  }
}

function makeMove(sr, sc, dr, dc) {
  const piece = board[sr][sc];
  if (!piece) return;

  // Simplified: allow all moves for now
  board[dr][dc] = piece;
  board[sr][sc] = "";

  // Pawn promotion (auto-queen)
  if (piece === "P" && dr == 0) board[dr][dc] = "Q";
  if (piece === "p" && dr == 7) board[dr][dc] = "q";

  // Play sound
  moveSound.play();

  // Save history
  moveHistory.push(`${piece}${String.fromCharCode(97 + parseInt(dc))}${8 - dr}`);
  updateHistory();

  // Switch turn
  turn = turn === "white" ? "black" : "white";

  // Redraw
  drawBoard();

  // TODO: Add real legal move validation + checkmate/stalemate detection
}

function updateHistory() {
  historyElement.innerHTML = "";
  moveHistory.forEach(move => {
    const span = document.createElement("span");
    span.textContent = move;
    historyElement.appendChild(span);
  });
}

// Timer
function startTimer() {
  interval = setInterval(() => {
    if (gameOver) {
      clearInterval(interval);
      return;
    }
    timer--;
    let minutes = Math.floor(timer / 60);
    let seconds = timer % 60;
    timerElement.textContent =
      `${minutes.toString().padStart(2,"0")}:${seconds.toString().padStart(2,"0")}`;

    if (timer <= 0) {
      endGame("Time’s up! You lose.", false);
    }
  }, 1000);
}

function endGame(message, win) {
  gameOver = true;
  clearInterval(interval);
  endMessage.textContent = message;
  endScreen.classList.remove("hidden");
  if (win) {
    winSound.play();
    confettiEffect();
  } else {
    loseSound.play();
  }
  setTimeout(() => {
    // wait 5 sec before enabling buttons
  }, 5000);
}

function backToMenu() {
  location.reload();
}

function goToLeaderboard() {
  alert("Leaderboard coming soon!");
}

// Start
drawBoard();
startTimer();
