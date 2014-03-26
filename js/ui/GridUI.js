/**
 * This file contains the definition of the game's grid UI.
 */
"use strict";
 

 /**
  * Promotes the given grid DOM element to a full blown grid UI.
  *
  * @param {Object} config Grid UI configuration.
  * @param {Element} [config.grid] The actual grid.
  * @param {Element} [config.gridEl] The actual element of the grid.
  * @param {Object} [config.tileElTemplate] A (possibly invisible) DOM element, representing any tile element.
  * @param {Array} [config.gridMinSize] Two-element array containing min grid width and height in pixels.
  * @param {Array} [config.tileMinSize] Two-element array containing min tile width and height in pixels.
  */
wumpusGame.makeGridUI = function(gameUI, config) {
	// sanity checks
    squishy.assert(gameUI, "gameUI is not defined.");
    squishy.assert(gameUI.game.grid, "gameUI.game.grid is not defined.");
    squishy.assert(config.gridEl, "config.gridEl is not defined.");
    squishy.assert(config.tileElTemplate, "config.tileElTemplate is not defined.");
    squishy.assert(config.gridMinSize, "config.gridMinSize is not defined.");
    squishy.assert(config.tileMinSize, "config.tileMinSize is not defined.");
    
	(function (gridUI) {
		var grid = gameUI.game.grid;
		var jGridUI = $(gridUI);
		
		// shallow-copy config options into the grid element.
		config.clone(false, gridUI);
		
		// set position of tile elements to absolute
		jGridUI.css({position : "absolute"});
		
		
		// #################################################################################
		// GridUI functions
		
		/**
		 * Compute tile width and height.
		 */
		gridUI.getTileSize = function(size) {
			var w = this.gridMinSize[0] / grid.width;
			var h = this.gridMinSize[1] / grid.height;
			
			size[0] = Math.min(w, this.tileMinSize[0]);
			size[1] = Math.min(h, this.tileMinSize[1]);
		};
	
		// #################################################################################
		// GridUI initialization
		
		gridUI.gameUI = gameUI;
		
		// create tile elements
		gridUI.tileElements = squishy.createArray(grid.height);
		for (var j = 0; j < grid.height; ++j) {
			gridUI.tileElements[j] = squishy.createArray(grid.width);
			for (var i = 0; i < grid.width; ++i) {
				var tileEl = wumpusGame.createTileElement(gridUI, grid.getTile(i, j));
                gridUI.tileElements[j][i] = tileEl;
                gridUI.appendChild(tileEl);
			}
		}
		
	})(config.gridEl);
	return config.gridEl;
};

/**
 * Creates a new Tile DOM element to visualize the given tile.
 */
wumpusGame.createTileElement = function(gridUI, tile) {
    squishy.assert(gridUI, "gridUI is not defined.");
    squishy.assert(tile, "tile is not defined.");
    
    var tileElTemplate = gridUI.tileElTemplate;
    var tileEl = tileElTemplate.cloneNode(true);
    tileEl.gridUI = gridUI;
    tileEl.tile = tile;
        
    /**
     * Updates the rendering of this tile.
     */
    tileEl.updateTile = function() {
        var tile = this.tile;
        
        // determine size and index
        var jTileEl = $(this);
        if (!this.tileSize) {
            this.tileSize = squishy.createArray(2);
        }
        this.gridUI.getTileSize(this.tileSize);
        var w = this.tileSize[0];
        var h = this.tileSize[1];
        var i = tile.x;
        var j = tile.y;
        
        // set width, height and position
        jTileEl.outerWidth(w, true);     // width includes margin
        jTileEl.outerHeight(h, true);    // height includes margin
        jTileEl.css({left : (w * i) + "px", top : (h * j) + "px"});
        jTileEl.css('position', 'absolute');
        jTileEl.css('display', 'block');
    };
    
    // update tile
    tileEl.updateTile();
    
    return tileEl;
};