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
        "require": 1,                   // require is not configurable, but luckily its harmless without importScripts
        "define": 1,                    // require is not configurable, but luckily its harmless without importScripts
        "requirejs": 1,                 // require is not configurable, but luckily its harmless without importScripts
        
        // harmless helper objects
        "runScript": 1,                // glorified eval
        "initScriptContext": 1,        // initialize context for interacting with the remote simulator
        "scriptGlobals": 1,            // the global context object contains all globals for interacting with the remote simulator
        "lockDown": 1,                 // lockDown will be set to null explicitely to check for execution
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
    for (var prop in global) {
        unsecureGlobal[prop] = global[prop];
        allBadProps[prop] = global[prop];
    }
    
    // add all other possible globals
    Object.getOwnPropertyNames( global ).forEach( function( prop ) {
        allBadProps[prop] = global[prop];
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
        try {
            // Don't hand in self for compatability reasons, not security reasons. (Other script contexts might not have "self".)
            (function(self) {
                postMessage({command: "start"});
                var result = eval(code);
                postMessage({command: "stop"});
            })();
        } catch (err) {
            var trace = printStackTrace({e: err});
            var args = {message: err.message, stacktrace: [] };
            var beforeEval = true;
            
            // Each line has a format similar to: "functionName@url:line:column"
            var frameRegex = /([^@]+)@([^\:]+)\:([^\:]+)\:([^\:]+)/;
            for (var i = 0; i < trace.length; ++i) {
                var line = trace[i];
                var match = frameRegex.exec(line);      // extract frame info from frame string
                
                if (match) {
                    var functionName = match[1];
                    var fileName = match[2];
                    var line = parseInt(match[3]);
                    var column = parseInt(match[4]);
                
                    // only report it, if it is a user script
                    if (UserScriptFileNameMap[fileName]) {
                        var displayFunctionName = functionName === "eval" ? null : functionName;
                        args.stacktrace.push({fileName: fileName, functionName: displayFunctionName, line: line, column: column});
                    }
                }
            }
            
            // warn dev
            console.warn(trace.join("\n"));
            
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
         * This code is called at the end of the Worker initialization routine.
         */
        init: function() {
            // copy script and game context to global context
            
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
        
            // create all event globals (so they can be easily overridden)
            for (var i = 0; i < wumpusGame.PlayerEvent.AllNames.length; ++i) {
                var eventName = wumpusGame.PlayerEvent.AllNames[i];
                var globalName = getEventCallbackName(eventName);
                self[globalName] = null;
            }
        },
    
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
        
        /**
         * Function called to 
         */
        onPlayerEvent: function(event, args) {
            var eventName = wumpusGame.PlayerEvent.AllNames[event];
            var callbackName = getEventCallbackName(eventName);
            var callback = self[callbackName];
            
            //console.log("calling: " + callbackName + "(" + (args ? args.stringify() : args) + ")");
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
                var baseUrl = args.baseUrl;
                scriptGlobals.UserScriptFileNames = args.userScriptFileNames;
                scriptGlobals.UserScriptFileNameMap = {};
                for (var i = 0; i < scriptGlobals.UserScriptFileNames.length; ++i) {
                    var fname = scriptGlobals.UserScriptFileNames[i];
                    scriptGlobals.UserScriptFileNameMap[fname] = 1;
                }
                
                // import some standard libraries
                importScripts(baseUrl + "lib/stacktrace.js");
                importScripts(baseUrl + "lib/require.js");
                
                // initialize simulator context
                initScriptContext(baseUrl, function() {
                    // lock down the context and make it secure
                    if (lockDown) {
                        local.unsecureGlobal = lockDown(arguments);
                        local = null;        // apparently, copying some globals into another object and calling them from there is against the rules
                        
                        // ScriptContext-specific initialization code
                        scriptGlobals.init();
                        postMessage({command: "ready"});
                    }
                });
                break;
            case "run":
                if (lockDown) return;        // the context has not been locked down yet. That also implies that initialization has not finished yet.
                // run the actual script outside the context of the initializer
                //local.unsecureGlobal.setTimeout(function() {
                    runScript(args.code);
                //}, 1);
                break;
            default:
                // developer error
                console.warn("invalid command received by worker: " + cmd);
                break;
        };
    };
})({});