// ==========================================
// AUDIO SYNTHESIS ENGINE
// ==========================================
class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.musicPlaying = false;
        this.musicTimeout = null;
        this.melody = [523.25, 659.25, 783.99, 1046.50, 783.99, 659.25, 523.25, 587.33, 659.25, 783.99]; 
        this.noteIndex = 0;
    }

    init() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playPop() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playGameOver() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.5);
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    startMusic() {
        this.init();
        if (this.musicPlaying) return;
        this.musicPlaying = true;
        this.playNextNote();
    }

    playNextNote() {
        if (!this.musicPlaying) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine'; 
        osc.frequency.value = this.melody[this.noteIndex];
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.03, this.ctx.currentTime + 0.05); 
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.3);
        
        this.noteIndex = (this.noteIndex + 1) % this.melody.length;
        this.musicTimeout = setTimeout(() => this.playNextNote(), 250);
    }

    stopMusic() {
        this.musicPlaying = false;
        clearTimeout(this.musicTimeout);
    }
}

// ==========================================
// GAME ENGINE
// ==========================================
class CandyBubbleGame {
    constructor() {
        this.stage = document.getElementById('stage');
        this.uiScore = document.getElementById('val-score');
        this.uiLevel = document.getElementById('val-level');
        this.uiMissed = document.getElementById('val-missed');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.finalScore = document.getElementById('val-final-score');

        this.score = 0;
        this.missed = 0;
        this.level = 1;
        this.maxMisses = 5;
        this.isRunning = false;
        this.bubbles = [];
        
        this.spawnTimer = 0;
        this.spawnInterval = 1000; 
        this.baseSpeed = 0.2; 
        
        this.colors = ['#ff0a54', '#8338ec', '#ffb703', '#38b000', '#00b4d8'];
        this.audio = new AudioManager();

        this.initAmbientBubbles();
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('btn-start').addEventListener('click', () => this.startGame());
        document.getElementById('btn-restart').addEventListener('click', () => this.startGame());
    }

    initAmbientBubbles() {
        const container = document.getElementById('ambient-layer');
        if (!container) return;
        for(let i=0; i<8; i++) {
            let el = document.createElement('div');
            el.className = 'ambient-bubble';
            let size = Math.random() * 40 + 20;
            el.style.width = size + 'px';
            el.style.height = size + 'px';
            el.style.left = Math.random() * 100 + 'vw';
            el.style.animationDelay = (Math.random() * 15) + 's';
            container.appendChild(el);
        }
    }

    startGame() {
        this.audio.startMusic();

        this.score = 0;
        this.missed = 0;
        this.level = 1;
        this.spawnInterval = 1000;
        this.baseSpeed = 0.2;
        this.updateHUD();
        
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        
        this.bubbles.forEach(b => b.element.remove());
        this.bubbles = [];

        this.isRunning = true;
        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    endGame() {
        this.isRunning = false;
        this.audio.stopMusic();
        this.audio.playGameOver();
        this.finalScore.innerText = this.score;
        this.gameOverScreen.classList.remove('hidden');
    }

    updateHUD() {
        this.uiScore.innerText = this.score;
        this.uiLevel.innerText = this.level;
        this.uiMissed.innerText = this.missed;
    }

    createBubble() {
        const size = Math.random() * 40 + 50; 
        const x = Math.random() * (100 - (size/window.innerWidth)*100); 
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        
        const bubble = {
            id: Date.now() + Math.random(),
            x: x,
            y: 110, 
            size: size,
            speed: this.baseSpeed + (Math.random() * 0.15),
            element: document.createElement('div')
        };

        bubble.element.className = 'game-bubble';
        bubble.element.style.width = `${size}px`;
        bubble.element.style.height = `${size}px`;
        bubble.element.style.background = `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), ${color})`;
        bubble.element.style.backgroundColor = color;
        bubble.element.style.left = `${bubble.x}vw`;
        bubble.element.style.top = `${bubble.y}vh`;

        const popHandler = (e) => {
            e.preventDefault();
            this.popBubble(bubble);
        };
        bubble.element.addEventListener('mousedown', popHandler);
        bubble.element.addEventListener('touchstart', popHandler, {passive: false});

        this.stage.appendChild(bubble.element);
        this.bubbles.push(bubble);
    }

    popBubble(bubble) {
        if (!this.bubbles.includes(bubble)) return; 
        
        this.audio.playPop();

        this.bubbles = this.bubbles.filter(b => b.id !== bubble.id);
        
        bubble.element.classList.add('pop-anim');
        
        this.score += 10;
        if (this.score % 100 === 0) {
            this.level++;
            this.spawnInterval = Math.max(300, this.spawnInterval - 100);
            this.baseSpeed += 0.05;
        }
        this.updateHUD();

        setTimeout(() => bubble.element.remove(), 200);
    }

    missBubble(bubble) {
        this.bubbles = this.bubbles.filter(b => b.id !== bubble.id);
        bubble.element.remove();
        
        this.missed++;
        this.updateHUD();
        
        if (this.missed >= this.maxMisses) {
            this.endGame();
        }
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        this.spawnTimer += deltaTime;

        if (this.spawnTimer >= this.spawnInterval) {
            this.createBubble();
            this.spawnTimer = 0;
        }

        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            let b = this.bubbles[i];
            
            b.y -= b.speed * (deltaTime / 16.66); 
            b.element.style.transform = `translateY(${b.y - 110}vh)`; 

            if (b.y < -20) { 
                this.missBubble(b);
            }
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CandyBubbleGame();
});