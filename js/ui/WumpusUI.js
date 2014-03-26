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
    this.editorUI = wumpusGame.makeScriptEditorUI(this, config.scriptEditorUIConfig);
    this.gridUI = wumpusGame.makeGridUI(this, config.gridUIConfig);
    
    // layouting
    
    // layout the whole thing
    $(document).ready((function (self) {
        return function() {
            self.doLayout();
        };
    })(this));
};

/**
 * Determines the layout type and then layouts the entire UI correspondingly.
 */
wumpusGame.WumpusUI.prototype.doLayout = function() {
    // TODO: Provide different layouts for different window sizes.
    // TODO: Especially consider tall-screen vs. wide-screen. And small vs. big.
    
    var gameEl = this.gameEl;
    var gridEl = this.gridUI;
    var editorEl = this.editorUI;
    
    // TODO: Layouting
    
    $('body').layout({ applyDefaultStyles: true });
};

// /**
 // * 
 // */
// wumpusGame.WumpusUI.prototype. = function() {
// };

// /**
 // * 
 // */
// wumpusGame.WumpusUI.prototype. = function() {
// };