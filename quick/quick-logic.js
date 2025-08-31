const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const turnInfo = document.getElementById("turnInfo");
const timerElement = document.getElementById("timer");

const game = new Chess(); // chess.js engine
let selectedSquare = null;
let timer = 60;
let countdown;

function startTimer() {
  clearInterval(countdown);
  timer = 60;
  timerElement.textContent = "Time: " + timer;
  countdown = setInterval(() => {
    timer--;
    timerElement.textContent = "Time: " + timer;
    if (timer <= 0) {
      clearInterval(countdown);
      statusElement.textContent = `${game.turn() === "w" ? "White" : "Black"} loses on time!`;
      boardElement.style.pointerEvents = "none";
    }
  }, 1000);
}

function renderBoard() {
  boardElement.innerHTML = "";
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const squareColor = (r + c) % 2 === 0 ? "light" : "dark";
      const squareDiv = document.createElement("div");
      squareDiv.classList.add("square", squareColor);
      const piece = board[r][c];
      if (piece) {
        squareDiv.textContent = piece.type.toUpperCase();
        if (piece.color === "b") squareDiv.style.color = "black";
        else squareDiv.style.color = "ivory";
      }
      const file = "abcdefgh"[c];
      const rank = 8 - r;
      const square = file + rank;
      squareDiv.addEventListener("click", () => onSquareClick(square));
      boardElement.appendChild(squareDiv);
    }
  }
}

function onSquareClick(square) {
  if (selectedSquare) {
    const move = game.move({ from: selectedSquare, to: square, promotion: "q" });
    if (move) {
      renderBoard();
      if (game.in_checkmate()) {
        statusElement.textContent = `${move.color === "w" ? "White" : "Black"} wins by checkmate!`;
        clearInterval(countdown);
        boardElement.style.pointerEvents = "none";
        return;
      } else if (game.in_draw()) {
        statusElement.textContent = "Game drawn!";
        clearInterval(countdown);
        return;
      }
      turnInfo.textContent = "Turn: " + (game.turn() === "w" ? "White" : "Black");
      startTimer();
    }
    selectedSquare = null;
  } else {
    selectedSquare = square;
  }
}

renderBoard();
startTimer();
