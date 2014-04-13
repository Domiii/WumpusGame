/**
 * This file contains the definition of the game's UI.
 */
"use strict";
 
define(["./GridUI", "./ScriptEditorUI", "jquery", "jquery_ui", "jquery_ui_layout", "./Notifier"], function() {
	 /**
	  * Creates a new WumpusUI object for managing the UI of the WumpusGame.
	  *
	  * @param {Object} config Wumpus UI configuration.
	  * @param {wumpusGame.WumpusUI.Visibility} [config.visibility] Determines what the player can see.
	  * @param {Element} [config.gameEl] The top-level game container.
	  * @param {Element} [config.playerEl] The element that represents the player.
	  * @param {Element} [config.toolsEl] The element that represents the tools bar.
	  * @param {Element} [config.footerEl] The element that represents footer.
	  * @param {Object} [config.gridUIConfig] Configures the grid UI.
	  * @param {Object} [config.scriptEditorUIConfig] Configures the ScriptEditor.
	  */
	wumpusGame.WumpusUI = function(game, config) {
		// sanity checks
		squishy.assert(game, "game is not defined.");
		squishy.assert(config.gameEl, "config.gameEl is not defined.");
		squishy.assert(config.playerEl, "config.playerEl is not defined.");
		squishy.assert(config.toolsEl, "config.toolsEl is not defined.");
		//squishy.assert(config.footerEl, "config.footerEl is not defined.");
		squishy.assert(config.gridUIConfig, "config.gridUIConfig is not defined.");
		squishy.assert(config.scriptEditorUIConfig, "config.scriptUIConfig is not defined.");
		
		// setup UI
		this.visibility = !!config.visibility;		// force to bool
		this.game = game;
		this.gameEl = $(config.gameEl);
		this.playerEl = $(config.playerEl);
		this.toolsEl = $(config.toolsEl);
		this.scriptEditor = wumpusGame.makeScriptEditorUI(this, config.scriptEditorUIConfig);
		this.gridUI = wumpusGame.makeGridUI(this, config.gridUIConfig);
        
        this.scriptNotifications = new NotificationList({containerElement : this.scriptEditor.editorContainerEl});
        this.gameNotifications = new NotificationList({containerElement : this.gridUI});
		
		// setup listeners
        (function(ui) {
            ui.game.events.tileChanged.addListener(function(tile) {
                // update tile rendering
                ui.gridUI.updateTileStyle(tile.tilePosition[0], tile.tilePosition[1]);
            });
            ui.game.events.restart.addListener(function() {
                // reset all tiles
                ui.game.grid.foreachTile(function(tile) {
                    ui.gridUI.updateTileStyle(tile.tilePosition[0], tile.tilePosition[1]);
                });
            });
            ui.game.events.scriptError.addListener(function(message, stacktrace) {
                // display notification
                var frame = stacktrace[0];
                var info = (frame.functionName ? "from " + frame.functionName + "()" : "") + " - line " + frame.line + ", column " + frame.column + "\n";
                for (var i = 1; i < stacktrace.length; ++i) {
                    frame = stacktrace[i];
                    info += "called " + (frame.functionName ? " from " + frame.functionName + "() at " : "") + frame.line + ":" + frame.column + "\n";
                }
                
                ui.scriptNotifications.error(info, "ERROR: " + message, true);
            });
            ui.game.events.statusChanged.addListener(function(status) {
                // status changed
                switch (status) {
                    case wumpusGame.GameStatus.Failed:
                        ui.gameNotifications.error("You have fallen prey to the dangers of the Wumpus dungeon.", "Game Over", false);   
                        break;
                    case wumpusGame.GameStatus.Win:
                        ui.gameNotifications.success("You made it out alive with score: " + ui.game.player.score + "", "Congratulations!", false);
                        break;
                    case wumpusGame.GameStatus.Playing:
                        // clear previous notification(s)
                        ui.gameNotifications.clearNotifications();
                        break;
                    default:
                        throw new Error("Unknown GameStatus: " + status);
                        break;
                }
            });
            ui.game.events.playerEvent.addListener(function(player, event) {
                // player event has happened
                switch (event) {
                    case wumpusGame.PlayerEvent.Move:
                        break;
                    case wumpusGame.PlayerEvent.Turn:
                        break;
                    case wumpusGame.PlayerEvent.GrabGold:
                        // player found and picked up gold
                        ui.gameNotifications.info("You grabbed some gold. Your score is now: " + ui.game.player.score, "Good Job!", true);   
                        break;
                    case wumpusGame.PlayerEvent.Teleport:
                        // bats teleport player to a random location
                        ui.gameNotifications.info("The bats carried you to a random tile.", "Surprise!", true);   
                        break;
                    case wumpusGame.PlayerEvent.ShootArrow:
                        break;
                    case wumpusGame.PlayerEvent.ArrowHitWumpus:
                        // player killed Wumpus
                        ui.gameNotifications.info("You hear a scream, indicating the death of the Wumpus.", "ROOOOOOOOOOOOOAAAARR!", true);  
                        break;
                    case wumpusGame.PlayerEvent.ArrowMissedWumpus:
                        break;
                    case wumpusGame.PlayerEvent.DeadPit:
                        // player fell into a pit
                        break;
                    case wumpusGame.PlayerEvent.DeadWumpus:
                        // player walked onto the Wumpus (also a deadly experience)
                        break;
                    case wumpusGame.PlayerEvent.Exit:
                        break;
                }
            });
            ui.game.events.playerStateChanged.addListener(function(stateName, value) {
                // score or ammo changed
                
            });
        })(this);
	};

	/**
	 * Visibility enum.
	 * @const
	 */
	wumpusGame.WumpusUI.Visibility = {
		/**
		 * TODO: Only visited tiles are visible.
		 */
		Visited : 1,
		/**
		 * Entire grid is visible, but you can only see contents of visited tiles.
		 */
		AllFoggy : 2,
		/**
		 * The entire grid is visible.
		 */
		All : 3
	};

	/**
	 * Determines the layout type and then layouts the entire UI correspondingly.
	 */
	wumpusGame.WumpusUI.prototype.resetLayout = function() {
		// TODO: Provide different layouts for different window sizes.
		// TODO: Especially consider tall-screen vs. wide-screen. And small vs. big.
		
		// create container for north layout
		var northContExisted = !!this.northCotainer;
		var northCont = this.northCotainer || $(document.createElement("div"));
		
		// add key handlers
        // TODO: Use a consistent key enum
		if (!northContExisted) {
			var arrowKey = {left: 37, up: 38, right: 39, down: 40 };
			$(document).keydown((function(game) { return function(e){
				if (e.which == arrowKey.up) {
				   game.player.performAction(wumpusGame.PlayerAction.Forward);
				}
				if (e.which == arrowKey.down) { 
				   game.player.performAction(wumpusGame.PlayerAction.Backward);
				}
				if (e.which == arrowKey.right) { 
				   game.player.performAction(wumpusGame.PlayerAction.TurnClockwise);
				}
				if (e.which == arrowKey.left) { 
				   game.player.performAction(wumpusGame.PlayerAction.TurnCounterClockwise);
				}
				if (e.which == 'E'.charCodeAt(0) || e.which == 'e'.charCodeAt(0)) {
				   game.player.performAction(wumpusGame.PlayerAction.Exit);
				}
				if (e.which == 'R'.charCodeAt(0) || e.which == 'r'.charCodeAt(0)) {
					game.restart();
				}
			};
			})(this.game));
		}
		
		// remove existing layout classes
		var layoutRemover = function (index, className) {
			return className ? (className.match (/\bui-layout-\S+/g) || []).join(' ') : "";
		};
		this.gridUI.removeClass(layoutRemover);
		this.scriptEditor.editorEl.removeClass(layoutRemover);
		northCont.removeClass(layoutRemover);
		
		// re-compute layout
		var totalH = $(this.gameEl[0].parentNode).innerHeight();
		var totalW = $(this.gameEl[0].parentNode).innerWidth();
		
		this.gridUI.addClass("ui-layout-center");
		this.toolsEl.addClass("ui-layout-east");
		northCont.addClass("ui-layout-center");
		this.scriptEditor.editorContainerEl.addClass("ui-layout-east");
		
		// restructure layout
		northCont.append(this.gridUI);
		northCont.append(this.toolsEl);
		this.gameEl.prepend(northCont);
		
		this.northLayout = northCont.layout({
			applyDefaultStyles: true,
			onresize_end: (function(self) { return self.updateChildLayout.bind(self); })(this),
			
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
		this.scriptEditor.updateScriptEditorLayout();
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
	
	
	// ##############################################################################################################
	// Complex UI interactions
	
	/**
	 * Runs the script that is currently present in the editor.
	 */
	wumpusGame.WumpusUI.prototype.runUserScript = function() {
        this.scriptNotifications.clearNotifications();          // remove all pending notifications
		this.scriptEditor.getSession().clearAnnotations();
		var code = this.scriptEditor.getSession().getValue();
		this.game.scriptContext.runScript(new wumpusGame.UserScript({codeString: code}));
	};
	
	return wumpusGame;
});