/**
 * This file defines the WumpusGame class.
 */
"use strict";

/**
 * Defines the namespace of the Wumpus game.
 */
squishy.exportGlobal("wumpusGame", {});


define(["./Tile", "./Grid",  "./Player", "./ScriptWorker", "../user/DefaultWorldGenerator"], function() {
	/**
	 * In the wumpus game, there are only four directions.
	 * @const
	 */
	wumpusGame.Direction = {
		Up : 0,
		Right : 1,
		Down : 2,
		Left : 3,
		
		/**
		 * Returns the angle of the given direction in radians, assuming that Up is 0 degrees, and we are rotating clockwise (that is also the frame of reference in CSS3).
		 */
		computeAngle : function(direction) {
			return direction * Math.PI / 2;
		},
		
		/**
		 * Returns the opposite direction of the given direction.
		 */
		getOppositeDirection : function(direction) {
			return (direction + 2) % 4;
		},
		
		/**
		 * Returns the given direction turned by one unit in the clockwise or counter-clockwise direction.
		 */
		getTurnedDirection : function(direction, turnClockwise) {
			if (turnClockwise) {
				return (direction + 1) % 4;
			}
			else {
				// ccw
				return (direction + 3) % 4;
			}
		}
	};

	/**
	 * All possible player actions.
	 * @const
	 */
	wumpusGame.PlayerAction = {
		Forward : 0,
		Backward : 1,
		TurnClockwise : 2,
		TurnCounterClockwise : 3
	};

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
		
		// notify all listeners
		this.events.restart.notify();
		
		return true;
	};
	return wumpusGame;
});