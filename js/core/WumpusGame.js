/**
 * This file defines the WumpusGame class.
 */
"use strict";

define(["./WumpusGame.Def", "./Tile", "./Grid",  "./Player", "./WorkerScriptContext", "../user/DefaultWorldGenerator"], function(wumpusGame, Tile, Grid, Player, WorkerScriptContext) {
     /**
      * Constructs a new game.
      * @constructor 
      */
    wumpusGame.WumpusGame = function(config) {
        // store settings
        this.initialPlayerState = config.playerState;
        
        // copy settings into game object
        squishy.clone(config.gameSettings, false, this);
        
        // create event objects
        this.events = {
            tileChanged: new squishy.Event(this),
            restart: new squishy.Event(this),
            scriptError: new squishy.Event(this),
            scriptFinished: new squishy.Event(this),
            statusChanged: new squishy.Event(this),
            playerStateChanged: new squishy.Event(this),
            playerEvent: new squishy.Event(this),
        };
        
        // create core objects
        this.grid = new wumpusGame.Grid(this, config.gridConfig);
        this.player = new wumpusGame.Player(this);
        this.scriptContext = new WorkerScriptContext(this, config.scriptConfig);
        
        if (!this.worldGenerator) {
            // if no custom world generator is available, use the default one
            this.setWorldGenerator(new wumpusGame.DefaultWorldGenerator());
        }
        
        this.restart();
    };

     /**
      * Clears all tiles.
      */
    wumpusGame.WumpusGame.prototype.clearGame = function() {
        this.grid.foreachTile(function(tile) {
            tile.clearTile();
        });
    };

     /**
      * Sets the current world generator.
      */
    wumpusGame.WumpusGame.prototype.setWorldGenerator = function(worldGenerator) {
        this.worldGenerator = worldGenerator;
    };

     /**
      * Clears (if necessary), initializes and starts the game.
      */
    wumpusGame.WumpusGame.prototype.restart = function() {
        // gen world
        this.worldGenerator.genWorld(this);
        
        // reset game state
        this.wumpusAlive = true;
        this.eventLog = [];
        this.setStatus(wumpusGame.GameStatus.Playing);
        
        // initialize player
        this.player.initializePlayer(this.initialPlayerState);
        this.player.getTile().setObject(wumpusGame.ObjectTypes.Entrance);
        
        // restart script worker
        this.scriptContext.restartWorker();
        
        // notify all listeners
        this.events.restart.notify();
        return true;
    };
    
    /**
     * Sets the current game status.
     * @param {Number} status The status is a numeric value of the wumpusGame.GameStatus enum.
     */
    wumpusGame.WumpusGame.prototype.setStatus = function(status) {
        this.status = status;
        this.events.statusChanged.notify(status);
    };
    
    /**
     * Enforce game rules
     */
    wumpusGame.WumpusGame.prototype.onPlayerEvent = function(player, event, args, playback) {
        var tile = player.getTile();
        
        switch (event) {
            case wumpusGame.PlayerEvent.Move:
                var firstVisit = args.firstVisit;
                
                // apply move penalty
                player.setScore(player.score + this.pointsMove);
                
                // check for object encounters
                if (tile.hasObject(wumpusGame.ObjectTypes.Bats)) {
                    this.onPlayerEvent(player, wumpusGame.PlayerEvent.Teleport);
                }
                else if (tile.hasObject(wumpusGame.ObjectTypes.Pit)) {
                    this.onPlayerEvent(player, wumpusGame.PlayerEvent.DeadPit);
                }
                else if (tile.hasObject(wumpusGame.ObjectTypes.Wumpus) && this.wumpusAlive) {
                    // walked into the arms of a living Wumpus
                    this.onPlayerEvent(player, wumpusGame.PlayerEvent.DeadWumpus);
                }
                else if (tile.hasObject(wumpusGame.ObjectTypes.Gold) && firstVisit) {
                    // stumpled upon and picked up gold
                    this.onPlayerEvent(player, wumpusGame.PlayerEvent.GrabGold);
                }
                break;
            case wumpusGame.PlayerEvent.Turn:
                break;
            case wumpusGame.PlayerEvent.GrabGold:
                // player found and picked up gold
                tile.notifyTileChanged();
                player.setScore(player.score + this.pointsGold);
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
                // player walked onto the Wumpus (also a deadly experience)
                this.setStatus(wumpusGame.GameStatus.Failed);
                break;
            case wumpusGame.PlayerEvent.Exit:
                // player left the dungeon unharmed
                this.setStatus(wumpusGame.GameStatus.Win);
                break;
             default:
                throw new Error("Invalid player event: " + event);
        }
        
        if (!playback) {
            // add log entry
            this.eventLog.push({event: event, args: args});
        }
        
        // call listener callbacks
        this.events.playerEvent.notify(player, event, args);
    }
        
    return wumpusGame;
});
