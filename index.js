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
    //region //#region functions
    function LoadTilesetsImages() {
        this.load.image('blocks', 'Assets/Tilemaps/blocks.png');
        this.load.image('fallen_tree', 'Assets/Tilemaps/fallen_tree.png');
        this.load.image('gate', 'Assets/Tilemaps/gate.png');
        this.load.image('tree', 'Assets/Tilemaps/tree.png');
        this.load.image('heart', 'Assets/Tilemaps/heart.png');
        this.load.image('spikes','Assets/Tilemaps/spikes.png');
        this.load.image('tree_trunk', 'Assets/Tilemaps/TreeTrunk.png');
    }

    function LoadMusicFiles() {
        this.load.audio("intro", 'Assets/Sounds/moon-intro.mp3');
        this.load.audio("main_theme", 'Assets/Sounds/moon-main_theme.mp3');
        this.load.audio("outro", 'Assets/Sounds/moon-outro.mp3');
        this.load.audio("knife-stab", 'Assets/Sounds/knife-stab.mp3');
    }
    //enregion //#endregion

    //Load image tilesets
    LoadTilesetsImages.call(this);

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
    LoadMusicFiles.call(this);
}

//
var map;
var mainScene;
var tilesets = {};
var layers = {};
var hearths, shields, spikes;
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
var krampusGroup, krampusWithLifes = new Array();

//tutorial
var moveText, shieldText, throwKnifeText;

var player_is_jumping = false;
var player_is_attacking = false;

