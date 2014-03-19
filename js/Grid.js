/**
 * 
 */
 

 /**
  * A uniform, dense grid with the given amount of tiles.
  *
  * @param {Object} config The MapView component and settings.
  * @param {Element} [config.gridEl] The underlying DOM element of the grid.
  * @param {Element} [config.tileElTemplate] The underlying DOM element of a grid tile. All tile elements will be copies of this element.
  * @param {Element} [config.width] The number of tiles in the horizontal direction.
  * @param {Element} [config.height] The number of tiles in the vertical direction.
  */
squishy.Grid = function(config) {
    // shallow-copy config options into this object
    config.clone(false, this);
    
	// sanity checks
    squishy.assert(config.gridEl, "config.gridEl is not defined.");
    squishy.assert(config.tileElTemplate, "config.tileElTemplate is not defined.");
    squishy.assert(config.width > 0, "config.width is not a number greater than zero");
    squishy.assert(config.height > 0, "config.height is not a number greater than zero");
	
	// create tiles
	this.reset();
};

/** 
 * Creates the underlying grid. Removes all existing tiles and other objects within the grid.
 * WARNING: Do not call this, unless you are sure that your grid is not currently in use anywhere else.
 */
squishy.Grid.prototype.reset = function() {
	// create tile array
	this.tiles = squishy.createArray(this.height);
	for (var j = 0; j < this.height; ++j) {
		this.tiles[j] = squishy.createArray(this.width);
		for (var i = 0; i < this.width; ++i) {
			this.tiles[j][i] = new squishy.Tile(this, i, j);
		}
	}
};

/**
 * 
 */
squishy.Tile = function(grid, x, y) {
	
};