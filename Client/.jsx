import axios from 'axios';
import Chessboard from 'react-chessboard'; // or any board component you prefer
import { Chess } from 'chess.js';

const API_BASE = 'http://localhost:3001';

function App() {
  const [gameId, setGameId] = useState(null);
  const [fen, setFen] = useState('start');
  const [turn, setTurn] = useState('w');
  const [status, setStatus] = useState('ongoing');
  const [isPiConnected, setPiConnected] = useState(false);

  // Create a new game
  async function createGame() {
    const resp = await axios.post(`${API_BASE}/games`, { white: 'player1', black: 'player2', wager: 0 });
    setGameId(resp.data.id);
    setFen(resp.data.fen);
    setTurn(resp.data.turn);
    setStatus(resp.data.status);
  }

  // Submit a move to the server
  async function handleMove(from, to, promotion) {
    if (!gameId) return;
    try {
      const res = await axios.post(`${API_BASE}/games/${gameId}/move`, { from, to, promotion });
      setFen(res.data.fen);
      setTurn(res.data.turn);
      setStatus(res.data.status);
    } catch (e) {
      console.error('Move failed', e.response?.data?.error || e.message);
      // optionally show a user-friendly message
    }
  }

  // Local validation helper (optional)
  function onDrop(sourceSquare, targetSquare, piece) {
    // Basic guard: ignore if it's not player's turn, etc. For simplicity, allow any move
    // Use a local Chess instance to validate
    const chess = new Chess(fen === 'start' ? undefined : fen);
    const move = chess.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    if (move === null) return false;
    // If valid, push to server
    handleMove(sourceSquare, targetSquare, 'q');
    return true;
  }

  // Pi connect stub
  function connectPi() {
    // TODO: integrate with Pi SDK/APIs when available
    setPiConnected(true);
  }

  useEffect(() => {
    // initialize a game on first load (optional)
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Pi Chess App (Prototype)</h1>
      <div style={{ marginBottom: 12 }}>
        <button onClick={createGame}>New Game</button>
        <button onClick={connectPi} style={{ marginLeft: 8 }}>
          {isPiConnected ? 'Pi Connected' : 'Connect Pi'}
        </button>
        <span style={{ marginLeft: 12 }}>Status: {status}</span>
      </div>

      <div style={{ display: 'flex' }}>
        <div style={{ width: 520 }}>
          <Chessboard id="chess-board" width={500} position={fen === 'start' ? 'start' : fen} onPieceDrop={onDrop} />
        </div>
        <div style={{ marginLeft: 20 }}>
          <h3>Game Info</h3>
          <p>Game ID: {gameId ?? '—'}</p>
          <p>Turn: {turn}</p>
          <p>Players: White (you) vs Black</p>
          <p>Wager: {0} Pi (placeholder)</p>
        </div>
      </div>
    </div>
  );
}

export default App;
