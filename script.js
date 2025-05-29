document.addEventListener('DOMContentLoaded', () => {
    const chessboard = document.getElementById('chessboard');
    const turnIndicator = document.getElementById('turn-indicator');
    const promotionOverlay = document.getElementById('promotion-overlay'); let selectedSquare = null;
    let currentPlayer = 'white';
    let lastMove = null; // Track the last move for en passant
    let pendingPromotion = null; // Track pending pawn promotion
    let gameOver = false; // Track if the game has ended

    // Track castling rights
    let castlingRights = {
        white: { kingSide: true, queenSide: true },
        black: { kingSide: true, queenSide: true }
    };

    const pieces = {
        white: {
            king: '♔',
            queen: '♕',
            rook: '♖',
            bishop: '♗',
            knight: '♘',
            pawn: '♙'
        },
        black: {
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
        highlightKingInCheck(); // Highlight king if in check
    }

    function highlightKingInCheck() {
        document.querySelectorAll('.square.in-check').forEach(s => s.classList.remove('in-check'));
        const kingPos = findKing(currentPlayer);
        if (kingPos && isInCheck(currentPlayer)) {
            const kingSquare = document.querySelector(`[data-row="${kingPos.row}"][data-col="${kingPos.col}"]`);
            if (kingSquare) {
                kingSquare.classList.add('in-check');
            }
        }
    }

    // Clear all highlights
    function clearHighlights() {
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'valid-move', 'has-piece', 'en-passant', 'castle');
        });
    }

    // Check if a pawn move results in promotion
    function isPromotion(piece, fromRow, toRow) {
        if (piece.type !== 'pawn') return false;

        // White pawn reaches rank 0 (top) or black pawn reaches rank 7 (bottom)
        return (piece.color === 'white' && toRow === 0) ||
            (piece.color === 'black' && toRow === 7);
    }

    // Show promotion dialog
    function showPromotionDialog(color) {
        const promotionPieces = document.querySelectorAll('.promotion-piece');

        // Set the correct piece symbols for the color
        promotionPieces.forEach(pieceDiv => {
            const pieceType = pieceDiv.dataset.piece;
            pieceDiv.textContent = pieces[color][pieceType];
        });

        promotionOverlay.style.display = 'flex';
    }

    // Hide promotion dialog
    function hidePromotionDialog() {
        promotionOverlay.style.display = 'none';
    }

    // Complete pawn promotion
    function completePromotion(pieceType) {
        if (!pendingPromotion) return;

        const { toRow, toCol, piece } = pendingPromotion;

        // Replace the pawn with the chosen piece
        board[toRow][toCol] = {
            type: pieceType,
            color: piece.color
        };

        // Clear pending promotion
        pendingPromotion = null;
        hidePromotionDialog();
        // Switch turns
        currentPlayer = currentPlayer === 'white' ? 'black' : 'white';

        // Update turn indicator
        turnIndicator.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s Turn`;

        // Recreate the board display
        createBoard();

        // Check for stalemate or checkmate
        checkGameStatus();
    }


    // Helper functions for check detection
    function findKing(color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row: r, col: c };
                }
            }
        }
        return null; // Should not happen in a normal game
    }

    // Check if castling is possible
    function canCastle(color, side) {
        // Check if castling rights exist
        if (!castlingRights[color][side + 'Side']) {
            return false;
        }

        // King must not be in check
        if (isInCheck(color)) {
            return false;
        }

        const row = color === 'white' ? 7 : 0;

        if (side === 'king') {
            // King-side castling (short castling)
            // Check if squares between king and rook are empty
            if (board[row][5] !== null || board[row][6] !== null) {
                return false;
            }

            // Check if king passes through or ends up in check
            if (isSquareUnderAttack(row, 5, color === 'white' ? 'black' : 'white') ||
                isSquareUnderAttack(row, 6, color === 'white' ? 'black' : 'white')) {
                return false;
            }

            // Check if rook is in place
            const rook = board[row][7];
            return rook && rook.type === 'rook' && rook.color === color;
        } else {
            // Queen-side castling (long castling)
            // Check if squares between king and rook are empty
            if (board[row][1] !== null || board[row][2] !== null || board[row][3] !== null) {
                return false;
            }

            // Check if king passes through or ends up in check
            if (isSquareUnderAttack(row, 2, color === 'white' ? 'black' : 'white') ||
                isSquareUnderAttack(row, 3, color === 'white' ? 'black' : 'white')) {
                return false;
            }
            // Check if rook is in place
            const rook = board[row][0];
            return rook && rook.type === 'rook' && rook.color === color;
        }
    }

    // Update castling rights when pieces move
    function updateCastlingRights(piece, fromRow, fromCol) {
        const color = piece.color;

        // If king moves, lose all castling rights
        if (piece.type === 'king') {
            castlingRights[color].kingSide = false;
            castlingRights[color].queenSide = false;
        }

        // If rook moves from starting position, lose castling rights for that side
        if (piece.type === 'rook') {
            const homeRow = color === 'white' ? 7 : 0;
            if (fromRow === homeRow) {
                if (fromCol === 0) {
                    // Queen-side rook moved
                    castlingRights[color].queenSide = false;
                } else if (fromCol === 7) {
                    // King-side rook moved
                    castlingRights[color].kingSide = false;
                }
            }
        }
    }

    // Generates all possible moves for a piece based on its movement rules,
    // without considering if the move would leave the king in check.
    function getValidMovesRaw(row, col, piece) {
        const validMoves = [];
        const { type, color } = piece;

        switch (type) {
            case 'pawn':
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
                            // Check if the opponent's pawn is adjacent and on the same row as current pawn after its two-square move
                            if (Math.abs(col - lastMove.toCol) === 1 && lastMove.toRow === row) {
                                validMoves.push({ row: row + direction, col: lastMove.toCol, type: 'en-passant' });
                            }
                        }
                    }
                }
                break;
            case 'rook':
                const rookDirections = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                for (const [dr, dc] of rookDirections) {
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
            case 'bishop':
                const bishopDirections = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
                for (const [dr, dc] of bishopDirections) {
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
            case 'queen': // Corrected duplicate 'case queen:'
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
                break; case 'king':
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

                // Castling
                if (canCastle(color, 'king')) {
                    validMoves.push({ row: row, col: col + 2, type: 'castle-king' });
                }
                if (canCastle(color, 'queen')) {
                    validMoves.push({ row: row, col: col - 2, type: 'castle-queen' });
                }
                break;
            case 'knight':
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
    }

    function isSquareUnderAttack(targetRow, targetCol, attackingColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && piece.color === attackingColor) {
                    if (piece.type === 'pawn') {
                        const direction = piece.color === 'white' ? -1 : 1;
                        // Check diagonal pawn attacks
                        if ((r + direction === targetRow && c - 1 === targetCol) ||
                            (r + direction === targetRow && c + 1 === targetCol)) {
                            return true;
                        }
                    } else if (piece.type === 'king') {
                        // King moves (excluding castling to avoid infinite recursion)
                        const kingMoves = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
                        for (const [dr, dc] of kingMoves) {
                            const newRow = r + dr;
                            const newCol = c + dc;
                            if (newRow === targetRow && newCol === targetCol) {
                                return true;
                            }
                        }
                    } else {
                        // For other pieces, use their raw moves but exclude castling for kings
                        const moves = getValidMovesRawForAttackCheck(r, c, piece);
                        for (const move of moves) {
                            if (move.row === targetRow && move.col === targetCol) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    // Helper function to get moves for attack checking (no castling)
    function getValidMovesRawForAttackCheck(row, col, piece) {
        const validMoves = [];
        const { type, color } = piece;

        switch (type) {
            case 'rook':
                const rookDirections = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                for (const [dr, dc] of rookDirections) {
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
            case 'bishop':
                const bishopDirections = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
                for (const [dr, dc] of bishopDirections) {
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
            case 'queen':
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
                break;
            case 'knight':
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
    }

    function isInCheck(playerColor) {
        const kingPosition = findKing(playerColor);
        if (!kingPosition) return false;
        const opponentColor = playerColor === 'white' ? 'black' : 'white';
        return isSquareUnderAttack(kingPosition.row, kingPosition.col, opponentColor);
    } function moveLeavesKingInCheck(fromRow, fromCol, toRow, toCol) {
        const pieceToMove = board[fromRow][fromCol];
        if (!pieceToMove) return false;

        const originalPieceAtTarget = board[toRow][toCol];

        // Handle castling simulation
        let isCastling = false;
        let rookFromCol, rookToCol, originalRook = null;

        if (pieceToMove.type === 'king' && Math.abs(fromCol - toCol) === 2) {
            isCastling = true;
            if (toCol > fromCol) {
                // King-side castling
                rookFromCol = 7;
                rookToCol = 5;
            } else {
                // Queen-side castling
                rookFromCol = 0;
                rookToCol = 3;
            }
            originalRook = board[fromRow][rookFromCol];
        }

        board[toRow][toCol] = pieceToMove;
        board[fromRow][fromCol] = null;

        // Move rook for castling
        if (isCastling && originalRook) {
            board[fromRow][rookToCol] = originalRook;
            board[fromRow][rookFromCol] = null;
        }

        let enPassantCapturedPawn = null;
        let enPassantActualCaptureRow = -1, enPassantActualCaptureCol = -1;

        if (pieceToMove.type === 'pawn' && Math.abs(fromCol - toCol) === 1 && originalPieceAtTarget === null) {
            enPassantActualCaptureRow = fromRow;
            enPassantActualCaptureCol = toCol;
            if (board[enPassantActualCaptureRow] && board[enPassantActualCaptureRow][enPassantActualCaptureCol] &&
                board[enPassantActualCaptureRow][enPassantActualCaptureCol].type === 'pawn' &&
                board[enPassantActualCaptureRow][enPassantActualCaptureCol].color !== pieceToMove.color) {
                enPassantCapturedPawn = board[enPassantActualCaptureRow][enPassantActualCaptureCol];
                board[enPassantActualCaptureRow][enPassantActualCaptureCol] = null;
            }
        }

        const isKingInCheck = isInCheck(pieceToMove.color);

        // Restore board state
        board[fromRow][fromCol] = pieceToMove;
        board[toRow][toCol] = originalPieceAtTarget;

        // Restore rook for castling
        if (isCastling && originalRook) {
            board[fromRow][rookFromCol] = originalRook;
            board[fromRow][rookToCol] = null;
        }

        if (enPassantCapturedPawn) {
            board[enPassantActualCaptureRow][enPassantActualCaptureCol] = enPassantCapturedPawn;
        }

        return isKingInCheck;
    }


    // Get valid moves for a piece (filters out moves that leave king in check)
    function getValidMoves(row, col, piece) {
        const rawMoves = getValidMovesRaw(row, col, piece);
        const legalMoves = [];

        for (const move of rawMoves) {
            if (!moveLeavesKingInCheck(row, col, move.row, move.col)) {
                legalMoves.push(move);
            }
        }
        return legalMoves;
    }

    // Check if a player has any legal moves
    function hasLegalMoves(playerColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && piece.color === playerColor) {
                    const moves = getValidMoves(r, c, piece);
                    if (moves.length > 0) {
                        return true; // Found at least one legal move
                    }
                }
            }
        }
        return false; // No legal moves found
    }

    // Check for stalemate or checkmate
    function checkGameStatus() {
        if (gameOver) return true; // Game already ended

        const inCheck = isInCheck(currentPlayer);
        const hasLegalMovesAvailable = hasLegalMoves(currentPlayer);

        if (!hasLegalMovesAvailable) {
            gameOver = true; // Set game over flag
            if (inCheck) {
                // Checkmate
                const winner = currentPlayer === 'white' ? 'Black' : 'White';
                alert(`Checkmate! ${winner} wins!`);
                turnIndicator.textContent = `Game Over - ${winner} wins by checkmate!`;
            } else {
                // Stalemate
                alert('Stalemate! The game is a draw.');
                turnIndicator.textContent = 'Game Over - Stalemate (Draw)';
            }
            return true; // Game is over
        }
        return false; // Game continues
    }

    // Highlight valid moves
    function highlightValidMoves(validMoves) {
        validMoves.forEach((move) => {
            const { row, col, type } = move;
            const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            square.classList.add('valid-move');

            if (type === 'capture') {
                square.classList.add('has-piece');
            } else if (type === 'en-passant') {
                square.classList.add('en-passant');
            } else if (type === 'castle-king' || type === 'castle-queen') {
                square.classList.add('castle');
            }
        });
    }


    function movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = board[fromRow][fromCol];

        // Check if this is castling
        let isCastling = false;
        let rookFromCol, rookToCol;

        if (piece.type === 'king' && Math.abs(fromCol - toCol) === 2) {
            isCastling = true;
            if (toCol > fromCol) {
                // King-side castling
                rookFromCol = 7;
                rookToCol = 5;
            } else {
                // Queen-side castling
                rookFromCol = 0;
                rookToCol = 3;
            }
        }

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

        // Handle castling - move the rook
        if (isCastling) {
            const rook = board[fromRow][rookFromCol];
            board[fromRow][rookToCol] = rook;
            board[fromRow][rookFromCol] = null;
        }

        // Update castling rights
        updateCastlingRights(piece, fromRow, fromCol);

        // Check for pawn promotion
        if (isPromotion(piece, fromRow, toRow)) {
            // Store promotion data and show dialog
            pendingPromotion = {
                fromRow: fromRow,
                fromCol: fromCol,
                toRow: toRow,
                toCol: toCol,
                piece: piece,
                isEnPassant: isEnPassant,
                isCastling: isCastling
            };

            showPromotionDialog(piece.color);
            return; // Don't continue with turn switching until promotion is complete
        }

        // Record the move for en passant tracking
        lastMove = {
            piece: piece,
            fromRow: fromRow,
            fromCol: fromCol,
            toRow: toRow,
            toCol: toCol,
            isEnPassant: isEnPassant,
            isCastling: isCastling
        };

        // Switch turns
        currentPlayer = currentPlayer === 'white' ? 'black' : 'white';

        // Update turn indicator
        turnIndicator.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s Turn`;

        // Recreate the board display
        createBoard();

        // Check for stalemate or checkmate
        checkGameStatus();
    }
    
    
    // Handle square clicks
    chessboard.addEventListener('click', (e) => {
        // Prevent moves if game is over
        if (gameOver) return;

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
    
    
    // Add event listeners for promotion dialog
    document.querySelectorAll('.promotion-piece').forEach(pieceDiv => {
        pieceDiv.addEventListener('click', () => {
            const pieceType = pieceDiv.dataset.piece;
            completePromotion(pieceType);
        });
    });

    // Initialize the board
    createBoard();
});
