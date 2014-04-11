/**
 * This file contains the Tile class, which represents one part of the game environment.
 */
 "use strict";
  
define(["./WumpusGame.Def"], function(wumpusGame) {
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
        FlappingNoise : 0x04
    };
    wumpusGame.TileFlags.AllNames = Object.keys(wumpusGame.TileFlags);

     
     
    /**
     * Constructs a new tile. A tile can contain one or zero object of any type, and one or zero tile indicator flags.
     *
     * @constructor
     * @param {Number} objects The current objects in this tile, as a combination of wumpusGame.ObjectTypes.
     * @param {Number} flags The current flags are a combination of wumpusGame.TileFlags.
     */
    wumpusGame.Tile = function(grid, x, y, objects, tileFlags) {
        this.grid = grid;
        this.tilePosition = [x, y];
        this.clearTile();
        
        // Set unique tile id. This can be used to more easily identify this tile.
        this.tileId = y * grid.width + x;
    };

    /**
     * Returns the neighbor tile in the given direction or null if there is none.
     */
    wumpusGame.Tile.prototype.getTilePosition = function() {
        return this.tilePosition;
    };


    /**
     * Returns the neighbor tile in the given direction or null if there is none.
     */
    wumpusGame.Tile.prototype.getNeighborTile = function(direction) {
        var pos = this.tilePosition;
        if (direction === wumpusGame.Direction.Up) {
            return this.grid.getTile(pos[0], pos[1] - 1);
        }
        if (direction === wumpusGame.Direction.Down) {
            return this.grid.getTile(pos[0], pos[1] + 1);
        }
        if (direction === wumpusGame.Direction.Left) {
            return this.grid.getTile(pos[0] - 1, pos[1]);
        }
        if (direction === wumpusGame.Direction.Right) {
            return this.grid.getTile(pos[0] + 1, pos[1]);
        }
        
        squishy.assert(false, "Invalid direction: " + direction);
    };


    /**
     * Clears this tile.
     *
     * @sealed
     */
    wumpusGame.Tile.prototype.clearTile = function() {
        this.objects = wumpusGame.ObjectTypes.None;
        this.tileFlags = wumpusGame.TileFlags.None;
        this.visited = false;
    };

    /**
     * Checks if a given wumpusGame.ObjectType is set for this tile.
     */
    wumpusGame.Tile.prototype.hasTileFlag = function(tileFlag) {
        return this.tileFlags & tileFlag;
    };

    /**
     * Sets wumpusGame.TileFlags.
     */
    wumpusGame.Tile.prototype.setTileFlag = function(flag) {
        this.tileFlags = squishy.setFlag(this.tileFlags, flag);
    };

    /**
     * Removes wumpusGame.TileFlags.
     */
    wumpusGame.Tile.prototype.removeTileFlag = function(flag) {
        this.tileFlags = squishy.removeFlag(this.tileFlags, flag);
    };


    /**
     * Checks if a given wumpusGame.ObjectTypes is set for this tile.
     */
    wumpusGame.Tile.prototype.hasObject = function(objectType) {
        return this.objects & objectType;
    };

    /**
     * Sets wumpusGame.ObjectTypes.
     */
    wumpusGame.Tile.prototype.setObject = function(objectType) {
        this.objects = squishy.setFlag(this.objects, objectType);
    };

    /**
     * Removes wumpusGame.ObjectTypes.
     */
    wumpusGame.Tile.prototype.removeObject = function(objectType) {
        this.objects = squishy.removeFlag(this.objects, objectType);
    };

    /**
     * Sets the visited status of this tile.
     */
    wumpusGame.Tile.prototype.markTileVisited = function(visited) {
        this.visited = !squishy.isDefined(visited) ? true : visited == true;
    };

    /**
     * Notify listeners that this tile has changed.
     */
    wumpusGame.Tile.prototype.notifyTileChanged = function() {
        this.grid.game.events.tileChanged.notify(this);
    };
    
    return wumpusGame.Tile;
});