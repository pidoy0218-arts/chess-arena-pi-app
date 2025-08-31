// puzzle.js

// Puzzle positions (FEN strings)
const puzzles = [
  { fen: "r1bqkbnr/pppppppp/2n5/8/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 2 2", solution: "Nc6xe5" }, // example
  { fen: "8/8/8/8/2k5/2p5/2P5/2K5 w - - 0 1", solution: "c2-c3#" },
  { fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 1 1", solution: "d7-d5" }
];

let board = null;
let game = new Chess();
let currentPuzzle = null;

// Pick random puzzle
function loadPuzzle() {
  currentPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
  game = new Chess(currentPuzzle.fen);

  board.position(currentPuzzle.fen);

  // Show whose turn
  const turnText = game.turn() === 'w' ? "White to move" : "Black to move";
  document.getElementById("turnText").innerText = turnText;
}

// Config for chessboard.js
const config = {
  draggable: true,
  position: "start",
  onDrop: onDrop
};

board = Chessboard("board", config);

// Handle piece movement
function onDrop(source, target) {
  const move = game.move({
    from: source,
    to: target,
    promotion: "q"
  });

  if (move === null) return "snapback"; // illegal move
}

// Button actions
document.getElementById("newPuzzle").addEventListener("click", loadPuzzle);
document.getElementById("hint").addEventListener("click", () => {
  alert("Hint: " + currentPuzzle.solution);
});

// Load first puzzle
loadPuzzle();
