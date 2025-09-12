// server.js
const WebSocket = require('ws');

const PORT = 3000;
const wss = new WebSocket.Server({ port: PORT });

let rooms = {}; // { roomId: [player1, player2] }

function generateRoomId() {
  return Math.random().toString(36).substr(2, 6);
}

wss.on('connection', (ws) => {
  console.log('New player connected');

  // Assign player to a room
  let assigned = false;
  for (const roomId in rooms) {
    if (rooms[roomId].length < 2) {
      rooms[roomId].push(ws);
      ws.roomId = roomId;
      assigned = true;
      break;
    }
  }
  if (!assigned) {
    const roomId = generateRoomId();
    rooms[roomId] = [ws];
    ws.roomId = roomId;
  }

  console.log(`Player assigned to room ${ws.roomId}`);

  ws.on('message', (message) => {
    // Forward message to the other player in the same room
    const room = rooms[ws.roomId];
    if (!room) return;

    room.forEach((player) => {
      if (player !== ws && player.readyState === WebSocket.OPEN) {
        player.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Player disconnected');
    // Remove player from room
    const room = rooms[ws.roomId];
    if (room) {
      rooms[ws.roomId] = room.filter((p) => p !== ws);
      if (rooms[ws.roomId].length === 0) delete rooms[ws.roomId];
    }
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
