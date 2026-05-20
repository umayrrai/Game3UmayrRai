class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // --- Movement values from GDD ---
        this.ACCELERATION = 500;
        this.DRAG = 700;
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -900;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;

        // State
        this.coinScore = 0;
        this.wasOnGround = false;
    }

    create() {
        // ─── TILEMAP ──────────────────────────────────────────────────────────
        // Your GDD: 192 tiles wide x 16 tiles tall, 18x18px tiles
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 192, 16);
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Layer 1: Ground (collidable)
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.groundLayer.setCollisionByProperty({ collides: true });

        // Layer 2: Decorative foreground (no collision)
        // Uncomment if you have a Foreground layer in your Tiled map:
        // this.foregroundLayer = this.map.createLayer("Foreground", this.tileset, 0, 0);

        // ─── COINS (from Tiled Objects layer) ────────────────────────────────
        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.coinGroup = this.add.group(this.coins);

        // ─── FLAG / END TRIGGER (from Tiled Objects layer) ───────────────────
        this.flags = this.map.createFromObjects("Objects", {
            name: "flag",
            key: "tilemap_sheet",
            frame: 111
        });
        this.physics.world.enable(this.flags, Phaser.Physics.Arcade.STATIC_BODY);
        this.flagGroup = this.add.group(this.flags);

        // ─── WATER DEATH ZONE (Zone 3 — optional: ways to die) ───────────────
        this.waterTiles = this.groundLayer.filterTiles(tile => tile.properties && tile.properties.water == true);
        if (this.waterTiles.length > 0) {
            // Build a water zone rectangle from tile positions
            const TS = 18;
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            for (const tile of this.waterTiles) {
                if (tile.pixelX < minX)       minX = tile.pixelX;
                if (tile.pixelX + TS > maxX)  maxX = tile.pixelX + TS;
                if (tile.pixelY < minY)        minY = tile.pixelY;
                if (tile.pixelY + TS > maxY)   maxY = tile.pixelY + TS;
            }
            // Create an invisible physics zone for water death
            this.waterZone = this.add.zone(minX, minY, maxX - minX, maxY - minY)
                .setOrigin(0, 0);
            this.physics.world.enable(this.waterZone, Phaser.Physics.Arcade.STATIC_BODY);

            // Water bubble particles (ambient, always running)
            const gfx = this.make.graphics({ x: 0, y: 0, add: false });
            gfx.fillStyle(0x88ccff, 1);
            gfx.fillCircle(8, 8, 8);
            gfx.generateTexture('bubble', 16, 16);
            gfx.destroy();

            const waterZoneRect = new Phaser.Geom.Rectangle(
                minX, minY + (maxY - minY) * 0.5,
                maxX - minX, (maxY - minY) * 0.5
            );
            my.vfx.bubbles = this.add.particles(0, 0, 'bubble', {
                emitZone:  { type: 'random', source: waterZoneRect },
                speedX:    { min: -12, max: 12 },
                speedY:    { min: -50, max: -20 },
                gravityY:  0,
                lifespan:  { min: 800, max: 1800 },
                scale:     { start: 0.6, end: 0 },
                alpha:     { start: 0.5, end: 0 },
                quantity:  1,
                frequency: 200,
                blendMode: 'ADD'
            });
        }

        // ─── PLAYER ───────────────────────────────────────────────────────────
        my.sprite.player = this.physics.add.sprite(30, 200, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // ─── COLLIDERS ────────────────────────────────────────────────────────
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // Coin overlap — collect + sparkle + score
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (player, coin) => {
            coin.destroy();
            this.coinScore += 10;
            this.coinText.setText('Coins: ' + this.coinScore);
            my.vfx.coinBurst.explode(16, coin.x, coin.y);
            this.sound.play('coinSfx', { volume: 0.7 });
        });

        // Flag overlap — win!
        this.physics.add.overlap(my.sprite.player, this.flagGroup, () => {
            if (!this.levelComplete) {
                this.levelComplete = true;
                this.sound.play('victorySfx', { volume: 0.8 });
                this.bgMusic.stop();
                // Brief delay then transition to GameOver/Win scene
                this.time.delayedCall(1200, () => {
                    this.scene.start("gameOverScene", {
                        win: true,
                        score: this.coinScore
                    });
                });
            }
        });

        // Water death overlap (optional element)
        if (this.waterZone) {
            this.physics.add.overlap(my.sprite.player, this.waterZone, () => {
                if (!this.isDead) {
                    this.isDead = true;
                    this.bgMusic.stop();
                    this.time.delayedCall(600, () => {
                        this.scene.start("gameOverScene", {
                            win: false,
                            score: this.coinScore
                        });
                    });
                }
            });
        }

        // ─── PARTICLES ────────────────────────────────────────────────────────
        // 1. HORIZONTAL movement dust (required — different from S7 section example)
        //    Uses star/spark frames instead of smoke, fewer particles, golden tint
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['star_04.png', 'spark_03.png'],   // different texture from section example
            scale: { start: 0.08, end: 0.0 },
            lifespan: 180,
            alpha: { start: 0.8, end: 0 },
            tint: [0xddbb88, 0xccaa77],
            frequency: 80,                            // less frequent than section smoke
            quantity: 1,                              // only 1 at a time (fewer = better)
            speedX: { min: -20, max: 20 },
            speedY: { min: -10, max: 0 },
            gravityY: 60,
            emitting: false
        });
        my.vfx.walking.startFollow(my.sprite.player, 0, 8);

        // 2. JUMP dust burst (required vertical particle — fires once on takeoff)
        my.vfx.jumpDust = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_01.png', 'smoke_02.png'],
            lifespan: { min: 200, max: 400 },
            speed: { min: 30, max: 90 },
            angle: { min: 200, max: 340 },
            scale: { start: 0.15, end: 0 },
            alpha: { start: 0.7, end: 0 },
            gravityY: 150,
            tint: [0xffffff, 0xdddddd],
            emitting: false
        });

        // 3. LAND impact burst (fires once on landing)
        my.vfx.landDust = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            lifespan: { min: 150, max: 300 },
            speed: { min: 40, max: 120 },
            angle: { min: 150, max: 390 },
            scale: { start: 0.12, end: 0 },
            alpha: { start: 0.8, end: 0 },
            gravityY: 200,
            tint: [0xddccaa, 0xccbbaa],
            emitting: false
        });

        // 4. COIN burst (fires on coin collect)
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

        // ─── AUDIO ────────────────────────────────────────────────────────────
        this.bgMusic = this.sound.add('bgMusic');
        this.bgMusic.play({ loop: true, volume: 0.4 });

        // ─── CAMERA ───────────────────────────────────────────────────────────
        // Left-offset follow (per GDD): player sits slightly left of center
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels * this.SCALE, this.map.heightInPixels * this.SCALE);
        this.cameras.main.startFollow(my.sprite.player, true, 0.1, 0.1);
        this.cameras.main.setFollowOffset(80, 0);   // player left of center = more forward visibility
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        // ─── HUD ──────────────────────────────────────────────────────────────
        // Fixed to camera so it doesn't scroll
        this.coinText = this.add.text(12, 12, 'Coins: 0', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3
        }).setScrollFactor(0).setDepth(10);

        this.zoneText = this.add.text(12, 32, 'Zone 1 — Grasslands', {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0).setDepth(10);

        this.controlsText = this.add.text(12, this.scale.height - 22, '← → Move   ↑ Jump   R Restart   D Debug', {
            fontFamily: 'monospace',
            fontSize: '10px',
            color: '#aaaaaa',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0).setDepth(10);

        // ─── INPUT ────────────────────────────────────────────────────────────
        cursors = this.input.keyboard.createCursorKeys();
        this.rKey = this.input.keyboard.addKey('R');

        // Debug toggle
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = !this.physics.world.drawDebug;
            this.physics.world.debugGraphic.clear();
        }, this);

        // ─── STATE FLAGS ──────────────────────────────────────────────────────
        this.levelComplete = false;
        this.isDead = false;
        this.isJumping = false;
    }

    update() {
        if (this.levelComplete || this.isDead) return;

        const onGround = my.sprite.player.body.blocked.down;

        // ── Detect landing (was in air, now on ground) ──
        if (!this.wasOnGround && onGround) {
            // Land dust burst at player feet
            my.vfx.landDust.explode(8, my.sprite.player.x, my.sprite.player.y + 8);
            this.sound.play('landSfx', { volume: 0.5 });
            this.isJumping = false;
        }
        this.wasOnGround = onGround;

        // ── Horizontal movement ──
        if (cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            if (onGround && !my.vfx.walking.emitting) {
                my.vfx.walking.start();
            }

        } else if (cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            if (onGround && !my.vfx.walking.emitting) {
                my.vfx.walking.start();
            }

        } else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            if (my.vfx.walking.emitting) {
                my.vfx.walking.stop();
            }
        }

        // Stop walk dust when airborne
        if (!onGround && my.vfx.walking.emitting) {
            my.vfx.walking.stop();
        }

        // ── Jump animation ──
        if (!onGround) {
            my.sprite.player.anims.play('jump');
        }

        // ── Jump input ──
        if (onGround && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.isJumping = true;

            // Jump dust at feet
            my.vfx.jumpDust.explode(10, my.sprite.player.x, my.sprite.player.y + 8);

            // Jump sound
            this.sound.play('jumpSfx', { volume: 0.6 });
        }

        // ── Restart ──
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.bgMusic.stop();
            this.coinScore = 0;
            this.scene.restart();
        }

        // ── Zone label HUD update ──
        const playerTileX = Math.floor(my.sprite.player.x / 18);
        if (playerTileX < 48) {
            this.zoneText.setText('Zone 1 — Grasslands');
        } else if (playerTileX < 96) {
            this.zoneText.setText('Zone 2 — Arid Mountains');
        } else if (playerTileX < 144) {
            this.zoneText.setText('Zone 3 — Frozen Tundra');
        } else {
            this.zoneText.setText('Zone 4 — Mushroom Forest');
        }

        // ── Pit death (fell off bottom of map) ──
        if (my.sprite.player.y > this.map.heightInPixels * this.SCALE + 100) {
            if (!this.isDead) {
                this.isDead = true;
                this.bgMusic.stop();
                this.time.delayedCall(300, () => {
                    this.scene.start("gameOverScene", {
                        win: false,
                        score: this.coinScore
                    });
                });
            }
        }
    }
}
