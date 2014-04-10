/**
 * This file defines the WumpusGame class.
 */
"use strict";

define(["./WumpusGame.Def", "./Tile", "./Grid",  "./Player", "./WorkerScriptContext", "../user/DefaultWorldGenerator"], function(wumpusGame, Tile, Grid, Player, WorkerScriptContext) {
	 /**
	  * Constructs a new game.
	  * @constructor 
	  */
	wumpusGame.WumpusGame = function() {
	};

	 /**
	  * Clears the entire game.
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
	  *
	  * @param {Object} coreConfig Configuration of the game core.
	  * @param {Object} [coreConfig.gridConfig] Grid configuration.
	  * @param {Object} [coreConfig.playerState] Initial player state.
	  */
	wumpusGame.WumpusGame.prototype.restart = function(coreConfig) {
		// create core objects
		this.grid = new wumpusGame.Grid(this, coreConfig.gridConfig);
		this.player = new wumpusGame.Player(this, coreConfig.playerState);
		this.scriptContext = new WorkerScriptContext(this);
		
		// create event objects
		this.events = {
			tileChanged : new squishy.Event(this),
			restart : new squishy.Event(this)
		};
		
		// clear the playing field
		this.clearGame();
		
		if (!this.worldGenerator) {
			// if no custom world generator is available, use the default one
			this.setWorldGenerator(new wumpusGame.DefaultWorldGenerator());
		}
		
		// gen world
		this.worldGenerator.genWorld(this);
		
		// initialize player
		this.player.initializePlayer();
		
		// start script worker
		this.scriptContext.startWorker();
		
		// notify all listeners
		this.events.restart.notify();
		
		return true;
	};
    
	return wumpusGame;
});