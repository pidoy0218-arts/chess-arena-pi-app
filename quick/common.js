// Loader logic
window.onload = function () {
  const loader = document.getElementById('loader');
  const popup = document.getElementById('popup');
  if (loader && popup) {
    setTimeout(() => {
      loader.style.display = 'none';
      popup.classList.remove('hidden');
    }, 3000);
  }
};

// Start game placeholder (later wired to Pi SDK)
function startGame(mode) {
  alert("Mode selected: " + mode + "\n(Will connect via Pi SDK later)");
  window.location.href = "game.html";
}

// Timer
let timerInterval;
let timeLeft = 60;
function startTimer() {
  const timerEl = document.getElementById('timer');
  if (!timerEl) return;
  timerInterval = setInterval(() => {
    timeLeft--;
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      alert("Time up! You lose.");
    }
  }, 1000);
}

// Chess game
let board, game;
function initChess() {
  game = new Chess();
  board = Chessboard('board', {
    draggable: true,
    position: 'start',
    onDrop: handleMove
  });
  startTimer();
}

function handleMove(source, target) {
  let move = game.move({ from: source, to: target, promotion: 'q' });
  if (move === null) return 'snapback';
  updateHistory();
  if (game.game_over()) {
    setTimeout(() => alert("Game Over!"), 500);
  }
}

function updateHistory() {
  let history = game.history();
  document.getElementById('move-history').innerHTML = history.join(', ');
}

// Control buttons
function resignGame() {
  alert("You resigned.");
}
function offerDraw() {
  alert("Draw offered.");
}
function rematchGame() {
  alert("Rematch started.");
  location.reload();
}

// Run chess init when in game.html
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("board")) {
    initChess();
  }
});
