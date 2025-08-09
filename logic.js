
// Initialize the board
const board = document.querySelector('.chess-board');

// Function to create a square
function createSquare(color, piece = null) {
    const square = document.createElement('div');
    square.classList.add('square');
    if (color === 'light') {
        square.classList.add('light');
    } else {
        square.classList.add('dark');
    }
    if (piece) {
        const pieceElement = document.createElement('div');
        pieceElement.classList.add('piece');
        if (piece.color === 'white') {
            pieceElement.classList.add('white');
        } else {
            pieceElement.classList.add('black');
        }
        pieceElement.textContent = piece.symbol;
        square.appendChild(pieceElement);
    }
    return square;
}

// Function to initialize the board
function initBoard() {
    const pieces = [
        // White pieces
        { symbol: '&#9812;', color: 'white' }, // King
        { symbol: '&#9813;', color: 'white' }, // Queen
        { symbol: '&#9814;', color: 'white' }, // Rook
        { symbol: '&#9814;', color: 'white' }, // Rook
        { symbol: '&#9815;', color: 'white' }, // Bishop
        { symbol: '&#9815;', color: 'white' }, // Bishop
        { symbol: '&#9816;', color: 'white' }, // Knight
        { symbol: '&#9816;', color: 'white' }, // Knight
        { symbol: '&#9817;', color: 'white' }, // Pawn
        { symbol: '&#9817;', color: 'white' }, // Pawn
        { symbol: '&#9817;', color: 'white' }, // Pawn
        { symbol: '&#9817;', color: 'white' }, // Pawn
        { symbol: '&#9817;', color: 'white' }, // Pawn
        { symbol: '&#9817;', color: 'white' }, // Pawn
        { symbol: '&#9817;', color: 'white' }, // Pawn
        { symbol: '&#9817;', color: 'white' }, // Pawn
        // Black pieces
        { symbol: '&#9818;', color: 'black' }, // King
        { symbol: '&#9819;', color: 'black' }, // Queen
        { symbol: '&#9820;', color: 'black' }, // Rook
        { symbol: '&#9820;', color: 'black' }, // Rook
        { symbol: '&#9821;', color: 'black' }, // Bishop
        { symbol: '&#9821;', color: 'black' }, // Bishop
        { symbol: '&#9822;', color: 'black' }, // Knight
        { symbol: '&#9822;', color: 'black' }, // Knight
        { symbol: '&#9823;', color: 'black' }, // Pawn
