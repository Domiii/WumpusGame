/**
 * This file contains the worker code.
 * This file is responsible for containing user-scripts and disallowing any potentially harmful action. 
 * The links explain the approach and the global context for web workers, respectively.
 *
 * @see http://stackoverflow.com/questions/10653809/making-webworkers-a-safe-environment
 * @see https://developer.mozilla.org/en-US/docs/Web/Reference/Functions_and_classes_available_to_workers
 */
"use strict";

// ################################################################################################################
// Make Worker context secure by removing all kinds of potentially dangerous globals

var global = this;

/**
 * Lock down the context and disallow everything that is a potential security risk.
 *
 * @param {Array.<String>} ... Additional whitelist objects, imported from libraries.
 * @see http://stackoverflow.com/questions/10653809/making-webworkers-a-safe-environment
 */
self.lockDown = function(additionalWhiteListSymbols) {
    /**
     * Only allow these globals.
     * All other globals are potentially harmful or not portable between run-time environments.
     */
    var whiteList = {
        "self": 1,
        "onmessage": 1,
        "postMessage": 1,
        "global": 1,
        "whiteList": 1,
        "eval": 1,
        "Array": 1,
        "Boolean": 1,
        "Date": 1,
        "Function": 1,
        "Number" : 1,
        "Object": 1,
        "RegExp": 1,
        "String": 1,
        "Error": 1,
        "EvalError": 1,
        "RangeError": 1,
        "ReferenceError": 1,
        "SyntaxError": 1,
        "TypeError": 1,
        "URIError": 1,
        "decodeURI": 1,
        "decodeURIComponent": 1,
        "encodeURI": 1,
        "encodeURIComponent": 1,
        "isFinite": 1,
        "isNaN": 1,
        "parseFloat": 1,
        "parseInt": 1,
        "Infinity": 1,
        "JSON": 1,
        "Math": 1,
        "NaN": 1,
        "undefined": 1,
        
        "Intl": 1,
        "console": 1,
        "setTimeout": 1,
        
        // globals from utility libraries
        "printStackTrace": 1,
        "require": 1,                // require is not configurable, but luckily its harmless without importScripts
        "define": 1,                // require is not configurable, but luckily its harmless without importScripts
        "requirejs": 1,                // require is not configurable, but luckily its harmless without importScripts
        
        // harmless helper objects
        "runScript": 1,                // as harmless as eval
        "initScriptContext": 1,        // initialize context for interacting with the remote simulator
        "scriptGlobals": 1,            // the global context object contains all globals for interacting with the remote simulator
        "lockDown": 1,                // lockDown will be set to null explicitely to check for execution
    };
    
    // add external libraries to safe list
    for (var i = 0; i < additionalWhiteListSymbols.length; ++i) {
        var arg = additionalWhiteListSymbols[i];
        whiteList[arg] = 1;
    }
    
    // create a map of all forbidden commands
    var unsecureGlobal = {};
    

    // Remove all potentially harmful functions from the global context:
    
    // add all "orphaned" globals (properties that are not revealed by getOwnPropertyNames, possibly due to some bug)
    var allBadProps = {};
    var x = {};
    for (var prop in global) {
        unsecureGlobal[prop] = global[prop];
        allBadProps[prop] = global[prop];
        x[prop] = global[prop];
    }
    
    // add all other possible globals
    Object.getOwnPropertyNames( global ).forEach( function( prop ) {
        allBadProps[prop] = global[prop];
        if (x[prop]) {
            delete x[prop];
        }
    });
    
    // override all found props
    Object.getOwnPropertyNames(allBadProps).forEach( function( prop ) {
        if( !whiteList.hasOwnProperty( prop ) ) {
            // lock potentially insecure global
            Object.defineProperty( global, prop, {
                get : function() {
                    throw "Security Exception: cannot access "+prop;
                }, 
                configurable : false
            });    
        }
    });
    
    // add all other globals, hidden in the global prototype
    Object.getOwnPropertyNames( global.__proto__ ).forEach( function( prop ) {
        if( !whiteList.hasOwnProperty( prop ) ) {
            Object.defineProperty( global.__proto__, prop, {
                get : function() {
                    throw "Security Exception: cannot access "+prop;
                }, 
                configurable : false
            });    
        }
    });
    
    // unset this function
    Object.defineProperty(global, "lockDown", {
        writable: false,
        configurable: false,
        enumrable: false,
        value: null
    });
    
    return unsecureGlobal;
};

/**
 * Joining large arrays can potentially crash browser tabs.
 * @see http://stackoverflow.com/questions/10653809/making-webworkers-a-safe-environment
 */
Object.defineProperty( Array.prototype, "join", {
    writable: false,
    configurable: false,
    enumrable: false,
    value: function(old){
        return function(arg){
            if( this.length > 500 || (arg && arg.length > 500 ) ) {
                throw "Exception: too many items";
            }

            return old.apply( this, arguments );
        };
    }(Array.prototype.join)

});


// ################################################################################################################
// Run a user-given script

/**
 * Fancy version of eval, with proper error reporting.
 */
