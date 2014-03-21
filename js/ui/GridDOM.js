/**
 * 
 */
 

 /**
  * A uniform, dense grid with the given amount of tiles.
  *
  * @param {Object} config The MapView component and settings.
  * @param {Element} [config.gridEl] The actual element of the grid.
  * @param {Element} [config.tileElTemplate] The underlying DOM element of a grid tile. All tile elements will be copies of this element.
  * @param {Element} [config.grid] The actual grid.
  * @param {Element} [config.height] The number of tiles in the vertical direction.
  */
searchGame.makeGrid = function(config) {
	// sanity checks
    squishy.assert(config.gridEl, "config.gridEl is not defined.");
    squishy.assert(config.grid, "config.grid is not defined.");
    squishy.assert(config.tileElTemplate, "config.tileElTemplate is not defined.");
    
    var el = config.gridEl;
    
    // shallow-copy config options into the grid element.
    config.clone(false, el);
	
	// create tiles
	this.reset();
};

/** 
 * Creates the underlying DOM. Removes all existing tiles and other objects within the grid.
 * WARNING: Do not call this, unless you are sure that your grid is not currently in use anywhere else.
 */
searchGame.GridDOM.prototype.reset = function() {
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
searchGame.Tile = function(grid, x, y) {
	
};