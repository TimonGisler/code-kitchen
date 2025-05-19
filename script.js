document.addEventListener('DOMContentLoaded', () => {
    const chessboard = document.getElementById('chessboard');
    const pieces = {
        black: {
            king: '♔',
            queen: '♕',
            rook: '♖',
            bishop: '♗',
            knight: '♘',
            pawn: '♙'
        },
        white: {
            king: '♚',
            queen: '♛',
            rook: '♜',
            bishop: '♝',
            knight: '♞',
            pawn: '♟'
        }
    };

    // Initial piece positions
    const initialBoard = [
        ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'],
        ['pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'],
        Array(8).fill(null),
        Array(8).fill(null),
        Array(8).fill(null),
        Array(8).fill(null),
        ['pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'],
        ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
    ];

    // Create the chessboard
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
            square.dataset.row = row;
            square.dataset.col = col;

            // Add pieces
            const piece = initialBoard[row][col];
            if (piece) {
                const color = row < 2 ? 'black' : 'white';
                square.innerHTML = `<span class="piece">${pieces[color][piece]}</span>`;
            }

            chessboard.appendChild(square);
        }
    }

    // Add click event listener for squares
    chessboard.addEventListener('click', (e) => {
        const square = e.target.closest('.square');
        if (square) {
            // Remove any previous selections
            document.querySelectorAll('.square').forEach(sq => 
                sq.style.backgroundColor = '');

            // Highlight selected square
            if (square.style.backgroundColor === '') {
                const isWhite = square.classList.contains('white');
                square.style.backgroundColor = isWhite ? '#f7ec5e' : '#c4a145';
            }
        }
    });
});
