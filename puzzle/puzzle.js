let board, game;

// Sample puzzles (FEN + solution moves)
const puzzles = [
  {
    fen: "r1bqkbnr/pppppppp/2n5/8/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    moves: ["f3g5", "d7d5", "e4d5"] // sample line
  },
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 3",
    moves: ["e5d4", "f3d4", "c6d4"] // sample line
  }
];

// Load a new random puzzle
function loadPuzzle() {
  const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
  game = new Chess(puzzle.fen);
  board.position(puzzle.fen);
  document.getElementById("turnText").innerText =
    game.turn() === "w" ? "White to move" : "Black to move";
  board.start();
  return puzzle;
}

let currentPuzzle;

// Allow only legal moves
function onDragStart(source, piece) {
  if (game.game_over()) return false;
  if ((game.turn() === 'w' && piece.startsWith('b')) ||
      (game.turn() === 'b' && piece.startsWith('w'))) {
    return false;
  }
}

function onDrop(source, target) {
  let move = game.move({
    from: source,
    to: target,
    promotion: "q"
  });

  if (move === null) return "snapback";
  document.getElementById("turnText").innerText =
    game.turn() === "w" ? "White to move" : "Black to move";
}

function initBoard() {
  board = Chessboard('board', {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop
  });
  currentPuzzle = loadPuzzle();
}

// Buttons
document.addEventListener("DOMContentLoaded", () => {
  initBoard();

  document.getElementById("newPuzzle").addEventListener("click", () => {
    currentPuzzle = loadPuzzle();
  });

  document.getElementById("hint").addEventListener("click", () => {
    if (currentPuzzle && currentPuzzle.moves.length > 0) {
      alert("Hint: Try move " + currentPuzzle.moves[0]);
    }
  });
});