function create() {
    // region // #region functions
    function createPlayer() {
        player = this.physics.add.sprite(200, 200, 'player');
        player.setScale(0.9).setOrigin(0);
        player.setCollideWorldBounds(true);
    }
    function addLifesToPlayer() {
        player.lifes = 3;
        player.maxLifes = 5;
        for (let i = 0; i < player.maxLifes; i++) {
            lifeImages.push(this.add.image(i * 50, 0, 'hearth').setScale(3).setOrigin(0, 0).setScrollFactor(0));
        }
        //hide hearths
        for (let i = player.lifes; i < player.maxLifes; i++) {
            lifeImages[i].visible = false;
        }
    }
    function addShieldsToPlayer() {
        player.maxShields = 3;
        player.shields = 2;
        for (let i = 0; i < player.maxShields; i++) {
            shieldImages.push(this.add.image(i * 50, 50, 'shield').setScale(1.5).setOrigin(0, 0).setScrollFactor(0));
        }
        //hide shields
        for (let i = player.shields; i < player.maxShields; i++) {
            shieldImages[i].visible = false;
        }
        //shield input
        useShieldKey = this.input.keyboard.addKey('E');
        useShieldKey.on('down', useShield);
    }
    function addKnifeThrowInput() {
        throwKnifeKey = this.input.keyboard.addKey('Q');
        throwKnifeKey.on('down', throwKnife);
    }
    function createBackground() {
        let background = this.add.image(0, 0, 'background');
        background.setOrigin(0);
        background.setScrollFactor(0);
    }
    function addHeartsToMap() {
        // collectables2 == hearths
        hearths = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });
        const hearthObjects = map.getObjectLayer('collectables2')['objects'];
        hearthObjects.forEach(hearthObject => {
            // Add new hearths to our sprite group
            hearths.create(hearthObject.x + 16, 1 * hearthObject.y - 16, 'heart');
        });
    }
    function createMusicConfigs() {
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
    }
    function addDamageReceivedTimerToPlayer() {
        damageReceivedTimer = this.time.addEvent({
            delay: 2000,                // ms
        });
    }
    function addColliders() {
        this.physics.add.collider(player, layers["collision"]);
        this.physics.add.collider(player, hearths, collectHearth);
        this.physics.add.collider(player, shields, collectShield);
        this.physics.add.collider(listKnifes, layers["collision"], knifeCollisionHandler);
        //this.physics.add.collider(krampusGroup, listKnifes, loseKrampusLife);
        this.physics.add.collider(krampusWithLifes, listKnifes, loseKrampusLife);
        this.physics.add.collider(krampusGroup, layers["collision"]);
        this.physics.add.collider(player, krampusGroup, collideEnemy);
        this.physics.add.overlap(player, spikes, collideEnemy);
    }
    function createMusicInstances() {
        this.game_main_theme_music = this.sound.add("main_theme");
        this.game_outro_music = this.sound.add("outro");
        this.enemy_knife_stab = this.sound.add("knife-stab");
    }
    function cameraFollowPlayer() {
        this.cameras.main.startFollow(player);
    }
    function showHowToPlayMessages() {
        moveText = this.add.text(0, 120, 'MOVE: ARROWS', {fontFamily: 'Roboto Condensed'}).setScrollFactor(0);
        moveText.setStyle({
            fontSize: '24px',
            fontFamily: 'Roboto Condensed',
            color: '#ffffff',
            align: 'center',
        });
        shieldText = this.add.text(0, 150, 'USE SHIELD: E', {fontFamily: 'Roboto Condensed'}).setScrollFactor(0);
        shieldText.setStyle({
            fontSize: '24px',
            fontFamily: 'Roboto Condensed',
            color: '#ffffff',
            align: 'center',
        });
        throwKnifeText = this.add.text(0, 180, 'THROW KNIFE: Q', {fontFamily: 'Roboto Condensed'}).setScrollFactor(0);
        throwKnifeText.setStyle({
            fontSize: '24px',
            fontFamily: 'Roboto Condensed',
            color: '#ffffff',
            align: 'center',
        });
    }
    function addLevelPassedMessage() {
        levelPassedText = this.add.text(400, 320, 'YOU WON', {fontFamily: 'Roboto Condensed'}).setOrigin(0.5).setScrollFactor(0);
        levelPassedText.setStyle({
            fontSize: '64px',
            fontFamily: 'Roboto Condensed',
            color: '#ffffff',
            align: 'center',
        });
        levelPassedText.visible = false;
    }
    function createEnemyAnimations() {
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
    }
    function createKnifeAnimation() {
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
    function createPlayerAnimations() {
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
    }
    function addGameOverComponents() {
        gameOverText = this.add.text(400, 320, 'GAME OVER', {fontFamily: 'Roboto Condensed'}).setOrigin(0.5).setScrollFactor(0);
        gameOverText.setStyle({
            fontSize: '64px',
            fontFamily: 'Roboto Condensed',
            color: '#ffffff',
            align: 'center',
        });
        gameOverText.visible = false;
    }
    function addShieldsToMap() {
        //collectables1 == shields
        shields = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });
        const shieldObjects = map.getObjectLayer('collectables1')['objects'];
        shieldObjects.forEach(shieldObject => {
            shields.create(shieldObject.x + 16, shieldObject.y - 16, 'shield');
        });
    }
    function addSpikesToMap() {
        spikes = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });
        const spikeObjects = map.getObjectLayer('spikes')['objects'];
        spikeObjects.forEach(spikeObject => {
            // Add new spikes to our sprite group
            spikes.create(spikeObject.x + 16, spikeObject.y - 16, 'spikes');
        });
    }
    //endregion //#endregion

    mainScene = this;
    createBackground.call(this);
    this.physics.world.setBounds(0, 0, 16000, 640);

    //Set map
    map = this.make.tilemap({key: 'map'});

    //Load tilesets
    tilesets["blocks"] = map.addTilesetImage('blocks','blocks');
    tilesets["heart"] = map.addTilesetImage('heart','heart');
    tilesets["fallen_tree"] = map.addTilesetImage('fallen_tree','fallen_tree');
    tilesets["gate"] = map.addTilesetImage('gate','gate');
    tilesets["tree"] = map.addTilesetImage('tree','tree');
    tilesets["tree_trunk"] = map.addTilesetImage('TreeTrunk','tree_trunk');

    //layers
    layers["background2"] = map.createStaticLayer('background2', [ tilesets["tree"], tilesets["fallen_tree"], tilesets["blocks"], tilesets["gate"], tilesets["tree_trunk"] ], 0, 0);
    layers["collision"] = map.createStaticLayer('collision', tilesets["blocks"], 0, 0);
    layers["collision"].setCollisionByExclusion(-1, true);
    layers["background1"] = map.createStaticLayer('background1', tilesets["blocks"], 0, 0);

    //add spikes
    addSpikesToMap.call(this);
    //add shields to map
    addShieldsToMap.call(this);
    //hearts
    addHeartsToMap.call(this);

    //player section
    createPlayer.call(this);
    addLifesToPlayer.call(this);
    addShieldsToPlayer.call(this);
    //received dmg timer (2s of invicibility after getting hit)
    addDamageReceivedTimerToPlayer.call(this);
    addKnifeThrowInput.call(this);
    //player animations
    createPlayerAnimations.call(this);
    //knife animation
    createKnifeAnimation.call(this);
    //cursors for player input
    cursors = this.input.keyboard.createCursorKeys();

    //camera
    this.cameras.main.setBounds(0, 0, 16000, 640);
    cameraFollowPlayer.call(this);

    //krampus
    //krampus animations
    createEnemyAnimations.call(this);
    krampusGroup = this.physics.add.group({
        allowGravity: true,
        immovable: false,
        // SetLifes{
        //     lifes = 5,
        // }
    });
    spawnCrampus.call(this, 1600, 300);
    // spawnCrampus.call(this, 1650, 300);
    // spawnCrampus.call(this, 1600, 300);
    spawnCrampus.call(this, 3968, 256);
    spawnCrampus.call(this, 4128, 300);
    spawnCrampus.call(this, 5152, 300);
    spawnCrampus.call(this, 7702, 300);
    //add lifes property to all enemies
    krampusGroup.getChildren().forEach(function(krampus){
        //console.log("XXX");
        krampusWithLifes.push(krampus);
        krampusWithLifes[krampusWithLifes.length - 1].lifes = 5;
    });
    // krampusGroup.setAll('lifes', 5);
    // Phaser.Actions.Call(krampusGroup.getChildren(), function(krampus)
    // {
    //     krampus.lifes = 5;
    // });
    //music
    createMusicConfigs.call(this);
    createMusicInstances.call(this);
    this.game_main_theme_music.play(this.mainThemeMusicConfig);
    //game over components
    addGameOverComponents.call(this);
    //tutorial components
    showHowToPlayMessages.call(this);
    //level passed components
    addLevelPassedMessage.call(this);
    //add colliders
    addColliders.call(this);
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
    if(!gameOver && !levelPassed)
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
    //console.log(object1);
    //destroy knife
    object1.destroy();
}

function loseKrampusLife(krampus, knife) {
    console.log("krampus lifes: " + krampus.lifes);
    console.log("knife: " + knife);
    krampus.lifes -= 1;
    mainScene.enemy_knife_stab.play(mainScene.knifeStabFXConfig);
    //destroy knife
    knife.destroy();
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

function spawnCrampus(x, y) {
    let krampus = krampusGroup.create(x, y, 'krampus');
    //let krampus = {};
    //console.log("Krampus lifes on spawn: "+ krampus.lifes);
    //krampusGroup.add(krampus);
    krampus.play('krampus_walk');
    this.tweens.add({
        targets: krampus,
        delay: 500,
        x: x - 100,
        duration: 1000,
        ease: 'Power0',
        repeat: -1,
        yoyo: true,
        flipX: true

    });
}