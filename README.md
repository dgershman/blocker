# Block Blast

A classic Tetris-style falling block puzzle game built with vanilla JavaScript and HTML5 Canvas.

## How to Play

Open `index.html` in your browser to start playing.

### Controls

| Key | Action |
|-----|--------|
| ← → | Move piece left/right |
| ↑ | Rotate piece |
| ↓ | Soft drop (faster fall) |
| Space | Hard drop (instant drop) |
| P | Pause game |

### Mobile Controls

- **Swipe left/right** - Move piece
- **Swipe up** - Rotate
- **Swipe down** - Hard drop
- **Tap** - Rotate

## Gameplay

- Tetromino pieces fall from the top of the screen
- Move and rotate pieces to fill horizontal lines
- Complete lines are cleared and blocks above fall down
- Score points for clearing lines (bonus for multiple lines at once)
- Game speeds up every 10 lines cleared
- Game ends when pieces stack to the top

## Scoring

| Lines Cleared | Points |
|---------------|--------|
| 1 line | 100 × level |
| 2 lines | 300 × level |
| 3 lines | 500 × level |
| 4 lines | 800 × level |

## Files

- `index.html` - Game structure
- `game.js` - Game logic
- `styles.css` - Styling
