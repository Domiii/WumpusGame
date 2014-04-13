"use strict";

define(["../core/WumpusGame.Def"], function(wumpusGame) {
     /**
      * Constructs a new WorldGenerator base class.
      * 
      * @param {Object} config Generator configuration.
      * @param {Number} [config.nPitRatio] A number between 0 and 1. The ratio of pits to total amount of tiles. This should be less than 0.5. Default = 0.2.
      * @param {Number} [config.nBatsRatio] A number between 0 and 1. The ratio of bat swarms to total amount of tiles. This should be less than 0.5. Default = 0.02.
      * @param {Number} [config.nGold] The number of gold bars. Default = 1.
      * @param {Number} [config.nWumpuses] The number of Wumpuses. Default = 1.
      */
    wumpusGame.DefaultWorldGenerator = function(config) {
        config = config || {};
       
        // set config defaults
        squishy.setIfUndefined(config, "nPitRatio", 0.05);      // Default: For 100 squares, we want 5 pits
        squishy.setIfUndefined(config, "nBatsRatio", 0.1);     // Default: For 100 squares, we want 1 bat swarm
        squishy.setIfUndefined(config, "nGold", 1);             // Default: 1
        squishy.setIfUndefined(config, "nWumpuses", 1);         // Default: 1
        
        // shallow copy config into this object
        squishy.clone(config, false, this);
        
    };

    /**
     * Populates the given game instance.
     */
    wumpusGame.DefaultWorldGenerator.prototype.genWorld = function(game) {
        //this.game = game;
		
		// clear all tiles
		game.clearGame();
        
		// setup
        var w = game.grid.width;
        var nTiles = w * game.grid.height;
        var nPits = Math.ceil(nTiles * this.nPitRatio);
        var nBats = Math.ceil(nTiles * this.nBatsRatio);
        var nGold = this.nGold;
        var nWumpuses = this.nWumpuses;
        
        // generate random tile indices for pits, bats, gold and Wumpuses
        // TODO: To improve performance, use rejection-based algorithm for small and shuffle-based algorithm for large ratios
        
        /**
         * Generates n random numbers between nMin and nMax, inclusively
         */
        var randomN = function(nAmount, nMin, nMax) {
            squishy.assert(nAmount <= nMax - nMin);
            
            var arr = squishy.createArray(nMax - nMin);
            
            // populate
            for (var i = 0; i < nMax-nMin; ++i) {
                arr[i] = i+nMin;
            }
            
            // shuffle
            arr.shuffle();
            
            // return first nAmount elements
            return arr.slice(0, nAmount);
        };
        
        /**
         * Place tiles at the given positions and flag their neighbors.
         */
        var placeObjects = function(indices1D, objectType, neighborFlag) {
            for (var i = 0; i < indices1D.length; ++i) {
                var idx1 = indices1D[i];
                var x = idx1 % w;
                var y = (idx1 - x) / w;
                
                var tile = game.grid.getTile(x, y);
                tile.setObject(objectType);
                
                if (neighborFlag != wumpusGame.TileFlags.None) {
                    game.grid.foreachNeighborOfTile(tile, function(x, y, neighborTile) {
                        neighborTile.setTileFlag(neighborFlag);
                    });
                }
            }
        };
        
        
        // TODO: Avoid placing anything on the starting tile
        // TODO: Make sure, there are possible player paths to all important locations
        // TODO: Allow for a player starting tile, other than (0, 0)
        
        // generate tiles
        var pitIndices1D = randomN(nPits, 1, nTiles-1);
        placeObjects(pitIndices1D, wumpusGame.ObjectTypes.Pit, wumpusGame.TileFlags.Breeze);
        
        var batIndices1D = randomN(nBats, 1, nTiles-1);
        placeObjects(batIndices1D, wumpusGame.ObjectTypes.Bats, wumpusGame.TileFlags.FlappingNoise);
        
        var goldIndices1D = randomN(nGold, 1, nTiles-1);
        placeObjects(goldIndices1D, wumpusGame.ObjectTypes.Gold, wumpusGame.TileFlags.None);
        
        var wumpusIndices1D = randomN(nWumpuses, 1, nTiles-1);
        placeObjects(wumpusIndices1D, wumpusGame.ObjectTypes.Wumpus, wumpusGame.TileFlags.Stench);
        
    };
    return wumpusGame.DefaultWorldGenerator;
});