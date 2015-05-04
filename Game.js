
BasicGame.Game = function (game) {

    //  When a State is added to Phaser it automatically has the following properties set on it, even if they already exist:

    this.game;      //  a reference to the currently running game (Phaser.Game)
    this.add;       //  used to add sprites, text, groups, etc (Phaser.GameObjectFactory)
    this.camera;    //  a reference to the game camera (Phaser.Camera)
    this.cache;     //  the game cache (Phaser.Cache)
    this.input;     //  the global input manager. You can access this.input.keyboard, this.input.mouse, as well from it. (Phaser.Input)
    this.load;      //  for preloading assets (Phaser.Loader)
    this.math;      //  lots of useful common math operations (Phaser.Math)
    this.sound;     //  the sound manager - add a sound, play one, set-up markers, etc (Phaser.SoundManager)
    this.stage;     //  the game stage (Phaser.Stage)
    this.time;      //  the clock (Phaser.Time)
    this.tweens;    //  the tween manager (Phaser.TweenManager)
    this.state;     //  the state manager (Phaser.StateManager)
    this.world;     //  the game world (Phaser.World)
    this.particles; //  the particle manager (Phaser.Particles)
    this.physics;   //  the physics manager (Phaser.Physics)
    this.rnd;       //  the repeatable random number generator (Phaser.RandomDataGenerator)

    //  You can use any of these from any function within this State.
    //  But do consider them as being 'reserved words', i.e. don't create a property for your own game called "world" or you'll over-write the world reference.

    this.water = [];
    this.groundNodes = [];
    this.isoGroup = [];
};

BasicGame.Game.prototype = {

    create: function () {

        this.isoGroup = this.add.group();
        this.cursorPos = new Phaser.Plugin.Isometric.Point3();
        // we won't really be using IsoArcade physics, but I've enabled it anyway so the debug bodies can be seen
        this.isoGroup.enableBody = true;
        this.isoGroup.physicsBodyType = Phaser.Plugin.Isometric.ISOARCADE;

        var tileArray = [];
        tileArray[0] = 'water';
        tileArray[1] = 'sand';
        tileArray[2] = 'grass';
        tileArray[3] = 'stone';
        tileArray[4] = 'wood';
        tileArray[5] = 'watersand';
        tileArray[6] = 'grasssand';
        tileArray[7] = 'sandstone';
        tileArray[8] = 'bush1';
        tileArray[9] = 'bush2';
        tileArray[10] = 'mushroom';
        tileArray[11] = 'wall';
        tileArray[12] = 'window';

        var tiles = [
            9, 2, 1, 1, 4, 4, 1, 6, 2, 10, 2,
            2, 6, 1, 0, 4, 4, 0, 0, 2, 2, 2,
            6, 1, 0, 0, 4, 4, 0, 0, 8, 8, 2,
            0, 0, 0, 0, 4, 4, 0, 0, 0, 9, 2,
            0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0,
            11, 11, 12, 11, 3, 3, 11, 12, 11, 11, 11,
            3, 7, 3, 3, 3, 3, 3, 3, 7, 3, 3,
            7, 1, 7, 7, 3, 3, 7, 7, 1, 1, 7
        ];

        var size = 32;

        var i = 0, tile;

        for (var y = 1; y <= 11; y += 1) {
            for (var x = 1; x <= 11; x += 1) {
                //console.log(tileArray[tiles[i]]);
                var tile_index = tiles[i];
                var z = tile_index === 0 ? 0 : this.rnd.pick([2, 3, 4]);
                tile = this.add.isoSprite(x*size, y*size, 0, 'tileset', tileArray[tile_index], this.isoGroup);
                
                tile.anchor.set(0.5, 1);

                tile.resetIsoBounds();

                tile.smoothed = false;
                tile.body.moves = false;
                
                if (tile_index === 4) {
                    tile.isoZ += 6;
                }

                if (tile_index >=8)
                {
                    tile.iosZ += 128;
                }

                if (tile_index <= 10 && (tile_index < 5 || tile_index > 6)) {
                    tile.scale.x = this.rnd.pick([-1, 1]);
                }
                
                if (tile_index === 0) {
                    this.water.push(tile);
                }
                else if( tile_index >= 1 && tile_index <= 7 )
                {
                    this.groundNodes.push(tile);
                }

                i++;
            }
        }


        //  Honestly, just about anything could go here. It's YOUR game after all. Eat your heart out!
        this.playButton = this.add.button(8, 8, 'buttons', this.quitGame, this, 'quit_over', 'quit_normal', 'quit_pressed');

    },

    update: function () {

        //  Honestly, just about anything could go here. It's YOUR game after all. Eat your heart out!
        var self = this;
        this.game.iso.unproject(this.input.activePointer.position, this.cursorPos);

        self.water.forEach(function (w) {
            //console.log(w);
            w.isoZ = (-2 * Math.sin((self.time.now + (w.isoX * 7)) * 0.004)) + (-1 * Math.sin((self.time.now + (w.isoY * 8)) * 0.005));
            w.alpha = Phaser.Math.clamp(1 + (w.isoZ * 0.1), 0.2, 1);
        });

        self.groundNodes.forEach(function (g) {
            var inBounds = g.isoBounds.containsXY(self.cursorPos.x, self.cursorPos.y-1);
            // If it does, do a little animation and tint change.
            if (!g.selected && inBounds) {
                g.selected = true;
                g.tint = 0x86bfda;
                g.defaultZ = g.isoZ;
                self.add.tween(g).to({ isoZ: g.defaultZ+4 }, 200, Phaser.Easing.Quadratic.InOut, true);
            }
            // If not, revert back to how it was.
            else if (g.selected && !inBounds) {
                g.selected = false;
                g.tint = 0xffffff;
                self.add.tween(g).to({ isoZ: g.defaultZ }, 200, Phaser.Easing.Quadratic.InOut, true);
            }
        });

    },

    render: function () {
        
        var self = this;

        self.isoGroup.forEach(function (tile) {
            self.game.debug.body(tile, 'rgba(189, 221, 235, 0.6)', false);
        });

        self.game.debug.text(Phaser.VERSION, 2, this.world.height - 2, "#ffff00");
        self.game.debug.text("FPS:" + (this.time.fps || '--'), 54, this.world.height - 2, "#a7aebe");
        self.game.debug.text(self.cursorPos.x + " " + self.cursorPos.y, 128, this.world.height - 2, "#ffff00");
 
    },

    quitGame: function (pointer) {

        //  Here you should destroy anything you no longer need.
        //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

        //  Then let's go back to the main menu.
        this.state.start('MainMenu');

    }

};
