<script>
/* AI Opponent with 3 Levels */
function aiMove(level = 1) {
  let moves = game.moves({ verbose: true });
  if (moves.length === 0) return;

  let move;
  if (level === 1) {
    // Level 1: Pure random
    move = moves[Math.floor(Math.random() * moves.length)];
  } 
  else if (level === 2) {
    // Level 2: 70% random, 30% best capture
    if (Math.random() < 0.7) {
      move = moves[Math.floor(Math.random() * moves.length)];
    } else {
      move = moves.find(m => m.flags.includes("c")) || 
             moves[Math.floor(Math.random() * moves.length)];
    }
  } 
  else if (level === 3) {
    // Level 3: Greedy — prefers captures / checks
    move = moves.find(m => m.flags.includes("c")) || // capture
           moves.find(m => m.san.includes("+")) ||   // check
           moves[Math.floor(Math.random() * moves.length)];
  }

  game.move(move);
  board.position(game.fen());

  // Sound + checkmate detection
  if (game.in_checkmate()) {
    setTimeout(() => alert("AI wins!"), 300);
  } else if (game.in_check()) {
    SND.play("check");
  } else {
    SND.play("move");
  }
}

// Example: call aiMove(1), aiMove(2), or aiMove(3) after player's move
