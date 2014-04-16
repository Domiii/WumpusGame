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
        
    var gridUI = $(config.gridEl);

    // shallow-copy config options into the grid element.
    squishy.clone(config, false, gridUI);
    gridUI.gameUI = gameUI;
    
    
    // #################################################################################
    // GridUI initialization
    var grid = gameUI.game.grid;
    
    gridUI.tileElements = squishy.createArray(grid.height);
    for (var j = 0; j < grid.height; ++j) {
        gridUI.tileElements[j] = squishy.createArray(grid.width);
        for (var i = 0; i < grid.width; ++i) {
            var tileEl = wumpusGame.createTileElement(gridUI, grid.getTile(i, j));
            gridUI.tileElements[j][i] = tileEl;
            gridUI.append(tileEl);
        }
    }
    
    // #################################################################################
    // GridUI functions
    
    /**
     * Re-compute layout.
     */
    gridUI.updateGridLayout = function() {
        var grid = this.gameUI.game.grid;
        
        // re-compute each tile's layout
        for (var j = 0; j < grid.height; ++j) {
            for (var i = 0; i < grid.width; ++i) {
                this.tileElements[j][i].updateTileLayout();
            }
        }
    };
    
    
    /**
     * Get the tile at the given index.
     */
    gridUI.getTile = function(x, y) {
        return this.tileElements[y][x];
    };
    
    
    /**
     * Update the tile's style at the given index
     */
    gridUI.updateTileStyle = function(x, y) {
        var tile = this.getTile(x, y);
        tile.updateTileStyle();
    };
    
    
    /**
     * Compute tile width and height.
     */
    gridUI.getTileSize = function(size) {
        var grid = this.gameUI.game.grid;
        var w = this.innerWidth() / grid.width;            // actual width, given by the current grid size
        var h = this.innerHeight() / grid.height;        // actual height, given by the current grid size
        
        // make the tiles square
        w = Math.min(w, h);
        h = w;
        
        size[0] = Math.max(w, this.tileMinSize[0]);
        size[1] = Math.max(h, this.tileMinSize[1]);
    };
    
    return gridUI;
};


// #######################################################################################
// Tile elements
    
/**
 * Creates a new Tile DOM element to visualize the given tile.
 */
wumpusGame.createTileElement = function(gridUI, tile) {
    squishy.assert(gridUI, "gridUI is not defined.");
    squishy.assert(tile, "tile is not defined.");
    
    var tileElTemplate = gridUI.tileElTemplate;
    var tileEl = $(tileElTemplate.cloneNode(true));
    tileEl.gridUI = gridUI;
    tileEl.tile = tile;
    
    // set default style
    tileEl.css('display', 'block');
    tileEl.css('position', 'absolute');

    /**
     * Re-computes size and position of the tile or the given other element.
     */
    tileEl.updateTileLayout = function() {
        var tile = this.tile;
        
        // determine size and index
        if (!this.tileSize) {
            this.tileSize = squishy.createArray(2);
        }
        this.gridUI.getTileSize(this.tileSize);
        var w = this.tileSize[0];
        var h = this.tileSize[1];
        var i = tile.tilePosition[0];
        var j = tile.tilePosition[1];
        
        // set position & size
        this.css({left : (w * i) + "px", top : (h * j) + "px"});
        this.outerWidth(w, true);     // width includes margin
        this.outerHeight(h, true);    // height includes margin
        
        // update style
        this.updateTileStyle();
    };
    
    
    /**
     * Re-compute rendering of this tile.
     */
    tileEl.updateTileStyle = function() {
        var tile = this.tile;
        
        // remove all inner elements (slow version)
        this[0].innerHTML = "";
        
        // add style for visited status
        if (!tile.visited) {
            this.addClass("tile_notvisited");
        }
        else {
            this.removeClass("tile_notvisited");
        }
        
        if (tile.visited || this.gridUI.gameUI.visibility == wumpusGame.WumpusUI.Visibility.All) {
            // render objects and object indicators
            var text = tile.getContentString();
            var w = tileEl.innerWidth();
            var shortText = squishy.truncateText(text, "14px arial", w);
            this.textCont =  this.textCont || $(document.createElement("div"));
            this.textCont.css("position", "absolute");
            this.textCont[0].innerHTML = shortText;
            if (!this.textCont[0].parentNode) {
                tileEl[0].appendChild(this.textCont[0]);
            }
            tileEl.attr("title", text);
        }
        
        // add other decorations
        this.gridUI.gameUI.updateTileStyle(this);
    };
    
    return tileEl;
};