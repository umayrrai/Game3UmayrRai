class GameOver extends Phaser.Scene {
    constructor() {
        super("gameOverScene");
    }

    init(data) {
        this.win = data.win || false;
        this.finalScore = data.score || 0;
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(W / 2, H / 2, W, H, this.win ? 0x1a3a1a : 0x3a1a1a, 0.92);

        const titleText  = this.win ? '🏆 LEVEL COMPLETE!' : '💀 GAME OVER';
        const titleColor = this.win ? '#FFD700' : '#FF4444';

        this.add.text(W / 2, H * 0.28, titleText, {
            fontFamily: 'monospace',
            fontSize: '48px',
            color: titleColor,
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(W / 2, H * 0.46, `Coins Collected: ${this.finalScore / 10}`, {
            fontFamily: 'monospace',
            fontSize: '26px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(W / 2, H * 0.56, `Final Score: ${this.finalScore}`, {
            fontFamily: 'monospace',
            fontSize: '32px',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        const subText = this.win
            ? 'You conquered all four zones!'
            : 'Better luck next time, adventurer!';

        this.add.text(W / 2, H * 0.68, subText, {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#cccccc',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        const restartText = this.add.text(W / 2, H * 0.82, 'Press ENTER or SPACE to Play Again', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#aaffaa',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.tweens.add({
            targets: restartText,
            alpha: 0,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        if (this.win) {
            this.add.particles(W / 2, -20, 'kenny-particles', {
                frame: ['star_01.png', 'star_02.png', 'star_03.png', 'star_04.png'],
                lifespan: 3000,
                speedX: { min: -200, max: 200 },
                speedY: { min: 100, max: 400 },
                gravityY: 200,
                scale: { start: 0.3, end: 0.1 },
                alpha: { start: 1, end: 0 },
                rotate: { min: 0, max: 360 },
                tint: [0xFFD700, 0xFF88AA, 0x88FFAA, 0x88AAFF],
                quantity: 3,
                frequency: 100,
                emitZone: {
                    type: 'random',
                    source: new Phaser.Geom.Rectangle(-W / 2, 0, W, 1)
                }
            });
        }

        this.input.keyboard.on('keydown-ENTER', () => this.restartGame());
        this.input.keyboard.on('keydown-SPACE', () => this.restartGame());
        this.input.on('pointerdown', () => this.restartGame());
    }

    restartGame() {
        my.sprite = {};
        my.text   = {};
        my.vfx    = {};
        this.scene.start("platformerScene");
    }
}