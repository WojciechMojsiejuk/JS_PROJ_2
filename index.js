// Write Javascript code!
const appDiv = document.getElementById('app');

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 640,
    parent: appDiv,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};


var game = new Phaser.Game(config);


function preload() {
    this.load.image('background', 'Assets/dark_backgroundc.png');
    this.load.image('fallen_tree', 'Assets/FallenTree.png');
    this.load.image('platform', 'Assets/GiantTree.png');
    // this.load.image('platform', 'Assets/StoneGate.png')
    //
    // this.load.spritesheet('player',
    //     'games/starstruck/dude.png',
    //     { frameWidth: 32, frameHeight: 48 }
    // );
}

var player, platforms;
var cursors;

function create() {
    let back = this.add.image(0, 0, 'background');
    back.setOrigin(0)
    back.setScrollFactor(0);//fixedToCamera = true;
    this.cameras.main.setBounds(0, 0, 720, 300);
    this.physics.world.setBounds(0, 0, 720, 300)

    // player = this.physics.add.sprite(50, 100, 'player');
    // player.setCollideWorldBounds(true);
    // player.setBounce(0.2);
    // this.cameras.main.startFollow(player)
    //
    // this.anims.create({
    //     key: 'left',
    //     frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
    //     frameRate: 10,
    //     repeat: -1
    // });
    //
    // this.anims.create({
    //     key: 'front',
    //     frames: [{ key: 'player', frame: 4 }],
    //     frameRate: 20
    // });
    //
    // this.anims.create({
    //     key: 'right',
    //     frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
    //     frameRate: 10,
    //     repeat: -1
    // });
    //
    // cursors = this.input.keyboard.createCursorKeys();
    //
    platforms = this.physics.add.staticGroup();
    platforms.create(0, 400, 'platform');
    platforms.create(150, 400, 'platform');
    platforms.create(300, 400, 'platform');
    platforms.create(450, 400, 'platform');
    platforms.create(600, 400, 'platform');
    platforms.create(750, 400, 'platform');
    platforms.create(900, 400, 'platform');
    platforms.getChildren().forEach(c => c.setScale(0.4).setOrigin(0).refreshBody())

    // this.physics.add.collider(player, platforms);
}

function update() {
    // if (cursors.left.isDown) {
    //     player.setVelocityX(-150);
    //     player.anims.play('left', true);
    // }
    // else if (cursors.right.isDown) {
    //     player.setVelocityX(150);
    //     player.anims.play('right', true);
    // }
    // else {
    //     player.setVelocityX(0);
    //     player.anims.play('front');
    // }
    //
    // if (cursors.up.isDown && (player.body.touching.down || player.body.onFloor())) {
    //     player.setVelocityY(-250);
    // }
}
