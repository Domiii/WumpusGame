/**
 * This file contains the Tile class, which represents one part of the game environment.
 */
 "use strict";
 
 
 /**
  * The state of each tile is comprised of a set of objects and a set of indicators.
  * These are all object types.
  * Note that objects are not mutually exclusive.
  * (E.g. there can be a Wumpus hanging on the side of the walls of a pit which contains gold, with bats hovering above.)
  */
wumpusGame.ObjectTypes = {
    None : 0x00,
    Wumpus : 0x01,
    Pit : 0x02,
    Gold : 0x04,
    Bats : 0x08
};
wumpusGame.ObjectTypes.AllNames = Object.keys(wumpusGame.ObjectTypes);
    
 /**
  * The state of each tile is comprised of an object and a set of indicator flags.
  * These are all indicator flags.
  * Note that flags are not mutually exclusive.
  */
wumpusGame.TileFlags = {
    None : 0x00,
    Stench : 0x01,
    Breeze : 0x02,
    Glitter : 0x04,
    FlappingNoise : 0x08
};
wumpusGame.TileFlags.AllNames = Object.keys(wumpusGame.TileFlags);

 
 
/**
 * Constructs a new tile. A tile can contain one or zero object of any type, and one or zero tile indicator flags.
 *
 * @param {Number} objects The current objects in this tile, as a combination of wumpusGame.ObjectTypes.
 * @param {Number} flags The current flags are a combination of wumpusGame.TileFlags.
 */
wumpusGame.Tile = function(grid, x, y, objects, flags) {
    this.grid = grid;
	this.x = x;
    this.y = y;
    this.objects = objects;
    this.flags = flags;
};

/**
 * Sets wumpusGame.TileFlags.
 */
wumpusGame.Tile.prototype.setTileFlag = function(flag) {
    this.flags = squishy.setFlag(this.flags, flag);
};

/**
 * Removes wumpusGame.TileFlags.
 */
wumpusGame.Tile.prototype.removeTileFlag = function(flag) {
    this.flags = squishy.removeFlag(this.flags, flag);
};

/**
 * Sets wumpusGame.ObjectTypes.
 */
wumpusGame.Tile.prototype.setObject = function(objectType) {
    this.flags = squishy.setFlag(this.objects, objectType);
};

/**
 * Removes wumpusGame.ObjectTypes.
 */
wumpusGame.Tile.prototype.removeObject = function(objectType) {
    this.flags = squishy.removeFlag(this.objects, objectType);
};