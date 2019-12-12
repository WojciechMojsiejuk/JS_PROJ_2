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

    //Load image tilesets
    this.load.image('blocks', 'Assets/Tilemaps/blocks.png');
    // this.load.image('krampus', 'Assets/Tilemaps/krampus.png');
    this.load.image('fallen_tree', 'Assets/Tilemaps/fallen_tree.png');
    this.load.image('gate', 'Assets/Tilemaps/gate.png');
    this.load.image('tree', 'Assets/Tilemaps/tree.png');

    //Load map
    this.load.tilemapTiledJSON('map', 'Assets/Tilemaps/first_level.json');

    //Load background
    this.load.image('background', 'Assets/dark_background.png');

    //Load player
    this.load.atlas('player', 'Assets/Character/CharacterSpritesheet.png', 'Assets/Character/CharacterMap.json');

    //Load enemies
    this.load.multiatlas('krampus', 'Assets/Enemies/Krampus/walk_animation.json', 'Assets/Enemies/Krampus');

    //Load music
    this.load.audio("main_theme", 'Assets/Sounds/moon.mp3');
    // this.load.image('platform', 'Assets/StoneGate.png')
    //
    // this.load.spritesheet('player',
    //     'games/starstruck/dude.png',
    //     { frameWidth: 32, frameHeight: 48 }
    // );
}

var map;
var tilesets = {};
var layers = {};
var player;
var cursors;
var krampus;

function create() {
    let back = this.add.image(0, 0, 'background');
    back.setOrigin(0)
    back.setScrollFactor(0);//fixedToCamera = true;
    map = this.make.tilemap({key: 'map'});

    //Load tilesets
    tilesets["blocks"] = map.addTilesetImage('blocks','blocks');
    // tilesets["krampus"] = map.addTilesetImage('enemy','enemy');
    tilesets["fallen_tree"] = map.addTilesetImage('fallen_tree','fallen_tree');
    tilesets["gate"] = map.addTilesetImage('gate','gate');
    tilesets["tree"] = map.addTilesetImage('tree','tree');

    //Layer 1
    layers["background2"] = map.createStaticLayer('background2', [ tilesets["tree"], tilesets["fallen_tree"], tilesets["blocks"], tilesets["gate"] ], 0, 0);

    //Layer 2
    layers["background3"] = map.createStaticLayer('background3', tilesets["blocks"], 0, 0);

    //Layer 3
    layers["collision"] = map.createStaticLayer('collision', tilesets["blocks"], 0, 0);
    layers["collision"].setCollisionByExclusion(-1, true);

    //Layer 4
    layers["background1"] = map.createStaticLayer('background1', tilesets["blocks"], 0, 0);


    //player section
    player = this.physics.add.sprite(200, 200, 'player');
    player.setScale(0.15).setOrigin(0);
    player.setBounce(0.05);
    player.setCollideWorldBounds(true);

    //krampus
    krampus = this.add.sprite(0,0,'krampus', 'Krampus.pmg');
    //let atlasTexture = this.textures.get('player');
    //let frames = atlasTexture.getFrameNames();
    this.physics.add.collider(player, layers["collision"]);
    // this.anims.create({
    //     key: 'walk',
    //     frames: frames,
    //     frameRate: 10,
    //     repeat: -1
    // });

    //music section
    let musicConfig = {
            mute: false,
            volume: 1,
            rate: 1,
            detune: 0,
            seek: 0,
            loop: true,
            delay: 0

        }
    this.game_main_theme = this.sound.add("main_theme");
    this.game_main_theme.play(musicConfig);

    this.cameras.main.setBounds(0, 0, 3200, 600);
    this.physics.world.setBounds(0, 0, 3200, 600);
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
