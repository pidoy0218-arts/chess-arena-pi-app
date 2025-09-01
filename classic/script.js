
// script.js
// Chess Arena Pi – Classic Mode with auto-detect multiplayer + fallback

// --- Dependencies ---
// Requires chess.js and chessboard.js via CDN in classic.html
// Example:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/chessboardjs/1.0.0/chessboard-1.0.0.min.js"></script>

let board = null;
let game = new Chess();
let socket = null;
let isOnline = false;
let playerColor = "white"; // default local player
let opponent = "Guest";
let player = "Guest";

// --- Detect Pi SDK login (placeholder) ---
function detectPiLogin() {
  try {
    if (window.Pi && window.Pi.authenticate) {
      // SDK available
      player = "Pioneer"; // replace with Pi username later
    }
  } catch (e) {
    player = "Guest";
  }
}

// --- Try to connect WebSocket ---
function initSocket() {
  try {
    socket = new WebSocket("wss://yourserver.example.com"); // replace with real server

    socket.onopen = () => {
      console.log("Connected to multiplayer server ✅");
      isOnline = true;
      socket.send(JSON.stringify({ type: "join", name: player }));
    };

    socket.onmessage = (msg) => {
      let data = JSON.parse(msg.data);
      if (data.type === "move") {
        game.move(data.move);
        board.position(game.fen());
        updateStatus();
      }
      if (data.type === "opponent") {
        opponent = data.name;
        updatePlayers();
      }
    };

    socket.onerror = () => {
      console.log("Socket error, falling back offline ❌");
      isOnline = false;
    };

    socket.onclose = () => {
      console.log("Socket closed, offline mode");
      isOnline = false;
    };
  } catch (e) {
    console.log("Socket init failed, offline fallback");
    isOnline = false;
  }
}

// --- UI Helpers ---
function updatePlayers() {
  document.getElementById("player-info").innerText =
    player + " vs " + opponent;
}

function updateStatus() {
  let status = "";
  let moveColor = game.turn() === "w" ? "White" : "Black";

  if (game.in_checkmate()) {
    status = "Game over, " + (moveColor === "White" ? "Black" : "White") + " wins!";
    showEndPopup(status);
  } else if (game.in_draw()) {
    status = "Game drawn!";
    showEndPopup(status);
  } else {
    status = moveColor + " to move";
    if (game.in_check()) {
      status += " (Check!)";
    }
  }

  document.getElementById("status").innerText = status;
}

function showEndPopup(msg) {
  alert(msg + "\nRematch?");
  // You can replace alert with a styled modal popup later
}

// --- Move Handling ---
function onDragStart(source, piece) {
  if (game.game_over()) return false;
  if (!isOnline) return true; // offline = hot-seat
  if ((game.turn() === "w" && playerColor !== "white") ||
      (game.turn() === "b" && playerColor !== "black")) {
    return false;
  }
}

function onDrop(source, target) {
  let move = game.move({
    from: source,
    to: target,
    promotion: "q" // auto promote to queen
  });

  if (move === null) return "snapback";

  updateStatus();

  if (isOnline && socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "move", move }));
  }
}

function onSnapEnd() {
  board.position(game.fen());
}

// --- Buttons ---
function resignGame() {
  showEndPopup(player + " resigns!");
}

function offerDraw() {
  showEndPopup("Draw offered – game ended");
}

// --- Init ---
function initGame() {
  detectPiLogin();
  initSocket();
  updatePlayers();

  let cfg = {
    draggable: true,
    position: "start",
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
  };
  board = Chessboard("board", cfg);

  updateStatus();
}

window.onload = initGame;
