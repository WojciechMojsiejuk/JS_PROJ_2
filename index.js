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
            debug: true
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
    this.load.image('fallen_tree', 'Assets/Tilemaps/fallen_tree.png');
    this.load.image('gate', 'Assets/Tilemaps/gate.png');
    this.load.image('tree', 'Assets/Tilemaps/tree.png');

    //Load map
    this.load.tilemapTiledJSON('map', 'Assets/Tilemaps/first_level.json');

    //Load background
    this.load.image('background', 'Assets/dark_background.png');

    //Load player
    this.load.atlas('player', 'Assets/Character/CharacterSpritesheet.png', 'Assets/Character/CharacterMap.json');
    this.load.image('hearth', 'Assets/Character/Hearth.png');
    this.load.image('shield', 'Assets/Character/Shield.png');
    this.load.image('knife', 'Assets/Character/Knife.png');

    //Load enemies
    this.load.atlas('krampus', 'Assets/Enemies/Krampus/krampus.png', 'Assets/Enemies/Krampus/krampus.json');

    //Load music
    this.load.audio("intro", 'Assets/Sounds/moon-intro.mp3');
    this.load.audio("main_theme", 'Assets/Sounds/moon-main_theme.mp3');
    this.load.audio("outro", 'Assets/Sounds/moon-outro.mp3');
    // this.load.image('platform', 'Assets/StoneGate.png')
    //
    // this.load.spritesheet('player',
    //     'games/starstruck/dude.png',
    //     { frameWidth: 32, frameHeight: 48 }
    // );
}

var map;
var mainScene;
var tilesets = {};
var layers = {};
//player
var player, lifeImages = new Array(), shieldImages = new Array();
var shieldTimer, damageReceivedTimer;
var useShieldKey;
var throwKnifeKey;
var listKnifes = new Array();
//game over
var gameOver = false, gameOverText;
var cursors;
var krampus;

function create() {
    mainScene = this;
    let back = this.add.image(0, 0, 'background');
    back.setOrigin(0)
    back.setScrollFactor(0);//fixedToCamera = true;
    map = this.make.tilemap({key: 'map'});

    //Load tilesets
    tilesets["blocks"] = map.addTilesetImage('blocks','blocks');
    tilesets["fallen_tree"] = map.addTilesetImage('fallen_tree','fallen_tree');
    tilesets["gate"] = map.addTilesetImage('gate','gate');
    tilesets["tree"] = map.addTilesetImage('tree','tree');

    //Layer 1
    layers["background2"] = map.createStaticLayer('background2', [ tilesets["tree"], tilesets["fallen_tree"], tilesets["blocks"], tilesets["gate"] ], 0, 0);

    //TODO: wczytać inaczej bo to teraz object layer Layer 2
    layers["collectables1"] = map.createStaticLayer('collectables1', tilesets["blocks"], 0, 0);
    console.log("Collectable1 layer: " + layers["collectables1"]);

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

    player.maxShields = 3;
    player.shields = 2;
    for(let i=0;i<player.maxShields;i++)
    {
        shieldImages.push(this.add.image(i * 50, 50, 'shield').setScale(1.5).setOrigin(0, 0).setScrollFactor(0));
    }
    //hide shields
    for(let i = player.shields; i<player.maxShields;i++)
    {
        shieldImages[i].visible = false;
    }
    //received dmg timer (2s of invicibility after getting hit)
    console.log(this);
    damageReceivedTimer = this.time.addEvent({
        delay: 2000,                // ms
    });

    ////shield timer (2s of invicibility)
    // shieldTimer = this.time.addEvent({
    //     delay: 2000,                // ms
    // });
    useShieldKey = this.input.keyboard.addKey('E');
    useShieldKey.on('down', useShield);

    throwKnifeKey = this.input.keyboard.addKey('ENTER');
    throwKnifeKey.on('down', throwKnife);
    //krampus

    //let atlasTexture = this.textures.get('player');
    //let frames = atlasTexture.getFrameNames();
    this.physics.add.collider(player, layers["collision"]);

    this.anims.create({
        key: 'krampus_walk',
        frames: this.anims.generateFrameNames('krampus', {
            start: 0,
            end: 1,
            zeroPad: 1,
            prefix: 'Krampus_walk_',
            suffix: '.png'
        }),
        frameRate: 8,
        repeat: -1
    });

    //music section begin
    let introMusicConfig = {
            mute: false,
            volume: 1,
            rate: 1,
            detune: 0,
            seek: 0,
            loop: false,
            delay: 0

        };

    let mainThemeMusicConfig = {
        mute: false,
        volume: 1,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: true,
        delay: 50000

    };
    this.game_intro_music = this.sound.add("intro");
    this.game_intro_music.play(introMusicConfig);

    this.game_main_theme_music = this.sound.add("main_theme");
    this.game_main_theme_music.play(mainThemeMusicConfig);

    //music section end
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
    //this.anims.create({
    //    key: 'walk',
    //    frames: this.anims.generateFrameNames('krampus', {
    //        start: 0,
    //        end: 2,
    //        zeroPad: 1,
    //        prefix: 'Krampus',
    //        suffix: '.png'
    //    }),
    //    frameRate: 5,
    //    repeat: -1

    krampus = this.physics.add.sprite(1600,300,'krampus');
    this.physics.add.collider(krampus, layers["collision"]);
    this.physics.add.collider(krampus, player);
    krampus.play('krampus_walk');

    this.tweens.add({
        targets: krampus,
        delay: 500,
        x: 1400,
        duration: 1000,
        ease: 'Power0',
        repeat: -1,
        yoyo: true,
        flipX: true

    });
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
    }
}

