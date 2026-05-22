// Umayr Rai's Pixel Quest
// Game 3(b) - Platformer Implementation
// Built on top of S7 PlatformImprovement + L20 ParticlePractice + L15 AudioPractice

"use strict";

let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: { pixelArt: true },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { x: 0, y: 0 }
        }
    },
    width: 1200,
    height: 700,
    scene: [Load, Platformer, GameOver]
};

var cursors;
const SCALE = 2.0;
var my = { sprite: {}, text: {}, vfx: {} };

const game = new Phaser.Game(config);
