/*
  Simple Chess AI Logic
  This file contains the "brain" of the AI.
*/

// The main function that the game will call to get the AI's move.
// It takes a list of all legal moves and returns one.
function getAIMove(legalMoves) {
  // If there are no legal moves, return null.
  if (!legalMoves || legalMoves.length === 0) {
    return null;
  }

  // --- AI Strategy ---
  // For now, the strategy is very simple: pick a random move.
  // This can be expanded in the future to be much smarter.

  const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];

  console.log("AI has chosen a move:", randomMove);

  return randomMove;
}
