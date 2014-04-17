/**
 * This file contains the Tile class, which represents one part of the game environment.
 */
 "use strict";
  
define(["./WumpusGame.Def"], function(wumpusGame) {
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
        
        // set contents to default (empty)
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
    
    /**
     * Renders this tile's static contents to a string.
     */
    wumpusGame.Tile.prototype.getContentString = function() {
        var text = "";
        
        if (this.hasObject(wumpusGame.ObjectTypes.Wumpus)) {
            text += "W ";
        }
        if (this.hasObject(wumpusGame.ObjectTypes.Gold)) {
            text += "G ";
        }
        if (this.hasObject(wumpusGame.ObjectTypes.Pit)) {
            text += "P ";
        }
        if (this.hasObject(wumpusGame.ObjectTypes.Bats)) {
            text += "B ";
        }
        if (this.hasObject(wumpusGame.ObjectTypes.Entrance)) {
            text += "E ";
        }
        
        if (this.hasTileFlag(wumpusGame.TileFlags.Stench)) {
            text += "s ";
        }
        if (this.hasTileFlag(wumpusGame.TileFlags.Breeze)) {
            text += "b ";
        }
        if (this.hasTileFlag(wumpusGame.TileFlags.FlappingNoise)) {
            text += "f ";
        }
        return text;
    };
    
    return wumpusGame.Tile;
});