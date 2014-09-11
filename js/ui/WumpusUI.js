/**
 * This file defines the game UI.
 */
"use strict";

// Use jQuery Mobile: http://jsfiddle.net/h5eM4/5/

/**
 * All dependencies of WumpusUI.
 * @const
 */
var dependencies = [
    // WumpusGame Core UI
    "./GridUI", 
    
    // Scripting Core UI
    "./ScriptEditorUI",
    
    // JQuery & jQuery Mobile
    "jquery", "jqm",
    
    // Other UI stuff
    "./Notifier",
    "Lib/mousetrap.min",

    // Non-UI stuff
    "Localizer"
];
 
define(dependencies, function() {

     /**
      * Creates a new WumpusUI object for managing the UI of the WumpusGame.
      *
      * @param {Object} config Wumpus UI configuration.
      * @param {wumpusGame.WumpusUI.Visibility} [config.visibility] Determines what the player can see.
      * @param {Element} [config.gameEl] The top-level game container.
      * @param {Element} [config.playerEl] The element that represents the player.
      * @param {Element} [config.headerEl] The element that represents the toolbar.
      * @param {Element} [config.footerEl] The element that represents the footer.
      * @param {Object} [config.gridUIConfig] Configures the grid UI.
      * @param {Object} [config.scriptEditorUIConfig] Configures the ScriptEditor.
      */
    wumpusGame.WumpusUI = function(game, config) {
        // sanity checks
        squishy.assert(game, "game is not defined.");
        squishy.assert(config.gameEl, "config.gameEl is not defined.");
        squishy.assert(config.playerEl, "config.playerEl is not defined.");
        squishy.assert(config.headerEl, "config.headerEl is not defined.");
        squishy.assert(config.footerEl, "config.footerEl is not defined.");
        //squishy.assert(config.footerEl, "config.footerEl is not defined.");
        squishy.assert(config.gridUIConfig, "config.gridUIConfig is not defined.");
        squishy.assert(config.scriptEditorUIConfig, "config.scriptUIConfig is not defined.");
        
        // setup properties
        this.visibility = !!config.visibility;        // force to bool
        this.game = game;
        this.gameEl = $(config.gameEl);
        this.playerEl = $(config.playerEl);
        this.headerEl = $(config.headerEl);
        this.footerEl = $(config.footerEl);
        this.scriptEditor = wumpusGame.makeScriptEditorUI(this, config.scriptEditorUIConfig);
        this.gridUI = wumpusGame.makeGridUI(this, config.gridUIConfig);
        
        this.infoTimeout = config.infoTimeout;
        this.footerVisible = this.footerEl.css("display") !== "none";
        
        // divs need tabindex to be focusable (see: http://stackoverflow.com/questions/5965924/jquery-focus-to-div-is-not-working)
        this.gridUI.attr("tabindex", 1);
        $(this.scriptEditor).attr("tabindex", 2);
        
        // load default user code
        var This = this;
        jQuery.ajax({
            url: 'js/user/DefaultUserCode.js',
            dataType: 'text',
            error: function (xhr, ajaxOptions, thrownError) {
                var errorStr = 'Status = ' + xhr.statusText + ' (' + xhr.status + ')' + '\n';
                errorStr += 'Response length = ' + (xhr.responseText || "").length + '\n';
                errorStr += 'Error = ' + (thrownError && thrownError.stack || thrownError) + '\n';

                console.log(errorStr);
            }
        })
        .done(function(code) {
            This.scriptEditor.setValue(code, -1);
        });
        
        // create notification lists
        // TODO: Replace with something better
        this.gameNotifications = new NotificationList({containerElement : this.gridUI});
        this.scriptNotifications = new NotificationList({containerElement : this.scriptEditor.editorContainerEl});
        
        // setup event listeners
        this.setupGameEventListeners();
        this.setupScriptEventListeners();
        
        // add elements to UI
        //this.bindMousetrapTo(this.gameEl, this.initCommands.bind(this));
        this.initCommands();
        this.initLanguage();
        this.initLayout();          // compute layout and register necessary bindings
    };

    
    // #######################################################################################################################
    // Enums
    
    /**
     * Visibility enum.
     * @const
     */
    wumpusGame.WumpusUI.Visibility = {
        /**
         * Visited tiles and all grid outlines are visible.
         */
        Visited : 1,
        /**
         * TODO: Only visited tiles and visited grid outlines are visible.
         */
        VisitedFoggy : 2,
        /**
         * The entire grid and all tiles visible.
         */
        All : 3
    };

    // methods
    wumpusGame.WumpusUI.prototype = {
        /**
         * Whether the page is already loaded.
         */
        isPageLoaded: function() { return $.mobile && $.mobile.activePage; },
        
        getActivePage: function() { return $.mobile.activePage; },
        
        /**
         * Whether the script editor is currently focused.
         */
        isEditorFocused: function() {
            // uses a simple heuristic based on the assumption that the script editor is the only textarea in the DOM.
            var focused = $(':focus');
            return (focused[0] && focused[0].type === "textarea");
        },
    
    
        // #######################################################################################################################
        // Initialization
        
        /**
         * Do a little trick with mousetrap, to prevent it from registering global events, and instead only register it with the given element.
         */
        // bindMousetrapTo: function(element, onSuccess) {
            // var ui = this;
            // squishy.assert(!this.mousetrapLoaded, "Tried to use mousetrap to bind to more than one container. That functionality is currently not supported.");
            // if (!this.mousetrapLoaded) {
                // squishy.assert(!this.mousetrapLoading, "Tried to bind a second mousetrap container while mousetrap is still loading. That functionality is currently not supported.");
                // this.mousetrapLoading = true;
                // $.get("lib/mousetrap.js", function(code) {
                    // this.mousetrapLoaded = true;
                    // this.mousetrapLoading = false;
                    
                    // // little mousetrack hack (it binds everything to document)
                    // var document = element;
                    // var define = null;
                    // eval(code);
                    
                    // // Call success callback
                    // onSuccess();
                // }).fail(function() {
                    // squishy.assert(false, "Failed to load Mousetrap: " + squishy.objToString(arguments));
                // });
            // }
        // },
        
        /**
         * Guess language, based on what server determined to be good for this client.
         */
        initLanguage: function() {
            var languageName;

            // Set the language from the meta tag above
            languageName = $("meta[name='accept-language']").attr("content");
            Localizer.setLanguage(languageName);

            // This can be hard-coded, since it shouldn't change based on the user
            Localizer.setFallbackLanguage("en-US")
        },
        
        /**
         * Initialize all commands.
         */
        initCommands: function() {
            /**
             * Set of game controls, provided by the UI.
             */
            var commandMap = Command.createCommandMap(this, {
                turnccw: {
                    prettyName: "Left",
                    description: "Agent turns counter-clockwise, 90 degrees.",
                    displayName: "",
                    displayIcon: "arrow-l",
                    keydown: "left",
                    callback: function() {
                        this.game.player.performActionNow(wumpusGame.PlayerAction.TurnCounterClockwise);
                    }
                },
                forward: {
                    prettyName: "Forward",
                    description: "Agent takes one step forward.",
                    displayName: "",
                    displayIcon: "arrow-u",
                    keydown: "up",
                    callback: function() {
                        this.game.player.performActionNow(wumpusGame.PlayerAction.Forward);
                    }
                },
                turncw: {
                    prettyName: "Right",
                    description: "Agent turns clockwise, 90 degrees.",
                    displayName: "",
                    displayIcon: "arrow-r",
                    keydown: "right",
                    callback: function() {
                        this.game.player.performActionNow(wumpusGame.PlayerAction.TurnClockwise);
                    }
                },
                backward: {
                    prettyName: "Back",
                    description: "Agent takes one step backward.",
                    displayName: "",
                    displayIcon: "arrow-d",
                    keydown: "down",
                    callback: function() {
                        this.game.player.performActionNow(wumpusGame.PlayerAction.Backward);
                    }
                },
                exit: {
                    prettyName: "Exit",
                    description: "Agent exits the dungeon (when on exit).",
                    //displayName: "Exit Dungeon",
                    displayIcon: "action",
                    keydown: "e",
                    callback: function() {
                        this.game.player.performActionNow(wumpusGame.PlayerAction.Exit);
                    }
                },
                run: {
                    prettyName: "Run",
                    description: "Reset game and execute the current user script.",
                    displayName: "Run",
                    displayIcon: "gear",
                    keydown: "x",
                    callback: function() {
                        this.runUserScript();
                    }
                },
                restart: {
                    prettyName: "Restart",
                    description: "Restart game.",
                    displayName: "Restart",
                    displayIcon: "refresh",
                    keydown: "r",
                    callback: function() {
                        this.game.restart();
                    }
                },
                stop: {
                    prettyName: "Stop",
                    description: "Stops currently queued actions.",
                    displayName: "Stop",
                    displayIcon: "delete",
                    keydown: "s",
                    callback: function() {
                        this.game.player.stopPlayer();
                    }
                },
                
                // TODO: Do this properly
                help: {
                    prettyName: "Help",
                    description: "Displays help.",
                    displayName: "Help",
                    displayIcon: "heart",
                    keydown: "h",
                    callback: function() {
                        this.toggleHelp();
                    }
                }
            });
            
            // switch between game and editor
            Mousetrap.bind(["esc", "ctrl+shift+s"], function() {
                // determine what is currently in focus
                // TODO: Does not currently not trigger while in editor
                if (this.isEditorFocused()) {
                    this.gridUI.focus();                // focus on grid
                }
                else {
                    this.scriptEditor.focus();          // focus on editor
                }
            }.bind(this), "keydown");
            
            // add to toolbar and register keyboard events
            Command.addCommandsToToolbar(commandMap);
        },
    
    
        // ##############################################################################################################
        // Layouting
        
        /**
         * Determines the layout type and then layouts the entire UI correspondingly.
         */
        initLayout: function() {
            var doInit = function(){
                // re-build page after editing the HTML
                this.getActivePage().trigger('create');
                this.getActivePage().trigger('pagecreate');
                
                this.fillPage();
        
                $(window).on("resize orientationchange", function(){
                    this.fillPage();
                }.bind(this))
            }.bind(this);
            
            if (!this.isPageLoaded()) {
                $(document).on( "pagecontainershow", doInit);
            }
            else {
                doInit();
            }
        },
        
        /**
         * Resizes content to fill out the entire page.
         */
        fillPage: function() {
            // TODO: Support tall-screen and small screens
            // wide-screen:
            scroll(0, 0);
            var content = $("[data-role=content]");
            var footerHeight = this.footerVisible ? this.footerEl.outerHeight() : 0;
            var contentHeight = $.mobile.getScreenHeight() - this.headerEl.outerHeight() - footerHeight - content.outerHeight() + content.height();
            content.height(contentHeight);
            this.updateChildLayout();
        },

        /**
         * Update layout of children.
         */
        updateChildLayout: function() {
            var totalH = $(this.gameEl[0].parentNode).innerHeight();
            //this.UILayout.sizePane('south', totalH/2);
            
            this.gridUI.updateGridLayout();
            this.scriptEditor.updateScriptEditorLayout();
        },

        
        // ##############################################################################################################
        // React to game events
        
        /**
         * This is called whenever a tile is updated (can be caused by layouting, but also by game mechanics).
         */
        updateTileStyle: function(tileEl) {
            var tile =  tileEl.tile;
            
            // set player
            if (this.game.player.getTile() == tile) {
                this.movePlayerTile(tileEl);
            }
        },

        /**
         * Adds the player element to the given tile element.
         */
        movePlayerTile: function(tileEl) {
            var w = tileEl.innerWidth() - parseInt(tileEl.css("padding-left"));
            var h = tileEl.innerHeight() - parseInt(tileEl.css("padding-top"));
            
            // reset style
            //this.playerEl.attr("style", "");
            
            // set position & size
            this.playerEl.css({
                display: "block",
                left : "0px", 
                top : "0px",
                zIndex : "1",
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
        },
        
        
        // ##############################################################################################################
        // Editor management
        
        /**
         * Runs the script that is currently present in the editor.
         */
        runUserScript: function() {
            this.scriptNotifications.clearNotifications();          // remove all pending notifications
            this.scriptEditor.getSession().clearAnnotations();
            var code = this.scriptEditor.getSession().getValue().toString();
            
            // TODO: Proper script (i.e. rudimentary asset) management structure. The UI should not decide on file names etc.
            this.game.scriptContext.startUserScript(code, "_userscript_912313_");
        },
        
        
        // ###############################################################################################################################################################
        // Game events
            
        setupGameEventListeners: function() {
            var ui = this;
            
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
                        ui.gameNotifications.info("You grabbed some gold. Your score is now: " + ui.game.player.score, "Good Job!", true, ui.infoTimeout);
                        break;
                    case wumpusGame.PlayerEvent.Teleport:
                        // bats teleport player to a random location
                        ui.gameNotifications.info("The bats carried you to a random tile.", "Surprise!", true, ui.infoTimeout);
                        break;
                    case wumpusGame.PlayerEvent.ShootArrow:
                        break;
                    case wumpusGame.PlayerEvent.ArrowHitWumpus:
                        // player killed Wumpus
                        ui.gameNotifications.info("You hear a scream, indicating the death of the Wumpus.", "ROOOOOOOOOOOOOAAAARR!", true, ui.infoTimeout);
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
                // TODO: score or ammo changed
            });
        },
        
            
        // ###############################################################################################################################################################
        // Script events
            
        setupScriptEventListeners: function() {
            var ui = this;
            
            ui.game.scriptContext.events.commandTimeout.addListener(function(command) {
                // script was cancelled due to timeout
                ui.scriptNotifications.error("Game stopped because it ran longer than " + ui.game.scriptContext.defaultScriptTimeout + " milliseconds.", "ERROR", true);
                this.restart(); 
            });
            
            ui.game.scriptContext.events.commandCancelled.addListener(function(command) {
                // script was cancelled, probably by user
                ui.scriptNotifications.warning("Script was cancelled.", "WARNING", true);
            });
            
            
            // TODO: Need proper script manager for meaningful error messages and error navigation
            ui.game.scriptContext.events.scriptError.addListener(function(message, stacktrace) {
                // display notification
                var frame = stacktrace[0];
                var info;
                
                if (frame) {
                    if (ui.scriptEditor) {
                        // focus on line
                        ui.scriptEditor.gotoLine(frame.line, frame.column, true);
                    }
                    
                    // create complete error message
                    info = "at " + frame.infoString + "\n";
                    for (var i = 1; i < stacktrace.length; ++i) {
                        frame = stacktrace[i];
                        info += "called from " + frame.infoString + "\n";
                    }
                }
                else {
                    info = "unknown origin";
                }
                
                ui.scriptNotifications.error(info, "ERROR: " + message, true);
            });
        },
        
        
            
        // ###############################################################################################################################################################
        // Help system
        // TODO: Produce a proper help system
        
        /**
         *
         */
        toggleHelp: function() {
            this.footerEl.fadeToggle('fast');
            this.footerVisible = !this.footerVisible;
            this.fillPage();
        }
    };
    
    

    // #######################################################################################################################
    // Commands are objects representing possible interactions with the UI and underlying state.
    
    // TODO: Localization of names and descriptions
    // TODO: Proper parameter support for commands?
    
    /**
     * @constructor
     */
    var Command = squishy.createClass(
        function (def) {
            squishy.assert(def.name);
            squishy.assert(def.callback);
            
            squishy.clone(def, false, this);
            
            this.prettyName = def.prettyName || def.name;
            this.description = def.description || "";
        },{
            // prototype
            setOwner: function(owner) { this.owner = owner; },
            run: function() {
                // all commands are currently for the game, not for the script editor
                if (this.owner.isEditorFocused()) return;
                squishy.assert(this.owner, "You forgot to call UICommand.setOwner or Command.createCommandMap.");
                this.callback.apply(this.owner, arguments);  // call call back on UI object with all arguments passed as-is
            }
        }
    );
    
    /**
     * Takes the owner of all commands, their definitions and 
     * returns a new map of Command objects.
     */
    Command.createCommandMap = function(owner, commandDefinitions) {
        var map = {};
        squishy.forEachOwnProp(commandDefinitions, function(name, def) {
            def.name = name;
            var cmd = new Command(def);
            cmd.setOwner(owner);
            map[name] = cmd;
        });
        return map;
    };
    
    /**
     * Appends one button per command to the given toolbar.
     * If toolbar not given, will append to jQuery Mobile header instead.
     */
    Command.addCommandsToToolbar = function(commandMap, toolbar) {            
        if (!toolbar || !toolbar.length) {
            toolbar = $("[data-role=header]");
            squishy.assert(toolbar && toolbar.length, "toolbar was not given, and document does not have header.");
        }
        
        // create navbar
        var navbarEl = $("<div>");
        //navbarEl.attr("data-role", "navbar");
        //var listEl = $("<ul>");
        //navbarEl.append(listEl);
        //toolbar.append(navbarEl);
        
        // see: http://stackoverflow.com/questions/6161377/more-than-5-items-per-line-in-jquery-mobile-navbar
        // var itemCSS = {
            // "width": "3% !important",  /* 12.5% for 8 tabs wide */
            // "clear": "none !important"  /* Prevent line break caused by ui-block-a */
        // };
        
        var buttonCSS = {
            "margin" : "0px !important"
        };
        
        squishy.forEachOwnProp(commandMap, function(name, cmd) {
            //var itemEl = $("<li>");
            //itemEl[0].style = "width: 3% !important;";
            var button = $("<a>");
            //button.text(cmd.displayName && cmd.displayName.length > 0 ? cmd.displayName : " ");
            button.attr("title", cmd.description);
            button.attr("data-role", "button");
            if (cmd.displayIcon) {
                button.attr("data-icon", cmd.displayIcon);
                button.attr("data-iconpos", "top");
            }
            button.attr("style", "margin: 0px !important; width: 3em;");//.css(buttonCSS);
            
            // arguments to run() will be the event data
            var eventHandler = cmd.run.bind(cmd);
            
            // register mouse & keyboard listeners
            button.click(eventHandler);
            if (cmd.keydown && cmd.keydown.length > 0) {
                Mousetrap.bind(cmd.keydown, eventHandler, 'keydown');
            }
            if (cmd.keyup && cmd.keyup.length > 0) {
                Mousetrap.bind(cmd.keyup, eventHandler, 'keyup');
            }
            // itemEl.append(button);
            // listEl.append(itemEl);
            toolbar.append(button);
        }.bind(this));
    };
    
    return wumpusGame;
});