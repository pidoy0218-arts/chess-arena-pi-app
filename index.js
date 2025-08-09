const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { Chess } = require('chess.js');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory store (prototype)
const games = new Map();

// Helper to create a new game
function createNewGame(white, black, wager = 0) {
  const gameId = uuidv4();
  // initial position
  const chess = new Chess();
  const game = {
    id: gameId,
    fen: chess.fen(),
    pgn: '', // will fill after moves
    players: { white, black },
    turn: 'w',
    status: 'ongoing',
    wager
  };
  // store the current fen; we won't store the Chess instance to keep it serializable
  games.set(gameId, game);
  return game;
}

// Create a new game
app.post('/games', (req, res) => {
  const { white, black, wager } = req.body;
  const game = createNewGame(white, black, wager);
  res.json(game);
});

// Get game state
app.get('/games/:id', (req, res) => {
  const id = req.params.id;
  const game = games.get(id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json({ id: game.id, fen: game.fen, pgn: game.pgn, players: game.players, turn: game.turn, status: game.status, wager: game.wager });
});

// Submit a move
app.post('/games/:id/move', (req, res) => {
  const id = req.params.id;
  const { from, to, promotion } = req.body;
  const game = games.get(id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  // Validate move using Chess with the current FEN
  const chess = new Chess(game.fen);
  const move = chess.move({ from, to, promotion: promotion || 'q' });

  if (!move) {
    return res.status(400).json({ error: 'Illegal move' });
  }

  // Update state
  game.fen = chess.fen();
  game.pgn = chess.pgn();
  if (chess.in_checkmate()) game.status = 'checkmate';
  else if (chess.in_draw()) game.status = 'draw';
  else game.status = 'ongoing';
  game.turn = chess.turn() === 'w' ? 'w' : 'b';

  res.json({ fen: game.fen, pgn: game.pgn, status: game.status, turn: game.turn });
});

// Basic root endpoint
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Pi Chess API' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
