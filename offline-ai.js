// offline-ai.js
// Lightweight minimax AI fallback for Chess Arena Pi (offline mode)

// Piece values for simple evaluation
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Starting FEN-like board (simplified representation)
function initBoard() {
  // 8x8 array, lowercase = black, uppercase = white
  // Standard starting position
  return [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    ['.','.','.','.','.','.','.','.'],
    ['.','.','.','.','.','.','.','.'],
    ['.','.','.','.','.','.','.','.'],
    ['.','.','.','.','.','.','.','.'],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R'],
  ];
}

// Deep copy board
function cloneBoard(b) {
  return b.map(row => row.slice());
}

// Simple evaluation: material count
function evaluateBoard(board) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p === '.' ) continue;
      const value = PIECE_VALUES[p.toLowerCase()] || 0;
      score += (p === p.toUpperCase() ? 1 : -1) * value;
    }
  }
  return score;
}

// Generate pseudo-legal moves (very simplified, no castling/en passant)
// Only handles basic movement and captures, ignores checks for speed
function generateMoves(board, whiteToMove) {
  const moves = [];
  const dirs = {
    p: [[1,0]], // black pawn (down)
    P: [[-1,0]], // white pawn (up)
    n: [
      [2,1],[1,2],[-1,2],[-2,1],
      [-2,-1],[-1,-2],[1,-2],[2,-1]
    ],
    b: [[1,1],[1,-1],[-1,1],[-1,-1]],
    r: [[1,0],[-1,0],[0,1],[0,-1]],
    q: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],
    k: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],
  };

  function onBoard(r,c){ return r>=0&&r<8&&c>=0&&c<8; }
  for (let r=0;r<8;r++){
    for (let c=0;c<8;c++){
      const piece = board[r][c];
      if (piece === '.') continue;
      const isWhite = piece === piece.toUpperCase();
      if (whiteToMove !== isWhite) continue;
      const key = piece.toLowerCase();
      if (key === 'p') {
        const dir = isWhite ? -1 : 1;
        const nr = r + dir;
        if (onBoard(nr,c) && board[nr][c] === '.') {
          moves.push({ from:[r,c], to:[nr,c] });
        }
        // captures
        for (const dc of [-1,1]) {
          const nc = c + dc;
          if (onBoard(nr,nc)) {
            const target = board[nr][nc];
            if (target !== '.' && (target === target.toLowerCase() ? isWhite : !isWhite)) {
              moves.push({ from:[r,c], to:[nr,nc] });
            }
          }
        }
      } else if (key === 'n' || key === 'k') {
        for (const [dr,dc] of dirs[key]) {
          const nr = r + dr, nc = c + dc;
          if (!onBoard(nr,nc)) continue;
          const target = board[nr][nc];
          if (target === '.' || (target === target.toLowerCase() ? isWhite : !isWhite)) {
            moves.push({ from:[r,c], to:[nr,nc] });
          }
        }
      } else if (['b','r','q'].includes(key)) {
        for (const [dr,dc] of dirs[key]) {
          let nr = r + dr, nc = c + dc;
          while (onBoard(nr,nc)) {
            const target = board[nr][nc];
            if (target === '.') {
              moves.push({ from:[r,c], to:[nr,nc] });
            } else {
              if ((target === target.toLowerCase() ? isWhite : !isWhite)) {
                moves.push({ from:[r,c], to:[nr,nc] });
              }
              break;
            }
            nr += dr; nc += dc;
          }
        }
      }
    }
  }
  return moves;
}

// Apply move, returns new board
function applyMove(board, move) {
  const b2 = cloneBoard(board);
  const [fr,fc] = move.from;
  const [tr,tc] = move.to;
  b2[tr][tc] = b2[fr][fc];
  b2[fr][fc] = '.';
  return b2;
}

