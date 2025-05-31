class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    describe(suiteName, callback) {
        console.log(`\n=== ${suiteName} ===`);
        callback();
    }

    it(description, testFunction) {
        try {
            testFunction();
            this.passed++;
            console.log(`✓ ${description}`);
        } catch (error) {
            this.failed++;
            console.log(`✗ ${description}`);
            console.log(`  Error: ${error.message}`);
        }
    }

    assertEqual(actual, expected, message = '') {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}. ${message}`);
        }
    }

    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`Expected true, but got false. ${message}`);
        }
    }

    assertFalse(condition, message = '') {
        if (condition) {
            throw new Error(`Expected false, but got true. ${message}`);
        }
    }

    run() {
        console.log(`\n=== Test Results ===`);
        console.log(`Passed: ${this.passed}`);
        console.log(`Failed: ${this.failed}`);
        console.log(`Total: ${this.passed + this.failed}`);
        
        if (this.failed === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('❌ Some tests failed.');
        }
    }
}

class ChessEngine {

    constructor() {
        this.reset();
    }    
    
    reset() {
        this.currentPlayer = 'white';
        this.lastMove = null;
        this.gameOver = false;
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        
        // Standard chess starting position
        this.board = [
            [{ type: 'rook', color: 'black' }, { type: 'knight', color: 'black' }, { type: 'bishop', color: 'black' }, { type: 'queen', color: 'black' }, { type: 'king', color: 'black' }, { type: 'bishop', color: 'black' }, { type: 'knight', color: 'black' }, { type: 'rook', color: 'black' }],
            [{ type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [{ type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }],
            [{ type: 'rook', color: 'white' }, { type: 'knight', color: 'white' }, { type: 'bishop', color: 'white' }, { type: 'queen', color: 'white' }, { type: 'king', color: 'white' }, { type: 'bishop', color: 'white' }, { type: 'knight', color: 'white' }, { type: 'rook', color: 'white' }]
        ];
    }

    clearBoard() {
        this.currentPlayer = 'white';
        this.lastMove = null;
        this.gameOver = false;
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        
        // Empty board
        this.board = [
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null]
        ];
    }

    findKing(color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row: r, col: c };
                }
            }
        }
        return null;
    }

    isPromotion(piece, fromRow, toRow) {
        if (piece.type !== 'pawn') return false;
        return (piece.color === 'white' && toRow === 0) ||
               (piece.color === 'black' && toRow === 7);
    }

    updateCastlingRights(piece, fromRow, fromCol) {
        const color = piece.color;

        if (piece.type === 'king') {
            this.castlingRights[color].kingSide = false;
            this.castlingRights[color].queenSide = false;
        }

        if (piece.type === 'rook') {
            const homeRow = color === 'white' ? 7 : 0;
            if (fromRow === homeRow) {
                if (fromCol === 0) {
                    this.castlingRights[color].queenSide = false;
                } else if (fromCol === 7) {
                    this.castlingRights[color].kingSide = false;
                }
            }
        }
    }

    getValidMovesRaw(row, col, piece) {
        const validMoves = [];
        const { type, color } = piece;

        switch (type) {
            case 'pawn':
                const direction = color === 'white' ? -1 : 1;
                const startRow = color === 'white' ? 6 : 1;
                
                // Move forward one square
                if (row + direction >= 0 && row + direction < 8 && !this.board[row + direction][col]) {
                    validMoves.push({ row: row + direction, col: col, type: 'normal' });
                    // Move forward two squares from starting position
                    if (row === startRow && !this.board[row + 2 * direction][col]) {
                        validMoves.push({ row: row + 2 * direction, col: col, type: 'normal' });
                    }
                }
                
                // Capture diagonally
                for (const dc of [-1, 1]) {
                    if (col + dc >= 0 && col + dc < 8 && row + direction >= 0 && row + direction < 8) {
                        const targetPiece = this.board[row + direction][col + dc];
                        if (targetPiece && targetPiece.color !== color) {
                            validMoves.push({ row: row + direction, col: col + dc, type: 'capture' });
                        }
                    }
                }
                
                // En passant
                if (this.lastMove && this.lastMove.piece.type === 'pawn' && this.lastMove.piece.color !== color) {
                    if (Math.abs(this.lastMove.fromRow - this.lastMove.toRow) === 2) {
                        const enPassantRank = color === 'white' ? 3 : 4;
                        if (row === enPassantRank) {
                            if (Math.abs(col - this.lastMove.toCol) === 1 && this.lastMove.toRow === row) {
                                validMoves.push({ row: row + direction, col: this.lastMove.toCol, type: 'en-passant' });
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
                        const targetPiece = this.board[newRow][newCol];
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
                        const targetPiece = this.board[newRow][newCol];
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
                        const targetPiece = this.board[newRow][newCol];
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

            case 'king':
                const kingMoves = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
                for (const [dr, dc] of kingMoves) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        const targetPiece = this.board[newRow][newCol];
                        if (!targetPiece) {
                            validMoves.push({ row: newRow, col: newCol, type: 'normal' });
                        } else if (targetPiece.color !== color) {
                            validMoves.push({ row: newRow, col: newCol, type: 'capture' });
                        }
                    }
                }

                // Castling
                if (this.canCastle(color, 'king')) {
                    validMoves.push({ row: row, col: col + 2, type: 'castle-king' });
                }
                if (this.canCastle(color, 'queen')) {
                    validMoves.push({ row: row, col: col - 2, type: 'castle-queen' });
                }
                break;

            case 'knight':
                const knightMoves = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];
                for (const [dr, dc] of knightMoves) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        const targetPiece = this.board[newRow][newCol];
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

    canCastle(color, side) {
        if (!this.castlingRights[color][side + 'Side']) {
            return false;
        }

        if (this.isInCheck(color)) {
            return false;
        }

        const row = color === 'white' ? 7 : 0;

        if (side === 'king') {
            if (this.board[row][5] !== null || this.board[row][6] !== null) {
                return false;
            }

            if (this.isSquareUnderAttack(row, 5, color === 'white' ? 'black' : 'white') ||
                this.isSquareUnderAttack(row, 6, color === 'white' ? 'black' : 'white')) {
                return false;
            }

            const rook = this.board[row][7];
            return rook && rook.type === 'rook' && rook.color === color;
        } else {
            if (this.board[row][1] !== null || this.board[row][2] !== null || this.board[row][3] !== null) {
                return false;
            }

            if (this.isSquareUnderAttack(row, 2, color === 'white' ? 'black' : 'white') ||
                this.isSquareUnderAttack(row, 3, color === 'white' ? 'black' : 'white')) {
                return false;
            }
            
            const rook = this.board[row][0];
            return rook && rook.type === 'rook' && rook.color === color;
        }
    }

    isSquareUnderAttack(targetRow, targetCol, attackingColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === attackingColor) {
                    if (piece.type === 'pawn') {
                        const direction = piece.color === 'white' ? -1 : 1;
                        if ((r + direction === targetRow && c - 1 === targetCol) ||
                            (r + direction === targetRow && c + 1 === targetCol)) {
                            return true;
                        }
                    } else if (piece.type === 'king') {
                        const kingMoves = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
                        for (const [dr, dc] of kingMoves) {
                            const newRow = r + dr;
                            const newCol = c + dc;
                            if (newRow === targetRow && newCol === targetCol) {
                                return true;
                            }
                        }
                    } else {
                        const moves = this.getValidMovesRawForAttackCheck(r, c, piece);
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

    getValidMovesRawForAttackCheck(row, col, piece) {
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
                        const targetPiece = this.board[newRow][newCol];
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
                        const targetPiece = this.board[newRow][newCol];
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
                        const targetPiece = this.board[newRow][newCol];
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
                        const targetPiece = this.board[newRow][newCol];
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

    isInCheck(playerColor) {
        const kingPosition = this.findKing(playerColor);
        if (!kingPosition) return false;
        const opponentColor = playerColor === 'white' ? 'black' : 'white';
        return this.isSquareUnderAttack(kingPosition.row, kingPosition.col, opponentColor);
    }

    setPiece(row, col, piece) {
        this.board[row][col] = piece;
    }

    getPiece(row, col) {
        return this.board[row][col];
    }

    clearSquare(row, col) {
        this.board[row][col] = null;
    }

    // Helper method to set up custom board positions for testing
    setBoard(boardState) {
        this.board = boardState;
    }
}

// Test Suite
const test = new TestRunner();

// Run all tests
function runTests() {
    const chess = new ChessEngine();

    test.describe('Initial Board Setup', () => {
        test.it('should have correct initial piece placement', () => {
            // Check white pieces
            test.assertEqual(chess.getPiece(7, 0), { type: 'rook', color: 'white' });
            test.assertEqual(chess.getPiece(7, 4), { type: 'king', color: 'white' });
            test.assertEqual(chess.getPiece(6, 0), { type: 'pawn', color: 'white' });
            
            // Check black pieces
            test.assertEqual(chess.getPiece(0, 0), { type: 'rook', color: 'black' });
            test.assertEqual(chess.getPiece(0, 4), { type: 'king', color: 'black' });
            test.assertEqual(chess.getPiece(1, 0), { type: 'pawn', color: 'black' });
            
            // Check empty squares
            test.assertEqual(chess.getPiece(2, 0), null);
            test.assertEqual(chess.getPiece(4, 4), null);
        });

        test.it('should start with white to move', () => {
            test.assertEqual(chess.currentPlayer, 'white');
        });

        test.it('should have all castling rights initially', () => {
            test.assertTrue(chess.castlingRights.white.kingSide);
            test.assertTrue(chess.castlingRights.white.queenSide);
            test.assertTrue(chess.castlingRights.black.kingSide);
            test.assertTrue(chess.castlingRights.black.queenSide);
        });
    });

    test.describe('Find King Function', () => {
        test.it('should find white king at initial position', () => {
            const kingPos = chess.findKing('white');
            test.assertEqual(kingPos, { row: 7, col: 4 });
        });

        test.it('should find black king at initial position', () => {
            const kingPos = chess.findKing('black');
            test.assertEqual(kingPos, { row: 0, col: 4 });
        });

        test.it('should return null if king not found', () => {
            // Clear the white king
            chess.clearSquare(7, 4);
            const kingPos = chess.findKing('white');
            test.assertEqual(kingPos, null);
            // Restore for other tests
            chess.setPiece(7, 4, { type: 'king', color: 'white' });
        });
    });

    test.describe('Pawn Move Generation', () => {
        test.it('should generate correct moves for white pawn at starting position', () => {
            const moves = chess.getValidMovesRaw(6, 4, { type: 'pawn', color: 'white' });
            test.assertEqual(moves.length, 2);
            test.assertTrue(moves.some(m => m.row === 5 && m.col === 4 && m.type === 'normal'));
            test.assertTrue(moves.some(m => m.row === 4 && m.col === 4 && m.type === 'normal'));
        });

        test.it('should generate correct moves for black pawn at starting position', () => {
            const moves = chess.getValidMovesRaw(1, 4, { type: 'pawn', color: 'black' });
            test.assertEqual(moves.length, 2);
            test.assertTrue(moves.some(m => m.row === 2 && m.col === 4 && m.type === 'normal'));
            test.assertTrue(moves.some(m => m.row === 3 && m.col === 4 && m.type === 'normal'));
        });

        test.it('should generate capture moves when enemy pieces are diagonal', () => {
            // Set up a white pawn with black pieces diagonally in front
            chess.clearSquare(6, 4); // Remove white pawn
            chess.setPiece(4, 4, { type: 'pawn', color: 'white' });
            chess.setPiece(3, 3, { type: 'pawn', color: 'black' });
            chess.setPiece(3, 5, { type: 'pawn', color: 'black' });
            
            const moves = chess.getValidMovesRaw(4, 4, { type: 'pawn', color: 'white' });
            
            // Should have one forward move and two captures
            test.assertEqual(moves.length, 3);
            test.assertTrue(moves.some(m => m.row === 3 && m.col === 4 && m.type === 'normal'));
            test.assertTrue(moves.some(m => m.row === 3 && m.col === 3 && m.type === 'capture'));
            test.assertTrue(moves.some(m => m.row === 3 && m.col === 5 && m.type === 'capture'));
            
            chess.reset();
        });
    });    
    
    test.describe('Knight Move Generation', () => {        test.it('should generate correct moves for knight', () => {
            chess.clearBoard();
            
            // Place a white knight in center of empty board
            chess.setPiece(4, 4, { type: 'knight', color: 'white' });
              const moves = chess.getValidMovesRaw(4, 4, { type: 'knight', color: 'white' });
            
            // Debug: log the actual moves
            console.log('Knight moves from (4,4):', moves.map(m => `(${m.row},${m.col})`));
            
            // Knight should have 8 possible moves from center
            test.assertEqual(moves.length, 8);
            
            // Check some specific moves
            test.assertTrue(moves.some(m => m.row === 6 && m.col === 5));
            test.assertTrue(moves.some(m => m.row === 6 && m.col === 3));
            test.assertTrue(moves.some(m => m.row === 2 && m.col === 5));
            test.assertTrue(moves.some(m => m.row === 2 && m.col === 3));
            
            chess.reset();
        });

        test.it('should not move outside board boundaries', () => {
            // Place knight in corner
            const moves = chess.getValidMovesRaw(0, 0, { type: 'knight', color: 'white' });
            
            // From corner, knight should have only 2 valid moves
            test.assertEqual(moves.length, 2);
            test.assertTrue(moves.some(m => m.row === 2 && m.col === 1));
            test.assertTrue(moves.some(m => m.row === 1 && m.col === 2));
        });
    });

    test.describe('Rook Move Generation', () => {
        test.it('should generate moves in all four directions', () => {
            // Place rook in center of empty board
            chess.clearSquare(7, 0); // Remove original rook
            chess.setPiece(4, 4, { type: 'rook', color: 'white' });
            
            const moves = chess.getValidMovesRaw(4, 4, { type: 'rook', color: 'white' });
            
            // Rook should have 14 moves from center (7 in each direction except blocked)
            test.assertTrue(moves.length > 10);
            
            // Check moves in each direction
            test.assertTrue(moves.some(m => m.row === 4 && m.col === 7)); // Right
            test.assertTrue(moves.some(m => m.row === 4 && m.col === 0)); // Left
            test.assertTrue(moves.some(m => m.row === 0 && m.col === 4)); // Up
            test.assertTrue(moves.some(m => m.row === 7 && m.col === 4)); // Down (but blocked by white pawn)
            
            
            chess.reset();
        });
    });

    test.describe('Bishop Move Generation', () => {
        test.it('should generate diagonal moves', () => {
            // Place bishop in center of empty board
            chess.clearSquare(7, 2); // Remove original bishop
            chess.setPiece(4, 4, { type: 'bishop', color: 'white' });
            
            const moves = chess.getValidMovesRaw(4, 4, { type: 'bishop', color: 'white' });
            
            // Bishop should have several diagonal moves
            test.assertTrue(moves.length > 8);
            
            // Check diagonal directions
            test.assertTrue(moves.some(m => m.row === 3 && m.col === 3)); // Up-left
            test.assertTrue(moves.some(m => m.row === 3 && m.col === 5)); // Up-right
            test.assertTrue(moves.some(m => m.row === 7 && m.col === 7)); // Down-right
            
            
            chess.reset();
        });
    });

    test.describe('Queen Move Generation', () => {
        test.it('should combine rook and bishop moves', () => {
            // Place queen in center of empty board
            chess.clearSquare(7, 3); // Remove original queen
            chess.setPiece(4, 4, { type: 'queen', color: 'white' });
            
            const moves = chess.getValidMovesRaw(4, 4, { type: 'queen', color: 'white' });
            
            // Queen should have many moves (combination of rook and bishop)
            test.assertTrue(moves.length > 20);
            
            // Check both straight and diagonal moves
            test.assertTrue(moves.some(m => m.row === 4 && m.col === 0)); // Horizontal
            test.assertTrue(moves.some(m => m.row === 0 && m.col === 4)); // Vertical
            test.assertTrue(moves.some(m => m.row === 0 && m.col === 0)); // Diagonal
            
            
            chess.reset();
        });
    });

    test.describe('King Move Generation', () => {
        test.it('should generate one-square moves in all directions', () => {
            // Move king to center for testing
            chess.clearSquare(7, 4); // Remove original king
            chess.setPiece(4, 4, { type: 'king', color: 'white' });
            
            const moves = chess.getValidMovesRaw(4, 4, { type: 'king', color: 'white' });
            
            // King should have 8 moves from center
            test.assertEqual(moves.length, 8);
            
            // Check all 8 directions
            test.assertTrue(moves.some(m => m.row === 3 && m.col === 4)); // Up
            test.assertTrue(moves.some(m => m.row === 5 && m.col === 4)); // Down
            test.assertTrue(moves.some(m => m.row === 4 && m.col === 3)); // Left
            test.assertTrue(moves.some(m => m.row === 4 && m.col === 5)); // Right
            test.assertTrue(moves.some(m => m.row === 3 && m.col === 3)); // Up-left
            
            
            chess.reset();
        });
    });

    test.describe('Promotion Detection', () => {
        test.it('should detect white pawn promotion', () => {
            const piece = { type: 'pawn', color: 'white' };
            test.assertTrue(chess.isPromotion(piece, 1, 0));
            test.assertFalse(chess.isPromotion(piece, 2, 1));
        });

        test.it('should detect black pawn promotion', () => {
            const piece = { type: 'pawn', color: 'black' };
            test.assertTrue(chess.isPromotion(piece, 6, 7));
            test.assertFalse(chess.isPromotion(piece, 5, 6));
        });

        test.it('should not detect promotion for non-pawns', () => {
            const piece = { type: 'queen', color: 'white' };
            test.assertFalse(chess.isPromotion(piece, 1, 0));
        });
    });    test.describe('Castling Rights', () => {
        test.it('should remove castling rights when king moves', () => {
            chess.reset();
            const king = { type: 'king', color: 'white' };
            chess.updateCastlingRights(king, 7, 4);
            
            test.assertFalse(chess.castlingRights.white.kingSide);
            test.assertFalse(chess.castlingRights.white.queenSide);
        });

        test.it('should remove king-side castling when king-side rook moves', () => {
            chess.reset();
            const rook = { type: 'rook', color: 'white' };
            chess.updateCastlingRights(rook, 7, 7);
            
            test.assertFalse(chess.castlingRights.white.kingSide);
            test.assertTrue(chess.castlingRights.white.queenSide); // Should still be true
        });

        test.it('should remove queen-side castling when queen-side rook moves', () => {
            chess.reset();
            const rook = { type: 'rook', color: 'white' };
            chess.updateCastlingRights(rook, 7, 0);
            
            test.assertTrue(chess.castlingRights.white.kingSide); // Should still be true
            test.assertFalse(chess.castlingRights.white.queenSide);
        });
    });

    test.describe('Check Detection', () => {
        test.it('should detect when king is in check', () => {
            // Set up a simple check position
            chess.reset();
            chess.clearSquare(1, 4); // Remove black pawn in front of king
            chess.setPiece(2, 4, { type: 'queen', color: 'white' }); // Place white queen attacking black king
            
            test.assertTrue(chess.isInCheck('black'));
            test.assertFalse(chess.isInCheck('white'));
            
            chess.reset();
        });

        test.it('should not detect check when king is safe', () => {
            test.assertFalse(chess.isInCheck('white'));
            test.assertFalse(chess.isInCheck('black'));
        });
    });

    test.describe('Square Under Attack', () => {
        test.it('should detect when a square is under attack by a pawn', () => {
            chess.reset();
            // White pawn at e4 attacks d5 and f5
            chess.setPiece(4, 4, { type: 'pawn', color: 'white' });
            
            test.assertTrue(chess.isSquareUnderAttack(3, 3, 'white'));
            test.assertTrue(chess.isSquareUnderAttack(3, 5, 'white'));
            test.assertFalse(chess.isSquareUnderAttack(3, 4, 'white')); // Pawns don't attack straight ahead
            
            chess.reset();
        });        test.it('should detect when a square is under attack by a rook', () => {
            chess.reset();
            // Clear the entire board first
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    chess.clearSquare(r, c);
                }
            }
            // Place a white rook at center
            chess.setPiece(4, 4, { type: 'rook', color: 'white' });
            
            test.assertTrue(chess.isSquareUnderAttack(4, 0, 'white')); // Same row
            test.assertTrue(chess.isSquareUnderAttack(0, 4, 'white')); // Same column
            test.assertFalse(chess.isSquareUnderAttack(3, 3, 'white')); // Diagonal
            
            chess.reset();
        });
    });

    test.describe('Castling Validation', () => {
        test.it('should allow castling when conditions are met', () => {
            chess.reset();
            // Clear squares between king and rook for white king-side castling
            chess.clearSquare(7, 5); // Bishop
            chess.clearSquare(7, 6); // Knight
            
            test.assertTrue(chess.canCastle('white', 'king'));
            
            chess.reset();
        });

        test.it('should not allow castling when king is in check', () => {
            chess.reset();
            // Clear squares for castling
            chess.clearSquare(7, 5);
            chess.clearSquare(7, 6);
            // Put black queen attacking white king
            chess.setPiece(6, 4, { type: 'queen', color: 'black' });
            
            test.assertFalse(chess.canCastle('white', 'king'));
            
            chess.reset();
        });

        test.it('should not allow castling when path is blocked', () => {
            // Initial position has pieces between king and rook
            test.assertFalse(chess.canCastle('white', 'king'));
            test.assertFalse(chess.canCastle('white', 'queen'));
        });
    });

    test.describe('En Passant', () => {
        test.it('should generate en passant move when conditions are met', () => {
            chess.reset();
            
            // Set up en passant scenario
            chess.setPiece(3, 4, { type: 'pawn', color: 'white' }); // White pawn on 5th rank
            chess.setPiece(3, 5, { type: 'pawn', color: 'black' }); // Black pawn adjacent
            
            // Simulate last move was black pawn moving two squares
            chess.lastMove = {
                piece: { type: 'pawn', color: 'black' },
                fromRow: 1,
                fromCol: 5,
                toRow: 3,
                toCol: 5
            };
            
            const moves = chess.getValidMovesRaw(3, 4, { type: 'pawn', color: 'white' });
            
            test.assertTrue(moves.some(m => m.row === 2 && m.col === 5 && m.type === 'en-passant'));
            
            chess.reset();
        });
    });

    test.run();
}
