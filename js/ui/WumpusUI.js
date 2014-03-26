/**
 * This file contains the definition of the game's grid UI.
 */
"use strict";
 

 /**
  * Creates a new WumpusUI object for managing the UI of the WumpusGame.
  *
  * @param {Object} config Wumpus UI configuration.
  * @param {Element} [config.gridUIConfig] Configures the grid UI.
  * @param {Element} [config.scriptEditorUIConfig] Configures the ScriptEditor.
  */
wumpusGame.WumpusUI = function(game, config) {
	// sanity checks
    squishy.assert(game, "game is not defined.");
    squishy.assert(config.gameEl, "config.gameEl is not defined.");
    squishy.assert(config.gridUIConfig, "config.gridUIConfig is not defined.");
    squishy.assert(config.scriptEditorUIConfig, "config.scriptUIConfig is not defined.");
    
    // set grid
    this.game = game;
	this.gameEl = $(gameEl);
    this.scriptEditorUI = wumpusGame.makeScriptEditorUI(this, config.scriptEditorUIConfig);
    this.gridUI = wumpusGame.makeGridUI(this, config.gridUIConfig);
    
    // layouting
    
    // layout the whole thing
    $(document).ready((function (self) {
        return function() {
            self.updateLayout();
        };
    })(this));
};

/**
 * Determines the layout type and then layouts the entire UI correspondingly.
 */
wumpusGame.WumpusUI.prototype.updateLayout = function() {
    // TODO: Provide different layouts for different window sizes.
    // TODO: Especially consider tall-screen vs. wide-screen. And small vs. big.
	
	// remove layouting
	var layoutRemover = function (index, className) {
		return className ? (className.match (/\bui-layout-\S+/g) || []).join(' ') : "";
	};
	this.gridUI.removeClass(layoutRemover);
	this.scriptEditorUI.editorEl.removeClass(layoutRemover);
	
	// re-compute layout
	var totalH = $(this.gameEl[0].parentNode).innerHeight();
    this.gridUI.addClass("pane").addClass("ui-layout-center");
	this.scriptEditorUI.editorContainerEl.addClass("pane").addClass("ui-layout-south");
    
	// TODO: Re-compute height every time
	// TODO: Figure out why resizing won't work...
	
    this.UILayout = this.gameEl.layout({ 
		applyDefaultStyles: true,
		resizable: true,
		livePaneResizing : true,
		minSize : totalH/4,
		size : totalH/2,
		onresize_end: (function(self) { return self.updateChildLayout.bind(self); })(this),
		//closable: false,
		
		center : {
			minSize : totalH/4,
			size : totalH/2,
		},
		south : {
			minSize : totalH/4,
			size : totalH/2,
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

// /**
 // * 
 // */
// wumpusGame.WumpusUI.prototype. = function() {
// };