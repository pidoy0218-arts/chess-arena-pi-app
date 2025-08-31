// Simple offline chess puzzle engine

// Unicode chess pieces (ivory & ebony)
const pieces = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟"
};

// Example puzzle (white mates in 1)
let puzzleFEN = "6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1";
let boardElement = document.getElementById("board");
let turnText = document.getElementById("turnText");

// Parse FEN string into board squares
function loadFEN(fen) {
  boardElement.innerHTML = "";
  let parts = fen.split(" ");
  let rows = parts[0].split("/");
  rows.forEach((row, r) => {
    let col = 0;
    for (let ch of row) {
      if (!isNaN(ch)) {
        for (let i = 0; i < parseInt(ch); i++) {
          createSquare(r, col, "");
          col++;
        }
      } else {
        createSquare(r, col, pieces[ch] || "");
        col++;
      }
    }
  });
  turnText.textContent = parts[1] === "w" ? "White to move" : "Black to move";
}

function createSquare(r, c, piece) {
  let square = document.createElement("div");
  square.classList.add("square");
  square.classList.add((r + c) % 2 === 0 ? "light" : "dark");
  square.textContent = piece;
  boardElement.appendChild(square);
}

// Hint button just tells you the solution move
document.getElementById("hint").addEventListener("click", () => {
  alert("Hint: White plays Qd8#");
});

// Reload puzzle
document.getElementById("newPuzzle").addEventListener("click", () => {
  loadFEN(puzzleFEN);
});

// First load
loadFEN(puzzleFEN);
