let board = null;
let game = new Chess();
let currentTimer = 30;
let interval = null;
let currentTurn = 'w';

function startTimer() {
  clearInterval(interval);
  currentTimer = 30;
  updateTimerDisplay();

  interval = setInterval(() => {
    currentTimer--;
    updateTimerDisplay();
    if (currentTimer <= 0) {
      clearInterval(interval);
      document.getElementById("status").innerText = 
        (currentTurn === 'w' ? "White" : "Black") + " lost on time!";
    }
  }, 1000);
}

function updateTimerDisplay() {
  document.getElementById("timerWhite").innerText = "White: " + (currentTurn === 'w' ? currentTimer : "⏳");
  document.getElementById("timerBlack").innerText = "Black: " + (currentTurn === 'b' ? currentTimer : "⏳");
}

function onDrop(source, target) {
  let move = game.move({ from: source, to: target, promotion: 'q' });

  if (move === null) return 'snapback';

  currentTurn = game.turn();
  startTimer();

  document.getElementById("status").innerText = game.in_checkmate() ? "Checkmate!" : 
    game.in_draw() ? "Draw!" : 
    (currentTurn === 'w' ? "White's Move" : "Black's Move");
}

function onSnapEnd() {
  board.position(game.fen());
}

function resetQuickGame() {
  game.reset();
  board.start();
  currentTurn = 'w';
  startTimer();
}

board = Chessboard('board', {
  draggable: true,
  position: 'start',
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
});

resetQuickGame();