function updateLifes()
{
    //console.log(lifeImages);
    //console.log(lifeImages.length);
    if(player.lifes > player.maxLifes)
    {
        player.lifes = player.maxLifes;
    }
    //Show/hide life images
    for(let i = 0; i < player.lifes; i++)
    {
        lifeImages[i].visible = true;
    }
    for(let i = player.lifes; i<lifeImages.length; i++)
    {
        lifeImages[i].visible = false;
    }
}

function updateGameEnd()
{
    if(player.lifes == 0)
    {
        gameOver = true;
    }
    if(gameOver)
        gameOverText.visible = true;
}

function update()
{
    if(!gameOver)
    {
        managePlayerInput();
        this.physics.collide(krampus, player, function()
        {
            console.log("Collided")
            loseHearth();
        });
        updateLifes();
        updateShields();
        updateGameEnd();
    }
}

function loseHearth()
{
    //shield active - do not lose hearth
    if(shieldTimer != undefined)
    {
        if(shieldTimer.getElapsed() < shieldTimer.delay)
            return;
    }
    if(damageReceivedTimer.getElapsed() >= damageReceivedTimer.delay)
    {
        console.log("Loosing hearth!");
        player.lifes -= 1;
        //restart timer (create again)
        damageReceivedTimer.destroy();
        damageReceivedTimer = mainScene.time.addEvent({
            delay: 2000,                // ms
        });
    }
}

function useShield()
{
    if(!gameOver)
    {
        if(player.shields > 0)
        {
            if(shieldTimer == undefined || shieldTimer.getElapsed() >= shieldTimer.delay)
            {
                player.shields -= 1;
                //shieldTimer.destroy();
                shieldTimer = mainScene.time.addEvent({
                    delay: 2000,                // ms
                });
            }
        }
    }
}

function updateShields()
{
    if(player.shields > player.maxShields)
    {
        player.shields = player.shields;
    }
    //Show/hide life images
    for(let i = 0; i < player.shields; i++)
    {
        shieldImages[i].visible = true;
    }
    for(let i = player.shields; i<shieldImages.length; i++)
    {
        shieldImages[i].visible = false;
    }
    if(shieldTimer != undefined)
    {
        if(shieldTimer.getElapsed() < shieldTimer.delay)
        {
            player.tint = 0xFFFF00;
        }
        else
        {
            player.tint = 0xFFFFFF;
        }
    }
}

function throwKnife()
{
    if(!gameOver)
    {
        console.log("Throwing knife!");
        let actualKnife = listKnifes.push(mainScene.physics.add.image(player.x, player.y, 'knife').setScale(0.2).setOrigin(0.5));
        listKnifes[listKnifes.length - 1].setVelocityX(600);
    }
}

// function checkOverlap(spriteA, spriteB) {
//
//     console.log(spriteA);
//     console.log(spriteB);
//     GetOverlapX(spriteA, spriteB, false, 10);
//     console.log(boundsA);
//     console.log(boundsB);
//
//     return Phaser.Rectangle.intersects(boundsA, boundsB);
//
// }