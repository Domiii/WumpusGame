/**
 * This file contains the Grid class, which represents the game environment.
 */
"use strict";


 /**
  * A uniform, dense grid with the given amount of tiles.
  *
  * @param {Object} config The Grid configuration.
  * @param {Number} [config.width] The number of tiles in the horizontal direction.
  * @param {Number} [config.height] The number of tiles in the vertical direction.
  */
wumpusGame.Grid = function(config) {
    // shallow-copy config options into this object
    config.clone(false, this);
    
	// sanity checks
    squishy.assert(config.width > 0, "config.width is not a number greater than zero");
    squishy.assert(config.height > 0, "config.height is not a number greater than zero");
	
	// create tiles
	this.reset();
};

/** 
 * Creates the underlying grid. Removes all existing tiles and other objects within the grid.
 * WARNING: Do not call this, unless you are sure that your grid is not currently in use anywhere else.
 */
wumpusGame.Grid.prototype.reset = function() {
	// create tile array
	this.tiles = squishy.createArray(this.height);
	for (var j = 0; j < this.height; ++j) {
		this.tiles[j] = squishy.createArray(this.width);
		for (var i = 0; i < this.width; ++i) {
			this.tiles[j][i] = new wumpusGame.Tile(this, i, j);
		}
	}
};

/**
 * Iterates over all tiles and calls: callback(x, y, tile)
 */
wumpusGame.Grid.prototype.foreachTile = function(callback) {
	for (var y = 0; y < this.height; ++y) {
		for (var x = 0; x < this.width; ++x) {
			callback(x, y, this.getTile(x, y));
		}
	}
};

/**
 * Returns the tile at the given location.
 */
wumpusGame.Grid.prototype.getTile = function(x, y) {
    return this.tiles[x][y];
};