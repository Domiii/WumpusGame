/**
 * This file loads and starts the game and its UI (if available).
 */
"use strict";

// configure requirejs
require.config({
    baseUrl : "",
    paths : {
        Lib: "lib",
    
        Util: "js/util",
        Squishy: "../SimplePlatformer/lib/squishy/squishy",
        Localizer: "lib/localizer",
        
        WumpusGame: "js",
        WumpusUI: "js/ui",
        
        ace: "lib/ace",
        
        jquery_root: "lib/jquery",
        jquery: "lib/jquery/jquery-2.1.0.min",
        jqm: "lib/jquery_mobile/jquery.mobile-1.4.2.min"
    },
    shim: {
        jquery: { exports: '$' },
        jqm: { deps: ['jquery'] }
    }
});


// load game and initialize UI
require(["Squishy"], function() { require(["js/GameLoader"], function(game) { require(["WumpusUI/WumpusUI"], function() {
    /** Game UI files */

    // ####################################################################################################
    // configure the UI

    // get UI elements
    var gameEl = squishy.getElementByIdOrDie("wumpus-game");
    var gridEl = squishy.getElementByIdOrDie("wumpus-grid");
    var playerEl = squishy.getElementByIdOrDie("wumpus-player");
    var headerEl = $("[data-role=header]");
    var footerEl = $("[data-role=footer]");
    var tileElTemplate = squishy.getElementByIdOrDie("wumpus-grid-tile");
    var scriptEditorEl = squishy.getElementByIdOrDie("script-editor");
    
    var uiConfig = {
        visiblity : wumpusGame.WumpusUI.Visibility.Visited,    // only display visited tiles
        gameEl : gameEl,
        playerEl : playerEl,
        headerEl : headerEl,
        footerEl : footerEl,
        infoTimeout: 3000,                    // time in milliseconds until a notification fades
            
        // configure the grid UI
        gridUIConfig : {
            gridEl: gridEl,
            tileElTemplate: tileElTemplate,
            gridMinSize: [500, 500],            // width and height in pixels
            tileMinSize: [60, 60],              // width and height in pixels
        },
        
        // configure the script editor
        scriptEditorUIConfig : {
            editorEl : scriptEditorEl
        }
    };
    
    // create UI
    var ui = new wumpusGame.WumpusUI(game, uiConfig);
    

    // ####################################################################################################
    // do something
    
    // game.player.performActionDelayed(wumpusGame.PlayerAction.Forward);
    // game.player.performActionDelayed(wumpusGame.PlayerAction.TurnCounterClockwise);
    // game.player.performActionDelayed(wumpusGame.PlayerAction.Forward);
});});});