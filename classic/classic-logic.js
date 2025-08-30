const boardEl = document.getElementById("chessBoard");
const moveSound = document.getElementById("moveSound");
const winSound = document.getElementById("winSound");
const loseSound = document.getElementById("loseSound");
const capturedWhiteEl = document.getElementById("captured-white");
const capturedBlackEl = document.getElementById("captured-black");

const initialBoard = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
  ["♟", "♟", "♟", "♟", "♟", "♟", "♟", "♟"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"],
  ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"]
];

let selected = null;
let currentTurn = "white";
let capturedWhite = [];
let capturedBlack = [];

function renderBoard() {
  boardEl.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.className = "square " + ((row + col) % 2 === 0 ? "white" : "black");
      square.dataset.row = row;
      square.dataset.col = col;
      square.textContent = initialBoard[row][col];
      square.addEventListener("click", handleSquareClick);
      boardEl.appendChild(square);
    }
  }
  updateCaptured();
}

function handleSquareClick(e) {
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  const piece = initialBoard[row][col];

  if (selected) {
    const [selRow, selCol] = selected;

    if (selRow === row && selCol === col) {
      selected = null;
      return;
    }

    const target = initialBoard[row][col];
    if (target) {
      if ((currentTurn === "white" && isBlackPiece(target)) ||
          (currentTurn === "black" && isWhitePiece(target))) {
        // Capture
        if (currentTurn === "white") {
          capturedWhite.push(target);
        } else {
          capturedBlack.push(target);
        }
        moveSound.play();
      } else {
        return;
      }
    } else {
      moveSound.play();
    }

    initialBoard[row][col] = initialBoard[selRow][selCol];
    initialBoard[selRow][selCol] = "";
    selected = null;
    currentTurn = currentTurn === "white" ? "black" : "white";
    renderBoard();
  } else {
    if ((currentTurn === "white" && isWhitePiece(piece)) ||
        (currentTurn === "black" && isBlackPiece(piece))) {
      selected = [row, col];
    }
  }
}

function isWhitePiece(piece) {
  return "♙♖♘♗♕♔".includes(piece);
}

function isBlackPiece(piece) {
  return "♟♜♞♝♛♚".includes(piece);
}

function updateCaptured() {
  capturedWhiteEl.textContent = "Captured by White: " + capturedWhite.join(" ");
  capturedBlackEl.textContent = "Captured by Black: " + capturedBlack.join(" ");
}

renderBoard();
