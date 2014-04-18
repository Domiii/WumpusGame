/**
 * 
 */
"use strict";


define(["Squishy", "../script/HostScriptContext"], function(squishy, HostScriptContext) {

    // ################################################################################################################################################################
    // Define globals that will later exist in the guest context.
    
    /** 
     * Define globals that are sent to and only executed in the guest script context.
     * IMPORTANT: All these objects and code therein is run in the guest context.
     */
    var guestGlobals = {
        /**        
         * This code is called before before the context is secured.
         * At this point, we can still load external resources and execute all kinds of potentially insecure functions inside the guest context.
         * Do not run user code in this function.
         *
         * @param {Function} onInitDone Is called after initialization to signal the guest that this code has done its duty.
         */
        initScriptContext: function(baseUrl, onInitDone) {
            // configure requirejs
            require.config({
                baseUrl : baseUrl,
                paths : {
                    Util: "js/util",
                    Squishy: "../SimplePlatformer/lib/squishy/squishy"
                },
                shim: {
                }
            });
            
            // import game-related stuff
            require([baseUrl + "js/core/WumpusGame.Def.js", "Squishy"], function() {
                // Done loading. Signal that we are ready.
                onInitDone("wumpusGame", "squishy");        // white-list these globals (will not be removed)
            });
        },
        
        /**
         * This code is called after the global context has been secured, so we can go ahead and add things that we like to the guest context.
         * Do not run user code in this function.
         */
        onInitializationFinished: function(onInitDone) {
            // expose everything from the wumpusGame and squishy namespaces
            exposeGlobals(wumpusGame);
            exposeGlobals(squishy);
        
            // create event handlers
            var eventIds = wumpusGame.PlayerEvent.getValues();
            self.eventHandlers = createGlobalEvents(eventIds, getEventHandlerNameById);
            
            // signal guest context that we are ready
            onInitDone();
        },
        
        /**
         * These are extra message handlers to implement a complete game protocol on the guest side.
         * You can run user code in this function.
         * Each commandHandler has one parameter: args (the arguments given in the postCommand call)
         * It also has an optional parameter: postPrivilegedCommand, which is a function to send privileged commands from the guest back to the host.
         * This parameter will only be available if the commandHandler is registered as an object with two properties: handler (the actual handler function) and isPrivileged (must be set to true)
         */
        commandHandlers: {
            /**
             * This function is called to signal a new set of player events.
             */
            triggerPlayerEvents: function(events) {
                events.forEach(function (event) {
                    var eventId = event.eventId;
                    var args = event.args;
                    eventHandlers[eventId](args);
                });
            }
        },
        
        /**
         * These variables are just exposed to the guest's global context for use in user script code.
         * These are mostly aimed at sending messages (or commands or actions) to avoid users having to send those themselves.
         *
         * TODO: Create a reliable structure to check when, how and why user actions fail, and inform the guest and/or the user (depending on context).
         */
        globals: {
            /**
             * Move forward one tile
             */
            moveForward: function() {
                postAction(wumpusGame.PlayerAction.Forward);
            },
            /**
             * Move backward one tile
             */
            moveBackward: function() {
                postAction(wumpusGame.PlayerAction.Backward);
            },
            /**
             * Turn clockwise by 90 degrees
             */
            turnClockwise: function() {
                postAction(wumpusGame.PlayerAction.TurnClockwise);
            },
            /**
             * Turn counter clockwise by 90 degrees
             */
            turnCounterClockwise: function() {
                postAction(wumpusGame.PlayerAction.TurnCounterClockwise);
            },
            
            /**
             * Escape through an entrance.
             */
            exit: function() {
                postAction(wumpusGame.PlayerAction.Exit);
            },
            
            /**
             * Returns the name of the event of the given id.
             */
            getEventHandlerNameById: function(eventId) {
                var eventName = wumpusGame.PlayerEvent.toString(eventId);
                return "on" + eventName;
            }
        }
    };

    
    // ################################################################################################################################################################
    // GameScriptContext class (inherits from HostScriptContext)
    
    /**
     * IMPORTANT: All this code is run in the host context.
     */
    wumpusGame.GameScriptContext = squishy.extendClass(HostScriptContext,
        /**
         * Creates a new GameScriptContext.
         * @constructor
         */
        function (game, scriptConfig) {
            this._base(scriptConfig);       // call base constructor
        
            // assign game
            squishy.assert(game, "game was not defined");
                
            this.game = game;
            
            // register game event listeners:
            
            // register game restart event listener
            this.game.events.restart.addListener(function() {
                this.resetContext();
            }.bind(this));

            // register player event listener
            this.game.events.playerEvent.addListener(function(player, events) {
                // remember all events
                this.eventLog.push(events);
                
                // send to remote side
                this.postCommand("triggerPlayerEvents", events);
            }.bind(this));
            
            
            // register guest response event listeners:
            this.setGuestResponseHandler("action", this.onAction.bind(this), true);
            
            // tell the worker to send these variables to the GuestScriptContext during initialization and add them to the guest's global object.
            this.setGuestGlobals(guestGlobals);
            
            this.resetContext();
        },
        
        // define methods
        {
            /**
             * Called when game restarts.
             */
            resetContext: function() {
                // reset eventlog
                this.eventLog = [];
                this.eventLogIndex = 0;
                this.scriptRan = false;
            },
            
            /**
             * Called after initialization finished, and guest context is ready.
             * Note that this is called in the host context.
             */
            onGuestReady: function() {
            },
            
            /**
             * Called when the user script sends an action.
             * Make sure that this is interpreted securely. The user might cheat.
             */
            onAction: function(action) {
                // action to be performed by agent
                var player = this.game.player;
                player.performActionDelayed(action);
            },
            
            /**
             * Restarts the game and runs the given user script
             */
            startUserScript: function(code, name) {
                // restart game and clean slate the entire guest context to avoid compatability issues between two script runs...
                this.game.restart();
                
                // run the user script (which will (re-)register event handlers)
                this.runUserCode(code, name);
                
                // play log of events that happened during initialization
                for (; this.eventLogIndex < this.eventLog.length; ++this.eventLogIndex) {
                    // send to remote side
                    var events = this.eventLog[this.eventLogIndex];
                    this.postCommand("triggerPlayerEvents", events);
                }
            }
        }   
    );
    
    return wumpusGame.GameScriptContext;
});