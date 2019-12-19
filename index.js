// Write Javascript code!
const appDiv = document.getElementById('app');

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 480,
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
    this.load.image('fallen_tree', 'Assets/Tilemaps/fallen_tree.png');
    this.load.image('gate', 'Assets/Tilemaps/gate.png');
    this.load.image('tree', 'Assets/Tilemaps/tree.png');
    this.load.image('heart', 'Assets/Tilemaps/heart.png');
    this.load.image('spikes', 'Assets/Tilemaps/spikes.png');
    this.load.image('tree_trunk', 'Assets/Tilemaps/TreeTrunk.png');

    //Load map
    this.load.tilemapTiledJSON('map', 'Assets/Tilemaps/world.json');

    //Load background
    this.load.image('background', 'Assets/dark_background.png');

    //Load player
    this.load.atlas('player', 'Assets/Character/heroine.png', 'Assets/Character/heroine.json');
    this.load.image('hearth', 'Assets/Character/Hearth.png');
    this.load.image('shield', 'Assets/Character/Shield.png');
    this.load.atlas('knife', 'Assets/Character/knife.png', 'Assets/Character/knife.json');

    //Load enemies
    this.load.atlas('krampus', 'Assets/Enemies/Krampus/krampus.png', 'Assets/Enemies/Krampus/krampus.json');

    //Load music
    this.load.audio("intro", 'Assets/Sounds/moon-intro.mp3');
    this.load.audio("main_theme", 'Assets/Sounds/moon-main_theme.mp3');
    this.load.audio("outro", 'Assets/Sounds/moon-outro.mp3');
    this.load.audio("knife-stab", 'Assets/Sounds/knife-stab.mp3');
    // this.load.image('platform', 'Assets/StoneGate.png')
    //
    // this.load.spritesheet('player',
    //     'games/starstruck/dude.png',
    //     { frameWidth: 32, frameHeight: 48 }
    // );
}

//
var map;
var mainScene;
var tilesets = {};
var layers = {};
var hearths, shields;
//player
var player, lifeImages = new Array(), shieldImages = new Array();
var shieldTimer, damageReceivedTimer;
var useShieldKey;
var throwKnifeKey;
var listKnifes = new Array();
//game over
var gameOver = false, gameOverText;
//level passed
var levelPassed = false, levelPassedText, levelPassPositionX = 8896;
//keyboard
var cursors;
//enemies
var krampus;
var spikes;

//tutorial
var moveText, shieldText, throwKnifeText;

var player_is_jumping = false;
var player_is_attacking = false;

