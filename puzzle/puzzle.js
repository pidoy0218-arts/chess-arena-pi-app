// puzzle.js
let board = null;
let game = new Chess();

// Sample puzzles (FEN + solution hint)
const puzzles = [
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 4",
    hint: "White to move: play Bxf7+"
  },
  {
    fen: "4rrk1/1p3ppp/p1n5/3n4/3P4/2NBP3/PP3PPP/R2Q1RK1 w - - 0 1",
    hint: "White to move: play Bxh7+"
  }
];

function loadRandomPuzzle() {
  const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
  game = new Chess(puzzle.fen);

  // Draw board
  board = Chessboard('board', {
    position: puzzle.fen,
    draggable: true,
    dropOffBoard: 'snapback'
  });

  // Update turn text
  const turn = game.turn() === 'w' ? "White to move" : "Black to move";
  document.getElementById("turnText").textContent = turn;

  // Hook hint button
  document.getElementById("hint").onclick = () => {
    alert(puzzle.hint);
  };
}

// Hook new puzzle button
document.getElementById("newPuzzle").onclick = loadRandomPuzzle;

// Load first puzzle
window.onload = loadRandomPuzzle;
