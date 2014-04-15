/**
 * This file loads and starts the core game.
 */
 
"use strict";

// TODO: Show info panel -- implement proper UI
// TODO: Proper random generator (not more than one neighboring object per indicator tile)


// load everything and go
define(["WumpusGame/core/WumpusGame"], function() {
    // ####################################################################################################
    // configure the game
    
    squishy.getGlobalContext().DEBUG = true;
    
    
    var gameConfig = {
        // points for different actions
        gameSettings: {
            /**
             * Amount of points for walking on (and automatically picking up) gold.
             */
            pointsGold: 50,
            /**
             * Amount of points for killing the Wumpus.
             */
            pointsKillWumpus: 50,
            /**
             * Penalty for a move (usually -1 or 0).
             */
            pointsMove: -1,
            
            /**
             * Delay between player actions in milliseconds
             */
            playerActionDelay: 200
        },
    
        // configure the grid
        gridConfig: {
            width: 6,
            height: 6
        },
        
        // configure the initial player state
        playerState: {
            position: [0, 0],
            direction: wumpusGame.Direction.Down,
            ammo: 1,
            score: 0
        },
        
        // configure the ScriptContext
        scriptConfig: {
            defaultScriptTimeout: 300
        }
    };


    // ####################################################################################################
    // create & initialize the game
    
    return new wumpusGame.WumpusGame(gameConfig);
});