function create() {
    mainScene = this;
    let back = this.add.image(0, 0, 'background');
    back.setOrigin(0)
    back.setScrollFactor(0);//fixedToCamera = true;
    map = this.make.tilemap({key: 'map'});

    //Load tilesets
    tilesets["blocks"] = map.addTilesetImage('blocks','blocks');
    tilesets["heart"] = map.addTilesetImage('heart','heart');
    tilesets["fallen_tree"] = map.addTilesetImage('fallen_tree','fallen_tree');
    tilesets["gate"] = map.addTilesetImage('gate','gate');
    tilesets["tree"] = map.addTilesetImage('tree','tree');
    tilesets["tree_trunk"] = map.addTilesetImage('TreeTrunk','tree_trunk');

    //Layer 1
    layers["background2"] = map.createStaticLayer('background2', [ tilesets["tree"], tilesets["fallen_tree"], tilesets["blocks"], tilesets["gate"], tilesets["tree_trunk"] ], 0, 0);

    //collectables1 == shields
    shields = this.physics.add.group({
        allowGravity: false,
        immovable: true
    });
    const shieldObjects = map.getObjectLayer('collectables1')['objects'];
    shieldObjects.forEach(shieldObject => {
        shields.create(shieldObject.x+16, shieldObject.y-16, 'shield');
    });
    // collectables2 == hearths
    hearths = this.physics.add.group({
        allowGravity: false,
        immovable: true
    });
    const hearthObjects = map.getObjectLayer('collectables2')['objects'];
    hearthObjects.forEach(hearthObject => {
        // Add new hearths to our sprite group
        hearths.create(hearthObject.x+16, hearthObject.y-16, 'heart');
    });

    // spikes
    spikes = this.physics.add.group({
        allowGravity: false,
        immovable: true
    });
    const spikeObjects = map.getObjectLayer('spikes')['objects'];
    spikeObjects.forEach(spikeObject => {
        // Add new spikes to our sprite group
        spikes.create(spikeObject.x+16, spikeObject.y-16, 'spikes');
    });


    //Layer 3
    layers["collision"] = map.createStaticLayer('collision', tilesets["blocks"], 0, 0);
    layers["collision"].setCollisionByExclusion(-1, true);

    //Layer 4
    layers["background1"] = map.createStaticLayer('background1', tilesets["blocks"], 0, 0);


    //player section
    player = this.physics.add.sprite(200, 200, 'player');
    player.setScale(0.9).setOrigin(0);
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

    throwKnifeKey = this.input.keyboard.addKey('Q');
    throwKnifeKey.on('down', throwKnife);
    //krampus

    //let atlasTexture = this.textures.get('player');
    //let frames = atlasTexture.getFrameNames();
    //colliders
    this.physics.add.collider(player, layers["collision"]);
    this.physics.add.collider(player, hearths, collectHearth);
    this.physics.add.collider(player, shields, collectShield);

    //enemy animations
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
    // this.introMusicConfig = {
    //         mute: false,
    //         volume: 1,
    //         rate: 1,
    //         detune: 0,
    //         seek: 0,
    //         loop: false,
    //         delay: 0
    //
    //     };

    this.mainThemeMusicConfig = {
        mute: false,
        volume: 1,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: true,
        delay: 0

    };

    this.outroMusicConfig = {
        mute: false,
        volume: 1,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: true,
        delay: 0

    };

    this.knifeStabFXConfig = {
        mute: false,
        volume: 1,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: false,
        delay: 0

    };

    // this.game_intro_music = this.sound.add("intro");
    this.game_main_theme_music = this.sound.add("main_theme");
    this.game_outro_music = this.sound.add("outro");
    this.enemy_knife_stab = this.sound.add("knife-stab");
    // game.sound.setDecodedCallback([this.game_intro_music, this.game_main_theme_music, this.game_outro_music, this.enemy_knife_stab], audioReady, this);

    // this.game_intro_music.play(this.introMusicConfig);
    this.game_main_theme_music.play(this.mainThemeMusicConfig);

    //music section end
    this.cameras.main.setBounds(0, 0, 16000, 640);
    this.physics.world.setBounds(0, 0, 16000, 640);
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


    krampus = this.physics.add.sprite(1600,300,'krampus');
    krampus.lifes = 5;
    this.physics.add.collider(listKnifes, layers["collision"],  knifeCollisionHandler);
    this.physics.add.collider(krampus, listKnifes, loseKrampusLife);
    this.physics.add.collider(krampus, layers["collision"]);
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
    this.physics.add.collider(player, krampus, collideEnemy);
    this.physics.add.overlap(player, spikes, collideEnemy);

    //tutorial
    moveText = this.add.text(0, 120, 'MOVE: ARROWS', { fontFamily: 'Roboto Condensed' }).setScrollFactor(0);
    moveText.setStyle({
        fontSize: '24px',
        fontFamily: 'Roboto Condensed',
        color: '#ffffff',
        align: 'center',
    });
    shieldText = this.add.text(0, 150, 'USE SHIELD: E', { fontFamily: 'Roboto Condensed' }).setScrollFactor(0);
    shieldText.setStyle({
        fontSize: '24px',
        fontFamily: 'Roboto Condensed',
        color: '#ffffff',
        align: 'center',
    });
    throwKnifeText = this.add.text(0, 180, 'THROW KNIFE: Q', { fontFamily: 'Roboto Condensed' }).setScrollFactor(0);
    throwKnifeText.setStyle({
        fontSize: '24px',
        fontFamily: 'Roboto Condensed',
        color: '#ffffff',
        align: 'center',
    });
    //level passed
    levelPassedText = this.add.text(400, 320, 'YOU WON', { fontFamily: 'Roboto Condensed' }).setOrigin(0.5).setScrollFactor(0);
    levelPassedText.setStyle({
        fontSize: '64px',
        fontFamily: 'Roboto Condensed',
        color: '#ffffff',
        align: 'center',
    });
    levelPassedText.visible = false;

    //player animations

    this.anims.create({
        key: 'player_walk',
        frames: this.anims.generateFrameNames('player', {
            start: 0,
            end: 3,
            zeroPad: 1,
            prefix: 'heroine-walk-',
            suffix: '.png'
        }),
        frameRate: 8,
        repeat: -1
    });

    this.anims.create({
        key: 'player_jump',
        frames: this.anims.generateFrameNames('player', {
            start: 1,
            end: 4,
            zeroPad: 1,
            prefix: 'heroine-jump-',
            suffix: '.png'
        }),
        frameRate: 8,
        repeat: false
    });

    this.anims.create({
        key: 'player_landing',
        frames: this.anims.generateFrameNames('player', {
            start: 5,
            end: 6,
            zeroPad: 1,
            prefix: 'heroine-jump-',
            suffix: '.png'
        }),
        frameRate: 5,
        repeat: false
    });
    this.anims.create({
        key: 'player_idle',
        frames: this.anims.generateFrameNames('player', {
            start: 6,
            end: 6,
            zeroPad: 1,
            prefix: 'heroine-jump-',
            suffix: '.png'
        }),
        frameRate: 8,
        repeat: -1
    });

    this.anims.create({
        key: 'player_attack',
        frames: this.anims.generateFrameNames('player', {
            start: 0,
            end: 2,
            zeroPad: 1,
            prefix: 'heroine-attack-',
            suffix: '.png'
        }),
        frameRate: 6,
        repeat: false
    });

    //knife animation

    this.anims.create({
        key: 'knife_throw',
        frames: this.anims.generateFrameNames('knife', {
            start: 1,
            end: 4,
            zeroPad: 1,
            prefix: 'knife__',
            suffix: '.png'
        }),
        frameRate: 8,
        repeat: -1
    });
}

