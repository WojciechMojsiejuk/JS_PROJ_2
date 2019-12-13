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
    this.load.image('hearth', 'Assets/Character/hearth.png');

    //Load enemies
    this.load.atlas('krampus', 'Assets/Enemies/Krampus/walk_animation.png', 'Assets/Enemies/Krampus/walk_animation.json');

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
var player, lifeImages = new Array();
var gameOver = false, gameOverText;
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
    //player.setBounce(0.05);
    player.setCollideWorldBounds(true);
    player.lifes = 3;
    player.maxLifes = 5;
    for(let i=0;i<player.maxLifes;i++)
    {
        lifeImages.push(this.add.image(i * 50, 0, 'hearth').setScale(3).setOrigin(0, 0).setScrollFactor(0));
    }
    //hide hearths
    for(let i = player.lifes; i<player.maxLifes;i++)
    {
        lifeImages[i].visible = false;
    }

    //krampus
    krampus = this.add.sprite(200,200,'krampus');
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

    gameOverText = this.add.text(400, 320, 'GAME OVER', { fontFamily: 'Roboto Condensed' }).setOrigin(0.5).setScrollFactor(0);
    gameOverText.setStyle({
        fontSize: '64px',
        fontFamily: 'Roboto Condensed',
        color: '#ffffff',
        align: 'center',
    });
    gameOverText.visible = false;
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
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNames('krampus', {
            start: 0,
            end: 2,
            zeroPad: 1,
            prefix: 'Krampus',
            suffix: '.png'
        }),
        frameRate: 5,
        repeat: -1
    });
    krampus.play('walk');
}

function managePlayerInput()
{
    if (cursors.left.isDown) {
        player.flipX = true;
        player.setVelocityX(-200);
        //player.anims.play('walk', true);
    }
    else if (cursors.right.isDown) {
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
        player.lifes -= 1;
    }
}

function updateLifes()
{
    //console.log(lifeImages);
    //console.log(lifeImages.length);
    //Show/hide life images
    for(let i = 0; i < player.lifes; i++)
    {
        lifeImages[i].visible = true;
    }
    for(let i = player.lifes; i<lifeImages.length; i++)
    {
        lifeImages[i].visible = false;
    }
    if(player.lifes == 0)
    {
        gameOver = true;
    }
}

function updateGameEnd()
{
    if(gameOver)
        gameOverText.visible = true;
}

function update() {
    if(!gameOver)
    {
        managePlayerInput();
        updateLifes();
        updateGameEnd();
    }
}
