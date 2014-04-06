/**
 * This file contains the definition of the game's grid UI.
 */
"use strict";
 

 /**
  * Creates a new WumpusUI object for managing the UI of the WumpusGame.
  *
  * @param {Object} config Wumpus UI configuration.
  * @param {Element} [config.gameEl] The top-level game container.
  * @param {Element} [config.playerEl] The element that represents the player.
  * @param {Object} [config.gridUIConfig] Configures the grid UI.
  * @param {Object} [config.scriptEditorUIConfig] Configures the ScriptEditor.
  */
wumpusGame.WumpusUI = function(game, config) {
	// sanity checks
    squishy.assert(game, "game is not defined.");
    squishy.assert(config.gameEl, "config.gameEl is not defined.");
    squishy.assert(config.playerEl, "config.playerEl is not defined.");
    squishy.assert(config.toolsEl, "config.toolsEl is not defined.");
    squishy.assert(config.gridUIConfig, "config.gridUIConfig is not defined.");
    squishy.assert(config.scriptEditorUIConfig, "config.scriptUIConfig is not defined.");
    
    // set grid
    this.game = game;
	this.gameEl = $(config.gameEl);
    this.playerEl = $(config.playerEl);
    this.toolsEl = $(config.toolsEl);
    this.scriptEditorUI = wumpusGame.makeScriptEditorUI(this, config.scriptEditorUIConfig);
    this.gridUI = wumpusGame.makeGridUI(this, config.gridUIConfig);
};

/**
 * Determines the layout type and then layouts the entire UI correspondingly.
 */
wumpusGame.WumpusUI.prototype.resetLayout = function() {
    // TODO: Provide different layouts for different window sizes.
    // TODO: Especially consider tall-screen vs. wide-screen. And small vs. big.
	
    // create container for north layout
    var northCont = this.northCotainer || $(document.createElement("div"));
    
	// remove existing layout classes
	var layoutRemover = function (index, className) {
		return className ? (className.match (/\bui-layout-\S+/g) || []).join(' ') : "";
	};
	this.gridUI.removeClass(layoutRemover);
	this.scriptEditorUI.editorEl.removeClass(layoutRemover);
	northCont.removeClass(layoutRemover);
	
	// re-compute layout
	var totalH = $(this.gameEl[0].parentNode).innerHeight();
    var totalW = $(this.gameEl[0].parentNode).innerWidth();
    
    this.gridUI.addClass("ui-layout-center");
    this.toolsEl.addClass("ui-layout-east");
    northCont.addClass("ui-layout-center");
	this.scriptEditorUI.editorContainerEl.addClass("ui-layout-east");
    
    // restructure layout
    northCont.append(this.gridUI);
    northCont.append(this.toolsEl);
    this.gameEl.prepend(northCont);
	
    this.northLayout = northCont.layout({
        applyDefaultStyles: true,
		onresize_end: (function(self) { return self.updateChildLayout.bind(self); })(this),
		//closable: false,
		
		center : {
			minSize : totalW/4,
			size : totalW/2,
		},
		east : {
			minSize : totalW/10,
			size : totalW/6,
		}
    });
    this.UILayout = this.gameEl.layout({
		applyDefaultStyles: true,
		minSize : totalH/4,
		size : totalH/2,
		onresize_end: (function(self) { return self.updateChildLayout.bind(self); })(this),
		//closable: false,
		
		center : {
			minSize : totalW/4,
			size : totalW/2,
		},
		east : {
			minSize : totalW/4,
			size : totalW/2,
		}
	});
	
	this.updateChildLayout();
};

/**
 * Update layout of children.
 */
wumpusGame.WumpusUI.prototype.updateChildLayout = function() {
	var totalH = $(this.gameEl[0].parentNode).innerHeight();
	//this.UILayout.sizePane('south', totalH/2);
	
	this.gridUI.updateGridLayout();
	this.scriptEditorUI.updateScriptEditorLayout();
};

/**
 * This is called whenever a tile is updated (can be caused by layouting, but also by game mechanics).
 */
wumpusGame.WumpusUI.prototype.updateTileStyle = function(tileEl) {
    var tile =  tileEl.tile;
    
	// set player
    if (this.game.player.getTile() == tile) {
        this.movePlayerTile(tileEl);
    }
};

/**
 * Adds the player element to the given tile element.
 */
wumpusGame.WumpusUI.prototype.movePlayerTile = function(tileEl) {
    var w = tileEl.innerWidth() - parseInt(tileEl.css("padding-left"));
    var h = tileEl.innerHeight() - parseInt(tileEl.css("padding-top"));
    
    // reset style
    //this.playerEl.attr("style", "");
    
    // set position & size
    this.playerEl.css({
        left : "0px", 
        top : "0px",
        zIndex : "-1000",
        position : "absolute"
        
    });
    this.playerEl.outerWidth(w, true);     // width includes margin
    this.playerEl.outerHeight(h, true);    // height includes margin
    
    // rotate player
    var direction = this.game.player.direction;
    var angle = wumpusGame.Direction.computeAngle(direction);
    squishy.transformRotation(this.playerEl[0], angle);
    
    // add as first child of tileEl
    tileEl.prepend(this.playerEl);
};