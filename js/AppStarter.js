/**
 * This file loads and starts the game and its UI (if available).
 */
"use strict";

// configure requirejs
require.config({
	baseUrl : "",
	paths : {
		Util: "js/util",
		WumpusGame: "js",
		WumpusUI: "js/ui",
		squishy: "js/util/squishy",
		
		ace: "lib/ace",
		jquery: "lib/jquery/jquery-2.1.0.min",
		jquery_ui: "lib/jquery/jquery-ui-1.10.4.min",
		jquery_ui_layout: "lib/jquery/jquery.layout-1.3.0-rc30.79.min"
	},
	shim: {
		jquery: { exports: '$' },
		jquery_ui: { deps: ['jquery'] },
		jquery_ui_layout: { deps: ['jquery', 'jquery_ui'] }
	}
});


// load game and initialize UI
require(["squishy"], function() { require(["js/GameLoader"], function(game) { require(["WumpusUI/WumpusUI"], function() {
	/** Game UI files */

	// ####################################################################################################
	// configure the UI

	// get UI elements
	var gameEl = squishy.getElementByIdOrDie("wumpus-game");
	var gridEl = squishy.getElementByIdOrDie("wumpus-grid");
	var playerEl = squishy.getElementByIdOrDie("wumpus-player");
	var toolsEl = squishy.getElementByIdOrDie("wumpus-tools");
	var tileElTemplate = squishy.getElementByIdOrDie("wumpus-grid-tile");
	var scriptEditorEl = squishy.getElementByIdOrDie("script-editor");
	
	var uiConfig = {
		visiblity : wumpusGame.WumpusUI.Visibility.AllFoggy,
		gameEl : gameEl,
		playerEl : playerEl,
		toolsEl : toolsEl,
			
		// configure the grid UI
		gridUIConfig : {
			gridEl : gridEl,
			tileElTemplate : tileElTemplate,
			gridMinSize : [500, 500],            // width and height in pixels
			tileMinSize : [60, 60]              // width and height in pixels
		},
		
		// configure the script editor
		scriptEditorUIConfig : {
			editorEl : scriptEditorEl
		}
	};
	
	// create UI
	var ui = new wumpusGame.WumpusUI(game, uiConfig);
	
	// re-compute layout and style
	ui.resetLayout();
	
	
	
	// ####################################################################################################
	// setup buttons

	var runScriptBtn = squishy.getElementByIdOrDie("wumpus-run");
	squishy.onClick("wumpus-restart", function(evt) {
		ui.game.restart();
	});
	squishy.onClick(runScriptBtn, function(evt) {
		
		ui.runUserScript();
	});
	
	squishy.onClick("wumpus-forward", function(evt) {
		game.player.performAction(wumpusGame.PlayerAction.Forward);
	});
	squishy.onClick("wumpus-backward", function(evt) {
		game.player.performAction(wumpusGame.PlayerAction.Backward);
	});
	squishy.onClick("wumpus-turncw", function(evt) {
		game.player.performAction(wumpusGame.PlayerAction.TurnClockwise);
	});
	squishy.onClick("wumpus-turnccw", function(evt) {
		game.player.performAction(wumpusGame.PlayerAction.TurnCounterClockwise);
	});
});});});