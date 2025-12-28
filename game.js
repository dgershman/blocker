// Game Constants
const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 30;
const EMPTY = 0;

// Colors for tetrominoes
const COLORS = [
    null,
    '#00f0f0', // I - Cyan
    '#0000f0', // J - Blue
    '#f0a000', // L - Orange
    '#f0f000', // O - Yellow
    '#00f000', // S - Green
    '#a000f0', // T - Purple
    '#f00000', // Z - Red
];

// Tetromino shapes - each has 4 rotations
const SHAPES = {
    I: [
        [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
        [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
        [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
        [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]],
    ],
    J: [
        [[1,0,0], [1,1,1], [0,0,0]],
        [[0,1,1], [0,1,0], [0,1,0]],
        [[0,0,0], [1,1,1], [0,0,1]],
        [[0,1,0], [0,1,0], [1,1,0]],
    ],
    L: [
        [[0,0,1], [1,1,1], [0,0,0]],
        [[0,1,0], [0,1,0], [0,1,1]],
        [[0,0,0], [1,1,1], [1,0,0]],
        [[1,1,0], [0,1,0], [0,1,0]],
    ],
    O: [
        [[1,1], [1,1]],
        [[1,1], [1,1]],
        [[1,1], [1,1]],
        [[1,1], [1,1]],
    ],
    S: [
        [[0,1,1], [1,1,0], [0,0,0]],
        [[0,1,0], [0,1,1], [0,0,1]],
        [[0,0,0], [0,1,1], [1,1,0]],
        [[1,0,0], [1,1,0], [0,1,0]],
    ],
    T: [
        [[0,1,0], [1,1,1], [0,0,0]],
        [[0,1,0], [0,1,1], [0,1,0]],
        [[0,0,0], [1,1,1], [0,1,0]],
        [[0,1,0], [1,1,0], [0,1,0]],
    ],
    Z: [
        [[1,1,0], [0,1,1], [0,0,0]],
        [[0,0,1], [0,1,1], [0,1,0]],
        [[0,0,0], [1,1,0], [0,1,1]],
        [[0,1,0], [1,1,0], [1,0,0]],
    ],
};

const SHAPE_NAMES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

// Game state
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameOver = false;
let isPaused = false;
let dropInterval = 1000;
let lastDrop = 0;
let animatingLines = [];
let particles = [];

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

canvas.width = COLS * CELL_SIZE;
canvas.height = ROWS * CELL_SIZE;

// Piece class
class Piece {
    constructor(type) {
        this.type = type;
        this.colorIndex = SHAPE_NAMES.indexOf(type) + 1;
        this.rotation = 0;
        this.shape = SHAPES[type][0];
        this.x = Math.floor(COLS / 2) - Math.ceil(this.shape[0].length / 2);
        this.y = 0;
    }

    rotate() {
        this.rotation = (this.rotation + 1) % 4;
        this.shape = SHAPES[this.type][this.rotation];
    }

    rotateBack() {
        this.rotation = (this.rotation + 3) % 4;
        this.shape = SHAPES[this.type][this.rotation];
    }
}

// Initialize the game
function init() {
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    isPaused = false;
    dropInterval = 1000;
    animatingLines = [];
    particles = [];

    currentPiece = createRandomPiece();
    nextPiece = createRandomPiece();

    updateDisplay();
    document.getElementById('gameOver').style.display = 'none';

    requestAnimationFrame(gameLoop);
}

// Create a random piece
function createRandomPiece() {
    const type = SHAPE_NAMES[Math.floor(Math.random() * SHAPE_NAMES.length)];
    return new Piece(type);
}

// Main game loop
let lastTime = 0;
function gameLoop(timestamp) {
    if (gameOver) return;

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    if (!isPaused) {
        // Auto drop
        lastDrop += deltaTime;
        if (lastDrop > dropInterval) {
            moveDown();
            lastDrop = 0;
        }

        // Update particles
        updateParticles(deltaTime);
    }

    render();
    requestAnimationFrame(gameLoop);
}

// Check collision
function isValidMove(piece, offsetX = 0, offsetY = 0) {
    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (piece.shape[row][col]) {
                const newX = piece.x + col + offsetX;
                const newY = piece.y + row + offsetY;

                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return false;
                }

                if (newY >= 0 && board[newY][newX] !== EMPTY) {
                    return false;
                }
            }
        }
    }
    return true;
}

