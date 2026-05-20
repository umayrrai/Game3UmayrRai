class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Character spritesheet
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

        // Tilemap
        this.load.image("tilemap_tiles", "tilemap_packed.png");
        this.load.tilemapTiledJSON("platformer-level-1", "platformer-level-1.tmj");

        // Tilemap as spritesheet (needed for createFromObjects coins)
        this.load.spritesheet("tilemap_sheet", "tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });

        // Particles (multi-atlas from Kenny Particle Pack)
        this.load.multiatlas("kenny-particles", "kenny-particles.json");

        // Audio
        this.load.audio("bgMusic", "Cretaceous Dawn.mp3");
        this.load.audio("jumpSfx", "jump.wav");
        this.load.audio("landSfx", "land.wav");
        this.load.audio("coinSfx", "coin.wav");
        this.load.audio("victorySfx", "victory.wav");

        // Loading bar
        let loadBar = this.add.graphics();
        this.load.on('progress', (value) => {
            loadBar.clear();
            loadBar.fillStyle(0xffffff, 1);
            loadBar.fillRect(0, this.scale.height / 2 - 10, this.scale.width * value, 20);
        });
        this.load.on('complete', () => loadBar.destroy());

        // Loading label
        this.add.text(this.scale.width / 2, this.scale.height / 2 - 40, "Loading Pixel Quest...", {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    create() {
        // Player walk animation
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 0,
                end: 1,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 15,
            repeat: -1
        });

        // Player idle animation
        this.anims.create({
            key: 'idle',
            defaultTextureKey: "platformer_characters",
            frames: [{ frame: "tile_0000.png" }],
            repeat: -1
        });

        // Player jump animation
        this.anims.create({
            key: 'jump',
            defaultTextureKey: "platformer_characters",
            frames: [{ frame: "tile_0001.png" }],
        });

        this.scene.start("platformerScene");
    }

    update() {}
}
