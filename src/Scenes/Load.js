class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.tilemapTiledJSON("level1", "assets/Tilemap/level1.tmj");
        this.load.image("tilemap_tiles", "assets/images/tilemap_packed.png");
        this.load.spritesheet("tilemap_sheet", "assets/images/tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });
        this.load.atlas(
            "platformer_characters",
            "assets/images/tilemap-characters-packed.png",
            "assets/images/tilemap-characters-packed.json"
        );
        this.load.multiatlas("kenny-particles", "assets/images/kenny-particles.json", "assets/images");
        this.load.audio("bgMusic", "assets/audio/Cretaceous Dawn.mp3");
        this.load.audio("jumpSfx", "assets/audio/jump.wav");
        this.load.audio("coinSfx", "assets/audio/coin.wav");
    }

    create() {
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_", start: 0, end: 1, suffix: ".png", zeroPad: 4
            }),
            frameRate: 15,
            repeat: -1
        });
        this.anims.create({
            key: 'idle',
            defaultTextureKey: "platformer_characters",
            frames: [{ frame: "tile_0000.png" }],
            repeat: -1
        });
        this.anims.create({
            key: 'jump',
            defaultTextureKey: "platformer_characters",
            frames: [{ frame: "tile_0001.png" }]
        });
        this.scene.start("platformerScene");
    }

    update() {}
}