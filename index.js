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
    this.load.image('background', 'Assets/dark_background.png');
    this.load.image('fallen_tree', 'Assets/FallenTree.png');
    this.load.image('platform', 'Assets/GiantTree.png');
    this.load.image('TileSet', 'Assets/Tilemaps/TileSet.png');
    this.load.tilemapTiledJSON('map', 'Assets/Tilemaps/Forest.json');
    this.load.atlas('player', 'Assets/Character/CharacterSpritesheet.png', 'Assets/Character/CharacterMap.json');
    // this.load.image('platform', 'Assets/StoneGate.png')
    //
    // this.load.spritesheet('player',
    //     'games/starstruck/dude.png',
    //     { frameWidth: 32, frameHeight: 48 }
    // );
}

var map, tileset, platformLayer;
var player;
var cursors;

function create() {
    let back = this.add.image(0, 0, 'background');
    back.setOrigin(0)
    back.setScrollFactor(0);//fixedToCamera = true;
    map = this.make.tilemap({key: 'map'});
    tileset = map.addTilesetImage('TileSet','TileSet');
    platformLayer = map.createStaticLayer('Warstwa Kafelków 1', tileset, 0, 0);
    platformLayer.setCollisionByExclusion(-1, true);

    //player section
    player = this.physics.add.sprite(200, 200, 'player');
    player.setScale(0.15).setOrigin(0);
    player.setBounce(0.05);
    player.setCollideWorldBounds(true);
    //let atlasTexture = this.textures.get('player');
    //let frames = atlasTexture.getFrameNames();
    this.physics.add.collider(player, platformLayer);
    // this.anims.create({
    //     key: 'walk',
    //     frames: frames,
    //     frameRate: 10,
    //     repeat: -1
    // });

    this.cameras.main.setBounds(0, 0, 1280, 736);
    this.physics.world.setBounds(0, 0, 1280, 736);
    //this.camera.main.setOrigin()
    this.cameras.main.startFollow(player);
    cursors = this.input.keyboard.createCursorKeys();
    // player = this.physics.add.sprite(50, 100, 'player');
    // player.setCollideWorldBounds(true);
    // player.setBounce(0.2);
    // this.cameras.main.startFollow(player)

    // this.anims.create({
    //     key: 'idle',
    //     frames:  [{ key: 'player', frame: 0 }],
    //     frameRate: 10,
    //     repeat: -1
    // });
    //
    // this.anims.create({
    //     key: 'walk',
    //     frames: this.anims.generateFrameNumbers('player', { start: 2, end: 3 }),
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
    //
    //

    // this.physics.add.collider(player, platforms);
}

function update() {
    if (cursors.left.isDown) {
        //console.log("-150");
        player.flipX = true;
        player.setVelocityX(-200);
        //player.anims.play('walk', true);
    }
    else if (cursors.right.isDown) {
        //console.log("150");
        player.flipX = false;
        player.setVelocityX(200);
        //player.anims.play('walk', true);
    }
    else {
        player.setVelocityX(0);
        //player.anims.play('idle');
    }
    if (cursors.up.isDown && (player.body.touching.down || player.body.onFloor())) {
        player.setVelocityY(-400);
    }
}
