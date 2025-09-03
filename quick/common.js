const boardElement = document.getElementById("chess-board");

// Generate 8x8 board
function createBoard() {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");

      // color alternation
      if ((row + col) % 2 === 0) {
        square.classList.add("light");
      } else {
        square.classList.add("dark");
      }

      // demo piece placement (pawns only for now)
      if (row === 1) square.textContent = "♟";
      if (row === 6) square.textContent = "♙";

      boardElement.appendChild(square);
    }
  }
}

// Dummy functions for buttons
function resign() {
  alert("You resigned!");
}
function offerDraw() {
  alert("Draw offer sent!");
}
function rematch() {
  alert("Rematch requested!");
}

createBoard();