// Move piece left
function moveLeft() {
    if (isValidMove(currentPiece, -1, 0)) {
        currentPiece.x--;
        audioManager.playSound('move');
    }
}

// Move piece right
function moveRight() {
    if (isValidMove(currentPiece, 1, 0)) {
        currentPiece.x++;
        audioManager.playSound('move');
    }
}

// Move piece down
function moveDown() {
    if (isValidMove(currentPiece, 0, 1)) {
        currentPiece.y++;
        return true;
    } else {
        lockPiece();
        return false;
    }
}

// Hard drop
function hardDrop() {
    let dropDistance = 0;
    while (isValidMove(currentPiece, 0, 1)) {
        currentPiece.y++;
        dropDistance++;
    }
    score += dropDistance * 2;
    audioManager.playSound('hardDrop');
    lockPiece();
}

// Rotate piece
function rotatePiece() {
    currentPiece.rotate();

    // Wall kick - try to adjust position if rotation causes collision
    if (!isValidMove(currentPiece)) {
        // Try moving left
        if (isValidMove(currentPiece, -1, 0)) {
            currentPiece.x--;
        }
        // Try moving right
        else if (isValidMove(currentPiece, 1, 0)) {
            currentPiece.x++;
        }
        // Try moving left 2 (for I piece)
        else if (isValidMove(currentPiece, -2, 0)) {
            currentPiece.x -= 2;
        }
        // Try moving right 2 (for I piece)
        else if (isValidMove(currentPiece, 2, 0)) {
            currentPiece.x += 2;
        }
        // Can't rotate
        else {
            currentPiece.rotateBack();
            return; // Don't play sound if rotation failed
        }
    }
    audioManager.playSound('rotate');
}

// Lock piece in place
function lockPiece() {
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const boardY = currentPiece.y + row;
                const boardX = currentPiece.x + col;

                if (boardY < 0) {
                    // Game over - piece locked above visible area
                    endGame();
                    return;
                }

                board[boardY][boardX] = currentPiece.colorIndex;
            }
        }
    }

    audioManager.playSound('lock');

    // Check for completed lines
    clearLines();

    // Get next piece
    currentPiece = nextPiece;
    nextPiece = createRandomPiece();

    // Check if new piece can spawn
    if (!isValidMove(currentPiece)) {
        endGame();
    }

    updateDisplay();
}

// Clear completed lines with gravity
function clearLines() {
    let linesCleared = 0;
    let linesToClear = [];

    // Find completed lines
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== EMPTY)) {
            linesToClear.push(row);
            linesCleared++;
        }
    }

    if (linesCleared === 0) return;

    // Play line clear sound
    audioManager.playSound('lineClear', linesCleared);

    // Create particles for cleared lines
    for (const row of linesToClear) {
        for (let col = 0; col < COLS; col++) {
            createParticles(col * CELL_SIZE + CELL_SIZE / 2, row * CELL_SIZE + CELL_SIZE / 2, COLORS[board[row][col]]);
        }
    }

    // Remove lines and apply gravity
    for (const row of linesToClear.sort((a, b) => a - b)) {
        board.splice(row, 1);
        board.unshift(Array(COLS).fill(EMPTY));
    }

    // Update score
    const lineScores = [0, 100, 300, 500, 800];
    score += lineScores[linesCleared] * level;
    lines += linesCleared;

    // Level up every 10 lines
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel > level) {
        level = newLevel;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        audioManager.playSound('levelUp');
    }

    updateDisplay();
}

// Create explosion particles
function createParticles(x, y, color) {
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i + Math.random() * 0.5;
        const speed = 2 + Math.random() * 3;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color: color,
            size: 4 + Math.random() * 4,
        });
    }
}

// Update particles
function updateParticles(deltaTime) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.life -= deltaTime / 500;
        p.size *= 0.98;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// End the game
function endGame() {
    gameOver = true;
    audioManager.playSound('gameOver');
    audioManager.stopMusic();
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLines').textContent = lines;
    document.getElementById('gameOver').style.display = 'flex';
}

// Update score display
function updateDisplay() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;

    // Draw next piece
    drawNextPiece();
}