Object.defineProperty(global, "runScript", {
    writable: false,
    configurable: false,
    enumrable: false,
    value: function(code) {
        // expose script globals
        for (var key in scriptGlobals) {
            if (scriptGlobals.hasOwnProperty(key)) {
                self[key] = scriptGlobals[key];
            }
        }
        
        // expose everything from the wumpusGame namespace
        for (var key in wumpusGame) {
            if (wumpusGame.hasOwnProperty(key)) {
                self[key] = wumpusGame[key];
            }
        }
        
        try {
            // Don't hand in self for compatability reasons, not security reasons. (Other script contexts might not have "self".)
            (function(self) {
                postMessage({command: "start"});
                var result = eval(code);
                postMessage({command: "stop"});
                
                // check for any newly registered event:
                if (result) {
                    for (var eventName in wumpusGame.PlayerEvents) {
                        var globalName = getEventCallbackName(eventName);
                        scriptGlobals[globalName] = result[globalName];
                    }
                }
            })();
        } catch (err) {
            var trace = printStackTrace({e: err});
            var args = {message: err.message, stacktrace: [] };
            var beforeEval = true;
            for (var i = 0; i < trace.length; ++i) {
                // Each line has the format: "functionName@url:line:column"
                var line = trace[i];
                var functionName = line.split("@", 1)[0].split(" ", 1)[0];
                
                // Ignore everything but actual eval call.
                if (beforeEval) {
                    var info = line.split(":");
                    var line = parseInt(info[info.length-2]);
                    var column = parseInt(info[info.length-1]);
                    var displayFunctionName = functionName == "eval" ? null : functionName;
                    args.stacktrace.push({functionName: displayFunctionName, line: line, column: column});
                }
                if (functionName === "eval") {
                    beforeEval = false;
                }
            }
            
            if (beforeEval) {
                // never went into eval(), so all this information should not be given to the user, only to the developer
                console.warn(err.stack);
                args.stacktrace = [];
            }
            else {
                console.warn(err.stack);
            }
            
            // run-time error
            postMessage({command: "error_eval", args: args});
        }
    }
});


// ################################################################################################################
// The script context will later be given as a run-time argument.
// It consists of an init function (initScriptContext) and a set of globals to be available to any user script (scriptGlobals)

/**
 * Simulator-specific initialization of the Worker context.
 * @param {Function} onInitDone Is called after initialization has fininshed.
 */
Object.defineProperty(global, "initScriptContext",  {
    writable: false,
    configurable: false,
    enumrable: false,
    value: function(baseUrl, onInitDone) {
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
            onInitDone("wumpusGame", "squishy");
        });
    }
});


/**
 * Returns the set of simulator-specific globals, available for remote manipulation inside this Worker context.
 */
Object.defineProperty(global, "scriptGlobals",  {
    writable: false,
    configurable: false,
    enumrable: false,
    value: {
        /**
         * Move forward one tile
         */
        moveForward: function() {
            postMessage({command: "action", args: wumpusGame.PlayerAction.Forward});
        },
        /**
         * Move backward one tile
         */
        moveBackward: function() {
            postMessage({command: "action", args: wumpusGame.PlayerAction.Backward});
        },
        /**
         * Turn clockwise by 90 degrees
         */
        turnClockwise: function() {
            postMessage({command: "action", args: wumpusGame.PlayerAction.TurnClockwise});
        },
        /**
         * Turn counter clockwise by 90 degrees
         */
        turnCounterClockwise: function() {
            postMessage({command: "action", args: wumpusGame.PlayerAction.TurnCounterClockwise});
        },
        /**
         * Escape through an entrance.
         */
        exit: function() {
            postMessage({command: "action", args: wumpusGame.PlayerAction.Exit});
        },
        
        onPlayerEvent: function(event, args) {
            var eventName = wumpusGame.PlayerEvent.AllNames[event];
            var callbackName = getEventCallbackName(eventName);
            var callback = this[callbackName];
            if (callback) {
                callback(args);
            }
        },
        
        getEventCallbackName: function(eventName) {
            return "on" + eventName;
        }
    }
});
    

/**
 * This function is initially and anonymously called to initialize this Worker.
 */
(function(local) {
    // register the message handler which acts as a simple command interpreter.
    onmessage = function(event) {
        if (!event.data) return;
        
        var cmd = event.data.command;
        var args = event.data.args;
        
        switch (cmd) {
            case "init":
                if (!lockDown) return;         // already initialized
                var baseUrl = args;
                
                // import some standard libraries
                importScripts(baseUrl + "lib/stacktrace.js");
                importScripts(baseUrl + "lib/require.js");
                
                // initialize simulator context
                initScriptContext(baseUrl, function() {
                    // lock down the context and make it secure
                    if (lockDown) {
                        local.unsecureGlobal = lockDown(arguments);
                        local = null;        // apparently, copying some globals into another object and calling them from there is against the rules
                        postMessage({command: "ready"});
                    }
                });
                break;
            case "run":
                if (lockDown) return;        // the context has not been locked down yet. That also implies that initialization has not finished yet.
                
                // run the actual script outside the context of the initializer
                //local.unsecureGlobal.setTimeout(function() {
                    runScript(args);
                //}, 1);
                break;
            default:
                // developer error
                console.warn("invalid command received by worker: " + cmd);
                break;
        };
    };
})({});