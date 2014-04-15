/**
 * 
 */
"use strict";


define(["squishy", "../script/WorkerScriptContext"], function(squishy, WorkerScriptContext) {

    // ################################################################################################################################################################
    // Define globals that will later exist in the guest context.
    
    /** 
     * Define globals that are sent to and only executed in the guest script context.
     */
    var guestGlobals = {
        /**        
         * This code is called before before the context is secured.
         * At this point, we can still load external resources and execute all kinds of potentially insecure functions inside the guest context.
         *
         * @param {Function} onInitDone Is called after initialization to signal the guest that this code has done its duty.
         */
        initScriptContext: function(baseUrl, onInitDone) {
            // configure requirejs
            require.config({
                baseUrl : baseUrl,
                paths : {
                    Util: "js/util",
                    squishy: "js/util/squishy"
                },
                shim: {
                }
            });
            
            // import game-related stuff
            require([baseUrl + "js/core/WumpusGame.Def.js", "squishy"], function() {
                // Done loading. Signal that we are ready.
                onInitDone("wumpusGame", "squishy");        // white-list these globals (will not be removed)
            });
        },
        
        /**
         * This code is called after the global context has been secured, so we can go ahead and add things that we like.
         */
        onInitializationFinished: function(onInitDone) {
            // expose everything from the wumpusGame namespace
            exposeGlobals(wumpusGame);
        
            // create event handlers
            var eventIds = Object.keys(wumpusGame.PlayerEvent.AllNames);        // the keys of the event names are the event ids
            var getEventHandlerNameById = getEventHandlerNameById;
            self.events = createGlobalEvents(eventIds, getEventHandlerNameById);
            
            // signal guest context that we are ready
            onInitDone();
        },
        
        onAction: function(instanceKey, args) {
            // we are currently not sending custom actions to the client
        },
        
        /**
         * These variables are just exposed to the guest's global context for use in user script code.
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
             * Calls player event handler.
             */
            onPlayerEvent: function(event, args) {
                events[event]();
            },
            
            /**
             * Returns the name of the event of the given id.
             */
            getEventHandlerNameById: function(eventId) {
                var eventName = wumpusGame.PlayerEvent.AllNames[eventId];
                return "on" + eventName;
            }
        }
    };
    
    // TODO: Objects containing functions are not allowed in strict mode eval. Need to change the stringification procedure.
    
    var x = eval(squishy.objToString(guestGlobals));
    console.log(x);

    
    // ################################################################################################################################################################
    // GameScriptContext class (inherits from WorkerScriptContext)
    
    wumpusGame.GameScriptContext = squishy.extend(WorkerScriptContext,
        /**
         * Creates a new GameScriptContext.
         * @constructor
         */
        function (game, scriptConfig) {
            this._base(scriptConfig);
        
            this.game = game;
            
            // register player event callback
            var workerListenerCode = function(event, args) {
                onPlayerEvent(event, args);
            };
            
            // add listener to all relevant events, and send the events to the guest
            game.events.playerEvent.addListener(function(player, event, args) {
                var argsString = squishy.objToString(args);
                var code = "(" + workerListenerCode + ")(" + event + ", " + argsString + ");";
                this.runUserCode(code, "__listenercode__playerEvent");
            }.bind(this));
            
            // tell the worker to send these variables to the GuestScriptContext during initialization and add them to the guest's global object.
            this.setGuestGlobals(guestGlobals);
        },
        
        // define methods
        {
            /**
             * Is called when the user script sends an action packet.
             * Make sure that this is interpreted securely. The user might cheat.
             */
            onAction: function(args) {
                // action to be performed by agent
                var player = this.game.player;
                player.performActionDelayed(args);
            }
        }   
    );
    
    return wumpusGame.GameScriptContext;
});