// Draw the next piece preview
function drawNextPiece() {
    nextCtx.fillStyle = '#2a2a40';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (!nextPiece) return;

    const shape = nextPiece.shape;
    const cellSize = 20;
    const offsetX = (nextCanvas.width - shape[0].length * cellSize) / 2;
    const offsetY = (nextCanvas.height - shape.length * cellSize) / 2;

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const x = offsetX + col * cellSize;
                const y = offsetY + row * cellSize;

                nextCtx.fillStyle = COLORS[nextPiece.colorIndex];
                nextCtx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

                // Highlight
                nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                nextCtx.fillRect(x + 1, y + 1, cellSize - 2, 4);
            }
        }
    }
}

// Main render function
function render() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#2a2a40';
    ctx.lineWidth = 1;
    for (let row = 0; row <= ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * CELL_SIZE);
        ctx.lineTo(canvas.width, row * CELL_SIZE);
        ctx.stroke();
    }
    for (let col = 0; col <= COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * CELL_SIZE, 0);
        ctx.lineTo(col * CELL_SIZE, canvas.height);
        ctx.stroke();
    }

    // Draw locked blocks
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col] !== EMPTY) {
                drawBlock(col, row, COLORS[board[row][col]]);
            }
        }
    }

    // Draw ghost piece (drop preview)
    if (currentPiece && !gameOver) {
        let ghostY = currentPiece.y;
        while (isValidMove(currentPiece, 0, ghostY - currentPiece.y + 1)) {
            ghostY++;
        }

        ctx.globalAlpha = 0.3;
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    drawBlock(currentPiece.x + col, ghostY + row, COLORS[currentPiece.colorIndex]);
                }
            }
        }
        ctx.globalAlpha = 1;
    }

    // Draw current piece
    if (currentPiece && !gameOver) {
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    drawBlock(currentPiece.x + col, currentPiece.y + row, COLORS[currentPiece.colorIndex]);
                }
            }
        }
    }

    // Draw particles
    for (const p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// Draw a single block
function drawBlock(col, row, color) {
    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;

    // Main block
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);

    // Highlight (top)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, 6);

    // Shadow (bottom)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x + 1, y + CELL_SIZE - 7, CELL_SIZE - 2, 6);
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (gameOver) return;

    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            moveLeft();
            break;
        case 'ArrowRight':
            e.preventDefault();
            moveRight();
            break;
        case 'ArrowDown':
            e.preventDefault();
            moveDown();
            score += 1;
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotatePiece();
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
        case 'p':
        case 'P':
            isPaused = !isPaused;
            break;
    }
});

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
    if (gameOver) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    const minSwipe = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > minSwipe) {
            moveRight();
        } else if (deltaX < -minSwipe) {
            moveLeft();
        }
    } else {
        // Vertical swipe
        if (deltaY > minSwipe) {
            hardDrop();
        } else if (deltaY < -minSwipe) {
            rotatePiece();
        }
    }

    // Tap to rotate
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        rotatePiece();
    }
}, { passive: true });

// Restart button
document.getElementById('restartBtn').addEventListener('click', () => {
    init();
    audioManager.playSound('gameStart');
    audioManager.startMusic();
});

// Audio controls
document.getElementById('sfxToggle').addEventListener('click', function() {
    const enabled = audioManager.toggleSFX();
    this.classList.toggle('active', enabled);
    this.querySelector('.icon').textContent = enabled ? '🔊' : '🔇';
});

document.getElementById('musicToggle').addEventListener('click', function() {
    const enabled = audioManager.toggleMusic();
    this.classList.toggle('active', enabled);
    this.querySelector('.icon').textContent = enabled ? '🎶' : '🎵';
});

document.getElementById('genreSelect').addEventListener('change', function() {
    audioManager.setGenre(this.value);
});

// Initialize audio control states from saved settings
function initAudioControls() {
    const sfxBtn = document.getElementById('sfxToggle');
    const musicBtn = document.getElementById('musicToggle');
    const genreSelect = document.getElementById('genreSelect');

    sfxBtn.classList.toggle('active', audioManager.sfxEnabled);
    sfxBtn.querySelector('.icon').textContent = audioManager.sfxEnabled ? '🔊' : '🔇';

    musicBtn.classList.toggle('active', audioManager.musicEnabled);
    musicBtn.querySelector('.icon').textContent = audioManager.musicEnabled ? '🎶' : '🎵';

    genreSelect.value = audioManager.currentGenre;
}

// Start the game
initAudioControls();
init();
