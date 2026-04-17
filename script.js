class Game {
    constructor() {
        this.stage = document.getElementById('stage');
        this.scoreEl = document.getElementById('score');
        this.livesEl = document.getElementById('lives-board');
        this.finalScoreEl = document.getElementById('final-score');
        
        this.score = 0;
        this.lives = 5;
        this.gameActive = false;
        this.bubbles = [];
        this.spawnRate = 1200; // ms
        this.speedMultiplier = 1;
        this.lastSpawn = 0;

        // Colors and Shapes
        this.colors = ['#ff85a1', '#fbb1bd', '#f7cad0', '#ff99ac', '#ff4d6d', '#ffb703', '#80ed99'];
        this.shapes = ['shape-circle', 'shape-oval', 'shape-rounded'];

        this.init();
    }

    init() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
        window.requestAnimationFrame((time) => this.update(time));
    }

    startGame() {
        this.score = 0;
        this.lives = 5;
        this.spawnRate = 1200;
        this.speedMultiplier = 1;
        this.gameActive = true;
        
        // Clear existing bubbles visually
        this.bubbles.forEach(b => b.remove());
        this.bubbles = [];
        
        this.updateHUD();
        document.querySelector('.overlay:not(.hidden)').classList.add('hidden');
    }

    updateHUD() {
        this.scoreEl.innerText = this.score;
        this.livesEl.innerHTML = '❤️'.repeat(this.lives);
    }

    spawnBubble() {
        const size = Math.random() * (80 - 50) + 50;
        const x = Math.random() * (window.innerWidth - size);
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
        
        let type = 'normal';
        const rand = Math.random();
        if (rand > 0.95) type = 'golden';
        else if (rand > 0.90) type = 'bomb';

        const bubble = new Bubble(x, window.innerHeight, size, color, shape, type, this);
        this.bubbles.push(bubble);
    }

    handleGameOver() {
        this.gameActive = false;
        this.finalScoreEl.innerText = this.score;
        document.getElementById('game-over-screen').classList.remove('hidden');
    }

    update(time) {
        if (this.gameActive) {
            // Difficulty Scaling
            if (time - this.lastSpawn > this.spawnRate) {
                this.spawnBubble();
                this.lastSpawn = time;
                this.spawnRate = Math.max(400, this.spawnRate - 5);
                this.speedMultiplier += 0.001;
            }

            // BUG FIX: Reverse loop to safely remove items without skipping
            for (let i = this.bubbles.length - 1; i >= 0; i--) {
                const bubble = this.bubbles[i];
                bubble.move(this.speedMultiplier);
                
                // Remove if off screen
                if (bubble.y + bubble.size < 0) {
                    if (bubble.type !== 'bomb') {
                        this.lives--;
                        this.updateHUD();
                    }
                    bubble.remove();
                    this.bubbles.splice(i, 1);
                    
                    if (this.lives <= 0) this.handleGameOver();
                }
            }
        }
        window.requestAnimationFrame((time) => this.update(time));
    }
}

class Bubble {
    constructor(x, y, size, color, shape, type, game) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.type = type;
        this.game = game;
        this.speed = (Math.random() * 2 + 1);
        this.popped = false;
        
        this.el = document.createElement('div');
        this.el.className = `bubble ${shape}`;
        
        if (type === 'golden') {
            this.el.style.background = 'radial-gradient(circle at 30% 30%, #fff9ae, #ffb703)';
            this.el.style.boxShadow = '0 0 15px #ffb703';
        } else if (type === 'bomb') {
            this.el.style.background = 'radial-gradient(circle at 30% 30%, #555, #000)';
            this.el.innerHTML = '💣';
        } else {
            this.el.style.background = `radial-gradient(circle at 30% 30%, white, ${color})`;
        }

        this.el.style.width = `${size}px`;
        this.el.style.height = `${size}px`;
        this.el.style.left = `${this.x}px`;
        this.el.style.top = `${this.y}px`;

        this.el.addEventListener('mousedown', (e) => this.pop(e));
        this.el.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.pop(e);
        });

        this.game.stage.appendChild(this.el);
    }

    move(multiplier) {
        this.y -= this.speed * multiplier;
        this.el.style.top = `${this.y}px`;
    }

    pop(e) {
        if (this.popped) return;
        this.popped = true;

        if (this.type === 'bomb') {
            this.game.lives -= 2;
        } else if (this.type === 'golden') {
            this.game.score += 50;
        } else {
            this.game.score += 10;
        }

        this.game.updateHUD();
        this.el.classList.add('popping');
        
        // Remove from the game's array so it stops tracking it
        const index = this.game.bubbles.indexOf(this);
        if (index > -1) {
            this.game.bubbles.splice(index, 1);
        }

        setTimeout(() => this.remove(), 200);
    }

    remove() {
        if (this.el.parentNode) {
            this.el.parentNode.removeChild(this.el);
        }
    }
}

// Start Engine
const candyPop = new Game();