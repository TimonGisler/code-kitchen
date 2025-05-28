document.addEventListener('DOMContentLoaded', () => {
    const chessboard = document.getElementById('chessboard');
    const turnIndicator = document.getElementById('turn-indicator');
    let selectedSquare = null;
    let currentPlayer = 'white';
    let lastMove = null; // Track the last move for en passant
    
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

    // Board state - keeps track of pieces
    const board = [
        [{ type: 'rook', color: 'black' }, { type: 'knight', color: 'black' }, { type: 'bishop', color: 'black' }, { type: 'queen', color: 'black' }, { type: 'king', color: 'black' }, { type: 'bishop', color: 'black' }, { type: 'knight', color: 'black' }, { type: 'rook', color: 'black' }],
        [{ type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [{ type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }],
        [{ type: 'rook', color: 'white' }, { type: 'knight', color: 'white' }, { type: 'bishop', color: 'white' }, { type: 'queen', color: 'white' }, { type: 'king', color: 'white' }, { type: 'bishop', color: 'white' }, { type: 'knight', color: 'white' }, { type: 'rook', color: 'white' }]
    ];

    // Create the chessboard
    function createBoard() {
        chessboard.innerHTML = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                square.dataset.row = row;
                square.dataset.col = col;

                // Add pieces
                const piece = board[row][col];
                if (piece) {
                    square.innerHTML = `<span class="piece">${pieces[piece.color][piece.type]}</span>`;
                    square.dataset.pieceColor = piece.color;
                    square.dataset.pieceType = piece.type;
                }

                chessboard.appendChild(square);
            }
        }
    }    // Clear all highlights
    function clearHighlights() {
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'valid-move', 'has-piece', 'en-passant');
        });
    }// Get valid moves for a piece (simplified rules)
    function getValidMoves(row, col, piece) {
        const validMoves = [];
        const { type, color } = piece;

        switch (type) {case 'pawn':
                const direction = color === 'white' ? -1 : 1;
                const startRow = color === 'white' ? 6 : 1;
                  // Move forward one square
                if (row + direction >= 0 && row + direction < 8 && !board[row + direction][col]) {
                    validMoves.push({ row: row + direction, col: col, type: 'normal' });
                    
                    // Move forward two squares from starting position
                    if (row === startRow && !board[row + 2 * direction][col]) {
                        validMoves.push({ row: row + 2 * direction, col: col, type: 'normal' });
                    }
                }
                
                // Capture diagonally
                for (const dc of [-1, 1]) {
                    if (col + dc >= 0 && col + dc < 8 && row + direction >= 0 && row + direction < 8) {
                        const targetPiece = board[row + direction][col + dc];
                        if (targetPiece && targetPiece.color !== color) {
                            validMoves.push({ row: row + direction, col: col + dc, type: 'capture' });
                        }
                    }
                }
                  // En passant
                if (lastMove && lastMove.piece.type === 'pawn' && lastMove.piece.color !== color) {
                    // Check if the last move was a two-square pawn move
                    if (Math.abs(lastMove.fromRow - lastMove.toRow) === 2) {
                        // Check if we're on the correct rank for en passant
                        const enPassantRank = color === 'white' ? 3 : 4;
                        if (row === enPassantRank) {
                            // Check if the opponent's pawn is adjacent
                            if (Math.abs(col - lastMove.toCol) === 1 && lastMove.toRow === row) {
                                // Add en passant capture move
                                validMoves.push({ row: row + direction, col: lastMove.toCol, type: 'en-passant' });
                            }
                        }
                    }
                }
                break;            case 'rook':
                // Horizontal and vertical moves
                const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                for (const [dr, dc] of directions) {
                    for (let i = 1; i < 8; i++) {
                        const newRow = row + dr * i;
                        const newCol = col + dc * i;
                        if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
                        
                        const targetPiece = board[newRow][newCol];
                        if (!targetPiece) {
                            validMoves.push({ row: newRow, col: newCol, type: 'normal' });
                        } else {
                            if (targetPiece.color !== color) {
                                validMoves.push({ row: newRow, col: newCol, type: 'capture' });
                            }
                            break;
                        }
                    }
                }
                break;            case 'bishop':
                // Diagonal moves
                const diagonalDirections = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
                for (const [dr, dc] of diagonalDirections) {
                    for (let i = 1; i < 8; i++) {
                        const newRow = row + dr * i;
                        const newCol = col + dc * i;
                        if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
                        
                        const targetPiece = board[newRow][newCol];
                        if (!targetPiece) {
                            validMoves.push({ row: newRow, col: newCol, type: 'normal' });
                        } else {
                            if (targetPiece.color !== color) {
                                validMoves.push({ row: newRow, col: newCol, type: 'capture' });
                            }
                            break;
                        }
                    }
                }
                break;

            case 'queen':            case 'queen':
                // Combination of rook and bishop moves
                const queenDirections = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
                for (const [dr, dc] of queenDirections) {
                    for (let i = 1; i < 8; i++) {
                        const newRow = row + dr * i;
                        const newCol = col + dc * i;
                        if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
                        
                        const targetPiece = board[newRow][newCol];
                        if (!targetPiece) {
                            validMoves.push({ row: newRow, col: newCol, type: 'normal' });
                        } else {
                            if (targetPiece.color !== color) {
                                validMoves.push({ row: newRow, col: newCol, type: 'capture' });
                            }
                            break;
                        }
                    }
                }
                break;            case 'king':
                // One square in any direction
                const kingMoves = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
                for (const [dr, dc] of kingMoves) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        const targetPiece = board[newRow][newCol];
                        if (!targetPiece) {
                            validMoves.push({ row: newRow, col: newCol, type: 'normal' });
                        } else if (targetPiece.color !== color) {
                            validMoves.push({ row: newRow, col: newCol, type: 'capture' });
                        }
                    }
                }
                break;            case 'knight':
                // L-shaped moves
                const knightMoves = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];
                for (const [dr, dc] of knightMoves) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        const targetPiece = board[newRow][newCol];
                        if (!targetPiece) {
                            validMoves.push({ row: newRow, col: newCol, type: 'normal' });
                        } else if (targetPiece.color !== color) {
                            validMoves.push({ row: newRow, col: newCol, type: 'capture' });
                        }
                    }
                }
                break;
        }

        return validMoves;
    }    // Highlight valid moves
    function highlightValidMoves(validMoves) {
        validMoves.forEach((move) => {
            const { row, col, type } = move;
            const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            square.classList.add('valid-move');
            
            if (type === 'capture') {
                square.classList.add('has-piece');
            } else if (type === 'en-passant') {
                square.classList.add('en-passant');
            }
        });
    }
    
    function movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = board[fromRow][fromCol];
        
        // Check if this is an en passant capture
        let isEnPassant = false;
        if (piece.type === 'pawn' && Math.abs(fromCol - toCol) === 1 && !board[toRow][toCol]) {
            // This is an en passant capture
            isEnPassant = true;
            // Remove the captured pawn
            board[fromRow][toCol] = null;
        }
        
        // Make the move
        board[toRow][toCol] = piece;
        board[fromRow][fromCol] = null;
        
        // Record the move for en passant tracking
        lastMove = {
            piece: piece,
            fromRow: fromRow,
            fromCol: fromCol,
            toRow: toRow,
            toCol: toCol,
            isEnPassant: isEnPassant
        };
        
        // Switch turns
        currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
        
        // Update turn indicator
        turnIndicator.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s Turn`;
        
        // Recreate the board display
        createBoard();
    }

    // Handle square clicks
    chessboard.addEventListener('click', (e) => {
        const square = e.target.closest('.square');
        if (!square) return;

        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        const piece = board[row][col];

        // If clicking on a valid move square
        if (square.classList.contains('valid-move')) {
            if (selectedSquare) {
                const fromRow = parseInt(selectedSquare.dataset.row);
                const fromCol = parseInt(selectedSquare.dataset.col);
                movePiece(fromRow, fromCol, row, col);
                selectedSquare = null;
                clearHighlights();
            }
            return;
        }

        // Clear previous selection
        clearHighlights();

        // If clicking on a piece of the current player
        if (piece && piece.color === currentPlayer) {
            selectedSquare = square;
            square.classList.add('selected');
            
            const validMoves = getValidMoves(row, col, piece);
            highlightValidMoves(validMoves);
        } else {
            selectedSquare = null;
        }
    });

    // Initialize the board
    createBoard();
});
