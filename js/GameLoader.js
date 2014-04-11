/**
 * This file loads and starts the core game.
 */
 
"use strict";

// TODO: Script time out
// TODO: Enforce game rules
// TODO: Stop script Button
// TODO: Show info panel -- implement proper UI

// TODO: Proper random generator (not more than one neighboring object per indicator tile)
// TODO: Better code editor error management

// load everything and go
define(["WumpusGame/core/WumpusGame"], function() {
	// ####################################################################################################
	// configure the game
	
	var coreConfig = {
		// configure the grid
		gridConfig : {
			width : 5,
			height : 5
		},
		
		// configure the initial player state
		playerState : {
			position : [0, 0],
			direction : wumpusGame.Direction.Down,
			ammo : 1,
			score : 0
		}
	};


	// ####################################################################################################
	// create & initialize the game
	
	var game = new wumpusGame.WumpusGame(coreConfig);

	// do something
	game.player.performAction(wumpusGame.PlayerAction.Forward);
	game.player.performAction(wumpusGame.PlayerAction.TurnCounterClockwise);
	game.player.performAction(wumpusGame.PlayerAction.Forward);
	
	return game;
});
