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
    squishy.assert(config.gridUIConfig, "config.gridUIConfig is not defined.");
    squishy.assert(config.scriptEditorUIConfig, "config.scriptUIConfig is not defined.");
    
    // set grid
    this.game = game;
    this.editorUI = wumpusGame.makeScriptEditorUI(this, config.scriptEditorUIConfig);
    this.gridUI = wumpusGame.makeGridUI(this, config.gridUIConfig);
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

// /**
 // * 
 // */
// wumpusGame.WumpusUI.prototype. = function() {
// };