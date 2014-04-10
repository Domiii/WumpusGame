/**
 * This file loads and starts the game and its UI (if available).
 * TODO: Properly separate UI and Game.
 */
"use strict";

// configure requirejs
require.config({
	baseUrl : "",
	paths : {
		Util: "js/util",
		WumpusGame: "js",
		WumpusUI: "js/ui",
		
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
require(["Util/squishy"], function() { require(["js/GameLoader"], function(game) { require(["WumpusUI/WumpusUI"], function() {
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

	// get all buttons
	var btnForward = squishy.getElementByIdOrDie("wumpus-forward");
	var btnBackward = squishy.getElementByIdOrDie("wumpus-backward");
	var btnTurnCW = squishy.getElementByIdOrDie("wumpus-turncw");
	var btnTurnCCW = squishy.getElementByIdOrDie("wumpus-turnccw");
	var btnRun = squishy.getElementByIdOrDie("wumpus-run");

	// assign actions to buttons
	squishy.onClick(btnForward, function(evt) {
		game.player.performAction(wumpusGame.PlayerAction.Forward);
	});
	squishy.onClick(btnBackward, function(evt) {
		game.player.performAction(wumpusGame.PlayerAction.Backward);
	});
	squishy.onClick(btnTurnCW, function(evt) {
		game.player.performAction(wumpusGame.PlayerAction.TurnClockwise);
	});
	squishy.onClick(btnTurnCCW, function(evt) {
		game.player.performAction(wumpusGame.PlayerAction.TurnCounterClockwise);
	});
	squishy.onClick(btnRun, function(evt) {
		ui.runUserScript();
	});
});});});