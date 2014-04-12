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
        
		
		// create core objects
		this.grid = new wumpusGame.Grid(this, config.gridConfig);
		this.player = new wumpusGame.Player(this);
		this.scriptContext = new WorkerScriptContext(this);
		
		// create event objects
		this.events = {
			tileChanged: new squishy.Event(this),
			restart: new squishy.Event(this),
            scriptError: new squishy.Event(this),
            statusChanged: new squishy.Event(this),
            playerStateChanged: new squishy.Event(this),
            playerEvent: new squishy.Event(this),
		};
		
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
		
		// initialize player
		this.player.initializePlayer(this.initialPlayerState);
        this.player.getTile().setObject(wumpusGame.ObjectTypes.Entrance);
		
		// restart script worker
		this.scriptContext.restartWorker();
        
        // 
        this.setStatus(wumpusGame.GameStatus.Playing);
		
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
    wumpusGame.WumpusGame.prototype.onPlayerAction = function(action) {
        var player = this.player;
        var tile = player.getTile();
        
        if (wumpusGame.PlayerAction.isMove(action)) {
            // apply move penalty
            player.setScore(player.score + this.pointsMove);
            if (tile.hasObject(wumpusGame.ObjectTypes.Pit)) {
                // player fell into a pit
                this.setStatus(wumpusGame.GameStatus.Failed);
            }
            else if (tile.hasObject(wumpusGame.ObjectTypes.Wumpus)) {
                // player walked onto the Wumpus (also a deadly experience)
                this.setStatus(wumpusGame.GameStatus.Failed);
            }
            if (tile.hasObject(wumpusGame.ObjectTypes.Gold)) {
                // player found and picked up gold
                tile.removeObject(wumpusGame.ObjectTypes.Gold);
                tile.notifyTileChanged();
                player.setScore(player.score + this.pointsGold);
            }
            if (tile.hasObject(wumpusGame.ObjectTypes.Bats)) {
                // bats teleport player to a random location
                var tileX = squishy.randomInt(0, this.grid.width-1);
                var tileY = squishy.randomInt(0, this.grid.height-1);
                
                this.player.movePlayer([tileX, tileY]);
            }
        }
        else if (action == wumpusGame.PlayerAction.Exit) {
            // apply move penalty
            if (tile.hasObject(wumpusGame.ObjectTypes.Entrance)) {
                this.setStatus(wumpusGame.GameStatus.Win);
            }
        }
    };
    	
	return wumpusGame;
});
