/**
 * This file defines the WumpusGame class.
 */
"use strict";

/**
 * Defines the namespace of the Wumpus game.
 */
squishy.exportGlobal("wumpusGame", {});

/**
 * In the wumpus game, there are only four directions.
 */
wumpusGame.Direction = {
    Up : 0,
    Right : 1,
    Down : 2,
    Left : 3,
    
    /**
     * Returns the angle of the given direction in radians, assuming that Up is 0 degrees, and we are rotating clockwise (that is also the frame of reference in CSS3).
     */
    computeAngle : function (dir) {
        return dir * Math.Pi / 2;
    }
};

 /**
  * Constructs a new game.
  * 
  * @param {Object} coreConfig Configuration of the game core.
  * @param {Object} [coreConfig.gridConfig] Grid configuration.
  * @param {Object} [coreConfig.playerState] Initial player state.
  * @param {Object=} uiConfig Configuration of the game UI. There is no UI if this is not given (to run on Node.js etc).
  */
wumpusGame.WumpusGame = function(coreConfig, uiConfig) {
    // create core elements
    this.grid = new wumpusGame.Grid(coreConfig.gridConfig);
    this.player = new wumpusGame.Player(coreConfig.playerState);
    
    if (uiConfig) {
        // create UI
        this.ui = new wumpusGame.WumpusUI(this, uiConfig);
    }
};

 /**
  * Initializes and starts the game.
  */
wumpusGame.WumpusGame.prototype.start = function() {
	// TODO
};