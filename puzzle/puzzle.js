let board = null;
let game = new Chess();

// Small set of sample puzzles
const puzzles = [
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3",
    solution: "Bxf7+" // White to move
  },
  {
    fen: "rnbqkbnr/pppp1ppp/8/4p3/1P6/5N2/P1PPPPPP/RNBQKB1R b KQkq - 1 2",
    solution: "e4" // Black to move
  },
  {
    fen: "r1bqkbnr/pppppppp/2n5/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 1 2",
    solution: "Nd4" // Black to move
  }
];

let currentPuzzle = null;

// Load a random puzzle
function loadPuzzle() {
  currentPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
  game.load(currentPuzzle.fen);
  board.position(currentPuzzle.fen);
  document.getElementById("turnText").innerText =
    game.turn() === "w" ? "White to move" : "Black to move";
  document.getElementById("hintText").innerText = "";
}

// Handle piece dragging
function onDragStart(source, piece) {
  if (game.game_over()) return false;
  if ((game.turn() === "w" && piece.search(/^b/) !== -1) ||
      (game.turn() === "b" && piece.search(/^w/) !== -1)) {
    return false;
  }
}

// Handle piece drop
function onDrop(source, target) {
  const move = game.move({
    from: source,
    to: target,
    promotion: 'q'
  });

  if (move === null) return 'snapback';

  document.getElementById("turnText").innerText =
    game.turn() === "w" ? "White to move" : "Black to move";
}

// Update board after piece snap
function onSnapEnd() {
  board.position(game.fen());
}

// Initialize board
board = Chessboard('board', {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
});

// Button listeners
document.getElementById("newPuzzle").addEventListener("click", loadPuzzle);
document.getElementById("hintBtn").addEventListener("click", () => {
  document.getElementById("hintText").innerText =
    "Hint: " + currentPuzzle.solution;
});

// Load first puzzle
loadPuzzle();
