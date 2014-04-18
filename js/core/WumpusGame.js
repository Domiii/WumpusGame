/**
 * This file defines the WumpusGame class.
 */
"use strict";

define(["./WumpusGame.Def", "./Tile", "./Grid",  "./Player", "./GameScriptContext", "../user/DefaultWorldGenerator"], function(wumpusGame, Tile, Grid, Player, GameScriptContext) {
     /**
      * Constructs a new game.
      * @constructor 
      */
    wumpusGame.WumpusGame = function(config) {
        // store settings
        this.initialPlayerState = config.playerState;
        
        // copy settings into game object
        squishy.clone(config.gameSettings, true, this);
        
        // create event objects
        this.events = {
            tileChanged: squishy.createEvent(this),
            restart: squishy.createEvent(this),
            scriptError: squishy.createEvent(this),
            scriptFinished: squishy.createEvent(this),
            statusChanged: squishy.createEvent(this),
            playerStateChanged: squishy.createEvent(this),
            playerEvent: squishy.createEvent(this)
        };
        
        // create core objects
        this.grid = new wumpusGame.Grid(this, config.gridConfig);
        this.player = new wumpusGame.Player(this);
        this.scriptContext = new wumpusGame.GameScriptContext(this, config.scriptConfig);
        
        // register events
        this.scriptContext.events.scriptError.addListener(function (message, stacktrace) {
            // TODO: We must find a general way to avoid repeating script errors.
            //   This handler code must under no circumstances raise another error (else, we might get an infinite loop).
            this.stopGame();
        }.bind(this));
        
        // remember config
        this.config = config;
        
        if (!this.worldGenerator) {
            // if no custom world generator is available, use the default one
            this.setWorldGenerator(new wumpusGame.DefaultWorldGenerator());
        }
        
        this.restart();
    };
    
    wumpusGame.WumpusGame.prototype = {
        /**
         * Puts the entire game on hold. In this case, it stops queued player actions.
         */
        stopGame: function() {
            this.player.stopPlayer();
            this.running = false;
        },

         /**
          * Clears all tiles.
          */
        reset: function() {
            this.stopGame();
            
            this.grid.foreachTile(function(tile) {
                tile.clearTile();
            });
        },

         /**
          * Sets the current world generator.
          */
        setWorldGenerator: function(worldGenerator) {
            this.worldGenerator = worldGenerator;
        },

         /**
          * Clears (if necessary), initializes and starts the game.
          */
        restart: function() {
            // clear the whole thing
            this.reset();
        
            // gen world
            this.worldGenerator.genWorld(this);
            
            // reset game state
            this.wumpusAlive = true;
            this.eventLog = [];
            this.setStatus(wumpusGame.GameStatus.Playing);
            
            // restart script worker
            this.scriptContext.restartWorker();
            
            // initialize player
            this.player.initializePlayer(this.initialPlayerState);
            this.player.getTile().setObject(wumpusGame.ObjectTypes.Entrance);
            
            
            // initialization has fininshed
            this.running = true;
            
            // notify all listeners
            this.events.restart.fire();
            
            // send event
            this.triggerPlayerEvent(this.player, wumpusGame.PlayerEvent.GameStart);
        },
        
        /**
         * Sets the current game status.
         * @param {Number} status The status is a numeric value of the wumpusGame.GameStatus enum.
         */
        setStatus: function(status) {
            this.status = status;
            this.events.statusChanged.fire(status);
        },
        
        /**
         * Enforce game rules
         */
        triggerPlayerEvent: function(player, eventId, args, playback) {
            if (!this.running) return;
            
            var tile = player.getTile();
            
            // check whether this is the first event in a chain, to keep the correct order of events
            var eventChain = this.eventChain;
            var eventChainStarted = !eventChain;
            
            if (eventChainStarted) {
                // create new eventChain object
                eventChain = this.eventChain = [];
                this.eventPlayback = playback;
            }
            else {
                playback = playback || this.eventPlayback;
            }
            
            // remember event
            var event = {eventId: eventId};
            eventChain.push(event);
        
            // handle event
            switch (eventId) {
                case wumpusGame.PlayerEvent.GameStart:
                    // produce array of all visited tiles
                    var visitedTiles = [];
                    this.grid.foreachTile(function(tile) {
                        if (tile.visited) {
                            visitedTiles.push({
                                tileX: tile.tilePosition[0],
                                tileY: tile.tilePosition[1],
                                tileContent: tile.getContentString()
                            });
                        }
                    });
                    
                    // compile event arguments
                    args = {
                        playerX: this.player.position[0],
                        playerY: this.player.position[1],
                        playerDirection: this.player.direction,
                        score: this.player.score,
                        ammo: this.player.ammo,
                        visitedTiles: visitedTiles
                    };
                    break;
                case wumpusGame.PlayerEvent.Move:
                    var firstVisit = args.firstVisit;
                    
                    args = {
                        playerX: this.player.position[0],
                        playerY: this.player.position[1],
                        newScore: player.score + this.pointsMove,
                        firstVisit: firstVisit,
                        tileContent: player.getTile().getContentString()
                    };
                        
                    // apply move penalty
                    player.setScore(args.newScore);
                    
                    // check for object encounters
                    if (tile.hasObject(wumpusGame.ObjectTypes.Bats)) {
                        this.triggerPlayerEvent(player, wumpusGame.PlayerEvent.Teleport);
                    }
                    else if (tile.hasObject(wumpusGame.ObjectTypes.Pit)) {
                        this.triggerPlayerEvent(player, wumpusGame.PlayerEvent.DeadPit);
                    }
                    else if (tile.hasObject(wumpusGame.ObjectTypes.Wumpus) && this.wumpusAlive) {
                        // walked into the arms of a living Wumpus
                        this.triggerPlayerEvent(player, wumpusGame.PlayerEvent.DeadWumpus);
                    }
                    else if (tile.hasObject(wumpusGame.ObjectTypes.Gold) && args.firstVisit) {
                        // stumpled upon and picked up gold
                        this.triggerPlayerEvent(player, wumpusGame.PlayerEvent.GrabGold);
                    }
                    break;
                case wumpusGame.PlayerEvent.Turn:
                    args = {
                        playerDirection: this.player.direction
                    };
                    break;
                case wumpusGame.PlayerEvent.GrabGold:
                    // player found and picked up gold
                    tile.notifyTileChanged();
                    args = {
                        newScore: player.score + this.pointsGold
                    };
                    player.setScore(args.newScore);
                    break;
                case wumpusGame.PlayerEvent.Teleport:
                    // bats teleport player to a random location
                    var tileX = squishy.randomInt(0, this.grid.width-1);
                    var tileY = squishy.randomInt(0, this.grid.height-1);
                    var newPos = [tileX, tileY];
                    this.player.movePlayerDelayed(newPos);
                    break;
                case wumpusGame.PlayerEvent.ShootArrow:
                    // TODO: Arrow shooting dynamics
                    break;
                case wumpusGame.PlayerEvent.ArrowHitWumpus:
                    this.wumpusAlive = false;
                    break;
                case wumpusGame.PlayerEvent.ArrowMissedWumpus:
                    break;
                case wumpusGame.PlayerEvent.DeadPit:
                    // player fell into a pit
                    this.setStatus(wumpusGame.GameStatus.Failed);
                    break;
                case wumpusGame.PlayerEvent.DeadWumpus:
                    // player walked into the Wumpus (also a deadly experience)
                    this.setStatus(wumpusGame.GameStatus.Failed);
                    break;
                case wumpusGame.PlayerEvent.Exit:
                    // player left the dungeon unharmed
                    this.setStatus(wumpusGame.GameStatus.Win);
                    break;
                 default:
                    throw new Error("Invalid player event: " + event);
            }
            
            event.args = args;
            
            if (eventChainStarted) {
                // this was the first event on the "stack of events", i.e. the order is now preserved
                if (!playback) {
                    // add log entry
                    eventChain.forEach(function(evt) {
                        this.eventLog.push(evt);
                        //console.log(wumpusGame.PlayerEvent.toString(evt.eventId) + squishy.objToString(event.args));
                    }.bind(this));
                    this.eventChain = null;
                }
            
                // call listener callbacks
                this.events.playerEvent.fire(player, eventChain);
                
            }
        }
    };
        
    return wumpusGame;
});