// Minimax with alpha-beta and simple depth limit
function minimax(board, depth, alpha, beta, whiteToMove) {
  if (depth === 0) {
    return evaluateBoard(board);
  }
  const moves = generateMoves(board, whiteToMove);
  if (moves.length === 0) {
    // checkmate or stalemate (not distinguished)
    return evaluateBoard(board);
  }
  if (whiteToMove) {
    let maxEval = -Infinity;
    for (const m of moves) {
      const newBoard = applyMove(board, m);
      const eval = minimax(newBoard, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const m of moves) {
      const newBoard = applyMove(board, m);
      const eval = minimax(newBoard, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, eval);
      beta = Math.min(beta, eval);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// Pick best move with time/depth cap
function pickBestMove(board, whiteToMove, maxDepth, timeLimitMs = 800) {
  const start = performance.now();
  let best = null;
  let bestScore = whiteToMove ? -Infinity : Infinity;

  const moves = generateMoves(board, whiteToMove);
  for (const m of moves) {
    if (performance.now() - start > timeLimitMs) break;
    const candidate = applyMove(board, m);
    const score = minimax(candidate, maxDepth - 1, -Infinity, Infinity, !whiteToMove);
    if (whiteToMove) {
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        best = m;
      }
    }
  }
  return best;
}

// Simple algebraic conversion for UI (e.g., "e2e4")
function coordToAlgebraic([r,c]) {
  const file = 'abcdefgh'[c];
  const rank = 8 - r;
  return file + rank;
}
function moveToString(m) {
  return coordToAlgebraic(m.from) + coordToAlgebraic(m.to);
}

// Offline rating persistence (simple Elo-like)
function loadOfflineRating() {
  const raw = localStorage.getItem('offlineRating');
  if (raw) {
    try { return JSON.parse(raw); } catch {}
  }
  return { rating: 1200, games: 0 };
}
function saveOfflineRating(ratingObj) {
  localStorage.setItem('offlineRating', JSON.stringify(ratingObj));
}

// Public API
window.OfflineAI = {
  startNewGame: function(onUpdateBoard, onAIMove, options = {}) {
    // options: { difficulty: 1..4, white: true/false }
    const depthMap = {1: 1, 2: 2, 3: 3, 4: 4};
    const depth = depthMap[options.difficulty] || 2;
    let board = initBoard();
    let whiteToMove = true; // white starts
    const userIsWhite = options.white !== false; // default true

    // callback to refresh UI
    onUpdateBoard(board, whiteToMove);

    // wrapper to make AI move
    async function makeAIMove() {
      const aiIsWhite = !userIsWhite;
      if (whiteToMove === aiIsWhite) {
        const best = pickBestMove(board, whiteToMove, depth);
        if (best) {
          board = applyMove(board, best);
          whiteToMove = !whiteToMove;
          onAIMove(moveToString(best), board, whiteToMove);
        }
      }
    }

    // Expose a function to make a user move; returns true if legal
    return {
      boardState: () => cloneBoard(board),
      userMove: function(moveStr) {
        // expecting something like "e2e4"
        if (moveStr.length !== 4) return false;
        const fileToCol = f => 'abcdefgh'.indexOf(f);
        const rankToRow = r => 8 - parseInt(r);
        const from = [rankToRow(moveStr[1]), fileToCol(moveStr[0])];
        const to = [rankToRow(moveStr[3]), fileToCol(moveStr[2])];
        const legal = generateMoves(board, whiteToMove).some(m =>
          m.from[0] === from[0] && m.from[1] === from[1] &&
          m.to[0] === to[0] && m.to[1] === to[1]
        );
        if (!legal) return false;
        board = applyMove(board, {from, to});
        whiteToMove = !whiteToMove;
        return true;
      },
      aiRespond: async function() {
        await makeAIMove();
      },
      getRating: function() {
        return loadOfflineRating();
      },
      recordResult: function(didUserWin) {
        const r = loadOfflineRating();
        // simple Elo update against fixed opponent rating 1200
        const expected = 1 / (1 + Math.pow(10, (1200 - r.rating) / 400));
        const score = didUserWin ? 1 : 0;
        const k = 20;
        r.rating = Math.round(r.rating + k * (score - expected));
        r.games += 1;
        saveOfflineRating(r);
      }
    };
  }
};
