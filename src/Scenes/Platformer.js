class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        this.ACCELERATION = 300;
        this.DRAG = 1000;
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -700;
        this.SCALE = 2.0;
        this.jumpsAvailable = 2;
        this.coinScore = 0;
        this.wasOnGround = false;
        this.levelComplete = false;
        this.isDead = false;
    }

    create() {
        // TILEMAP — key "level1", tileset "PixelPlatformer", your actual layer names
        this.map = this.add.tilemap("level1", 18, 18, 192, 16);
        this.tileset = this.map.addTilesetImage("PixelPlatformer", "tilemap_tiles");
        this.cameras.main.setBackgroundColor('#87CEEB');

        this.foregroundLayer = this.map.createLayer("Foreground", this.tileset, 0, 0);
        this.platformLayer = this.map.createLayer("Platforms", this.tileset, 0, 0);
        this.platformLayer.setCollisionByProperty({ collides: true });
        this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0);
        this.groundLayer.setCollisionByProperty({ collides: true });

        // COINS — created from Foreground tile 152 (1-indexed in TMJ = frame 151)
        this.coinTiles = this.foregroundLayer.createFromTiles(152, -1, {
            key: 'tilemap_sheet', frame: 151
        });
        this.coinTiles.forEach(c => c.setOrigin(0, 0));
        this.physics.world.enable(this.coinTiles, Phaser.Physics.Arcade.STATIC_BODY);
        this.coinGroup = this.add.group(this.coinTiles);

        // FLAG — tile 112 in Foreground
        this.flagTiles = this.foregroundLayer.createFromTiles(112, -1, {
            key: 'tilemap_sheet', frame: 111
        });
        this.flagTiles.forEach(f => f.setOrigin(0, 0));
        this.physics.world.enable(this.flagTiles, Phaser.Physics.Arcade.STATIC_BODY);
        this.flagGroup = this.add.group(this.flagTiles);

        // PLAYER
        my.sprite.player = this.physics.add.sprite(30, 100, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.setSize(10, 16);

        // COLLIDERS
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.collider(my.sprite.player, this.platformLayer);

        // COIN OVERLAP
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (player, coin) => {
            coin.destroy();
            this.coinScore += 10;
            this.coinText.setText('Coins: ' + this.coinScore);
            my.vfx.coinBurst.explode(16, coin.x + 9, coin.y + 9);
            this.sound.play('coinSfx', { volume: 0.7 });
        });

        // FLAG OVERLAP
        this.physics.add.overlap(my.sprite.player, this.flagGroup, () => {
            if (!this.levelComplete) {
                this.levelComplete = true;
                if (this.bgMusic) this.bgMusic.stop();
                this.time.delayedCall(1000, () => {
                    this.scene.start("gameOverScene", { win: true, score: this.coinScore });
                });
            }
        });

        // PARTICLES
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['star_04.png', 'spark_03.png'],
            scale: { start: 0.08, end: 0.0 },
            lifespan: 180,
            alpha: { start: 0.8, end: 0 },
            tint: [0xddbb88, 0xccaa77],
            frequency: 80,
            quantity: 1,
            speedX: { min: -20, max: 20 },
            speedY: { min: -10, max: 0 },
            gravityY: 60,
            emitting: false
        });
        my.vfx.walking.startFollow(my.sprite.player, 0, 8);

        my.vfx.jumpDust = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_01.png', 'smoke_02.png'],
            lifespan: { min: 200, max: 400 },
            speed: { min: 30, max: 90 },
            angle: { min: 200, max: 340 },
            scale: { start: 0.15, end: 0 },
            alpha: { start: 0.7, end: 0 },
            gravityY: 150,
            emitting: false
        });

        my.vfx.landDust = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            lifespan: { min: 150, max: 300 },
            speed: { min: 40, max: 120 },
            angle: { min: 150, max: 390 },
            scale: { start: 0.12, end: 0 },
            alpha: { start: 0.8, end: 0 },
            gravityY: 200,
            emitting: false
        });

        my.vfx.coinBurst = this.add.particles(0, 0, "kenny-particles", {
            frame: ['star_01.png', 'star_02.png', 'spark_01.png', 'spark_02.png'],
            lifespan: { min: 300, max: 600 },
            speed: { min: 80, max: 220 },
            scale: { start: 0.25, end: 0 },
            alpha: { start: 1, end: 0 },
            rotate: { min: 0, max: 360 },
            tint: [0xFFD700, 0xFFFF44, 0xFFAA00],
            gravityY: 300,
            blendMode: 'ADD',
            emitting: false
        });

        // AUDIO
        this.bgMusic = this.sound.add('bgMusic');
        this.bgMusic.play({ loop: true, volume: 0.4 });

        // CAMERA
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.1, 0.1);
        this.cameras.main.setFollowOffset(80, 0);
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        // HUD
        this.coinText = this.add.text(12, 12, 'Coins: 0', {
            fontFamily: 'monospace', fontSize: '14px',
            color: '#FFD700', stroke: '#000000', strokeThickness: 3
        }).setScrollFactor(0).setDepth(10);

        this.zoneText = this.add.text(12, 32, 'Zone 1 — Grasslands', {
            fontFamily: 'monospace', fontSize: '11px',
            color: '#ffffff', stroke: '#000000', strokeThickness: 2
        }).setScrollFactor(0).setDepth(10);

        this.add.text(12, this.scale.height - 22, '← → Move   ↑ Jump   R Restart   D Debug', {
            fontFamily: 'monospace', fontSize: '10px',
            color: '#aaaaaa', stroke: '#000000', strokeThickness: 2
        }).setScrollFactor(0).setDepth(10);

        // INPUT
        cursors = this.input.keyboard.createCursorKeys();
        this.rKey = this.input.keyboard.addKey('R');
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = !this.physics.world.drawDebug;
            if (this.physics.world.debugGraphic) {
                this.physics.world.debugGraphic.clear();
            }
        }, this);
    }

    update() {
        if (this.levelComplete || this.isDead) return;

        const onGround = my.sprite.player.body.blocked.down;

        // Landing detection
        if (!this.wasOnGround && onGround) {
            this.jumpsAvailable = 2;
            my.vfx.landDust.explode(8, my.sprite.player.x, my.sprite.player.y + 8);
        }
        this.wasOnGround = onGround;

        // Horizontal movement
        if (cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            if (onGround && !my.vfx.walking.emitting) my.vfx.walking.start();

        } else if (cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            if (onGround && !my.vfx.walking.emitting) my.vfx.walking.start();

        } else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            if (my.vfx.walking.emitting) my.vfx.walking.stop();
        }

        if (!onGround && my.vfx.walking.emitting) my.vfx.walking.stop();
        if (!onGround) my.sprite.player.anims.play('jump');

        // Jump
        if (Phaser.Input.Keyboard.JustDown(cursors.up) && this.jumpsAvailable > 0) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            my.vfx.jumpDust.explode(10, my.sprite.player.x, my.sprite.player.y + 8);
            this.sound.play('jumpSfx', { volume: 0.6 });
            this.jumpsAvailable--;
        }

        // Restart
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            if (this.bgMusic) this.bgMusic.stop();
            this.scene.restart();
        }

        // Zone HUD
        const px = my.sprite.player.x / 18;
        if (px < 48) this.zoneText.setText('Zone 1 — Grasslands');
        else if (px < 96) this.zoneText.setText('Zone 2 — Arid Mountains');
        else if (px < 144) this.zoneText.setText('Zone 3 — Frozen Tundra');
        else this.zoneText.setText('Zone 4 — Mushroom Forest');

        // Pit death
        if (my.sprite.player.y > this.map.heightInPixels + 100 && !this.isDead) {
            this.isDead = true;
            if (this.bgMusic) this.bgMusic.stop();
            this.time.delayedCall(300, () => {
                this.scene.start("gameOverScene", { win: false, score: this.coinScore });
            });
        }
    }
}