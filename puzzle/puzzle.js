// Define some sample puzzles
// Each puzzle: {fen, turn, solution}
const puzzles = [
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    turn: "w",
    solution: "Nxe5"
  },
  {
    fen: "r1bq1rk1/pp3ppp/2n2n2/2bp4/2B5/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 1",
    turn: "w",
    solution: "Nxd5"
  },
  {
    fen: "r2qk2r/pp1n1ppp/2pbpn2/8/2BPP3/2N2N2/PPP2PPP/R1BQ1RK1 w kq - 0 1",
    turn: "w",
    solution: "e5"
  }
];

let board = null;
let game = new Chess();
let currentPuzzle = null;

function loadPuzzle() {
  currentPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
  game.load(currentPuzzle.fen);
  board.position(currentPuzzle.fen);
  document.getElementById("turnText").innerText =
    (currentPuzzle.turn === "w" ? "White" : "Black") + " to move";
  document.getElementById("hintText").innerText = "";
}

function showHint() {
  document.getElementById("hintText").innerText =
    "Hint: Best move is " + currentPuzzle.solution;
}

// Initialize board
window.onload = function () {
  board = Chessboard("board", {
    draggable: true,
    position: "start",
    onDrop: (source, target) => {
      let move = game.move({ from: source, to: target, promotion: "q" });
      if (move === null) return "snapback"; // illegal move
    }
  });

  document.getElementById("newPuzzle").addEventListener("click", loadPuzzle);
  document.getElementById("hintBtn").addEventListener("click", showHint);

  loadPuzzle();
};