function managePlayerInput()
{
    if (cursors.left.isDown) {
        player.flipX = true;
        player.setVelocityX(-200);
        if(!player_is_attacking && (player.body.touching.down || player.body.onFloor()))
        {
            player.anims.play('player_walk', true);
        }

    }
    else if (cursors.right.isDown) {
        player.flipX = false;
        player.setVelocityX(200);
        if(!player_is_attacking && (player.body.touching.down || player.body.onFloor()))
        {
            player.anims.play('player_walk', true);
        }
    }
    else {
        player.setVelocityX(0);
        if (!player_is_jumping && !player_is_attacking && (player.body.touching.down || player.body.onFloor()))
        {
            player.anims.play('player_idle', true);
        }
    }
    if (player_is_jumping && (player.body.touching.down || player.body.onFloor()))
    {
        player.anims.play('player_landing', true);
        player_is_jumping = false;
    }
    else if (cursors.up.isDown && (player.body.touching.down || player.body.onFloor())) {
        player.anims.play('player_walk', false);
        player.anims.play('player_jump', true);
        player_is_jumping = true;
        mainScene.time.addEvent({
            delay: 5, // in ms
            callback: () => {
                player.setVelocityY(-400);
            }
        });


    }
}

// function audioReady()
// {
//      console.log("Audio loaded");
// }

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
    if(player.lifes == 0 && !gameOver)
    {
        gameOver = true;
        mainScene.game_main_theme_music.stop(mainScene.mainThemeMusicConfig);
        mainScene.game_outro_music.play(mainScene.outroMusicConfig);
    }
    if(gameOver)
        gameOverText.visible = true;
}

function update()
{
    if(!gameOver)
    {
        managePlayerInput();
        // this.physics.collide(krampus, player, function()
        // {
        //     console.log("Collided")
        //     loseHearth();
        // });
        updateLifes();
        updateShields();
        updateGameEnd();
        checkLevelPassed();
    }
}

function collideEnemy()
{
    console.log("Collided")
    loseHearth();
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
        player.shields = player.maxShields;
    }
    //Show/hide life images
    for(let i = 0; i < player.shields; i++)
    {
        //console.log(i);
        shieldImages[i].visible = true;
    }
    for(let i = player.shields; i<shieldImages.length; i++)
    {
        //console.log(i);
        shieldImages[i].visible = false;
    }
    if(shieldTimer != undefined)
    {
        if(shieldTimer.getElapsed() < shieldTimer.delay)
        {
            player.setTintFill(0x00FF00);
        }
        else
        {
            player.setTintFill(0x000000);
        }
    }
}

function throwKnife()
{
    if(!gameOver)
    {
        console.log("Throwing knife!");
        if(player.flipX)
        {
            player_is_attacking = true;
            player.anims.play('player_attack', true);
            mainScene.time.addEvent({
                delay: 500, // in ms
                callback: () => {
                    // let knife = mainScene.physics.add.image(player.x, player.y, 'knife').setScale(1).setOrigin(0.5);
                    // knife.anims.play('knife_throw')
                    listKnifes.push(mainScene.physics.add.sprite(player.x, player.y, 'knife').setScale(1).setOrigin(0.5));
                    listKnifes[listKnifes.length - 1].setVelocityX(-600);
                    listKnifes[listKnifes.length - 1].anims.play('knife_throw');
                    player_is_attacking = false;
                }
            });

        }
        else
        {
            player_is_attacking = true;
            player.anims.play('player_attack', true);
            mainScene.time.addEvent({
                delay: 500, // in ms
                callback: () => {
                    // let knife = mainScene.physics.add.image(player.x, player.y, 'knife').setScale(1).setOrigin(0.5);
                    // knife.anims.play('knife_throw')
                    listKnifes.push(mainScene.physics.add.sprite(player.x, player.y, 'knife').setScale(1).setOrigin(0.5));
                    listKnifes[listKnifes.length - 1].setVelocityX(600);
                    listKnifes[listKnifes.length - 1].anims.play('knife_throw');
                    player_is_attacking = false;
                }
            });

        }
    }
}

function collectHearth(object1, object2)
{
    if(!gameOver)
    {
        player.lifes += 1;
        hearths.remove(object2);
        object2.destroy();
    }
}

function collectShield(object1, object2)
{
    if(!gameOver)
    {
        player.shields += 1;
        shields.remove(object2);
        object2.destroy();
    }
}

function knifeCollisionHandler(object1, object2) {
    console.log(object1);
    //destroy knife
    object1.destroy();
}

function loseKrampusLife(object1, object2) {
    krampus.lifes -= 1;
    mainScene.enemy_knife_stab.play(mainScene.knifeStabFXConfig);
    //destroy knife
    object2.destroy();
    console.log("Krampus lifes: " + krampus.lifes);
    if(krampus.lifes <= 0)
    {
        krampus.destroy();
    }
}

function checkLevelPassed()
{
    if(!gameOver)
    {
        if(player.x >= levelPassPositionX)
        {
            levelPassed = true;
            levelPassedText.visible = true;
        }
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

//7752
//5152
//3840
//4128