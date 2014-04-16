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
 * Only allow these globals.
 * All other globals are potentially harmful or not portable between run-time environments.
 */
self.whiteList = {
    "self": 1,
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
    "constructor":1,
    
    // globals from utility libraries
    "printStackTrace": 1,
    "require": 1,                   // require is not configurable, but luckily its harmless without importScripts
    "define": 1,                    // require is not configurable, but luckily its harmless without importScripts
    "requirejs": 1,                 // require is not configurable, but luckily its harmless without importScripts
    
    // helper & static context globals
    "currentSenderId": 1,
    "postAction": 1,
    "postCommand": 1,
    "postPrivilegedCommand": 1,     // can only be used with a key, that should never be available to user code
    "postInstanceMessage": 1,
    "lockDown": 1,                  // lockDown will be set to null explicitely to check for execution
    "runScript": 1,                 // glorified eval
    "reportError": 1,
    "exposeGlobals": 1,
    "createGlobalEvents": 1,
    
    // user-given globals
    "initScriptContext": 1,         // initialize context for interacting with the host
    "onInitializationFinished": 1   // post-lockDown initialization
};
    
/**
 * Lock down the context and disallow everything that is a potential security risk.
 *
 * @param {Array.<String>} ... Additional whitelist objects, imported from libraries.
 * @see http://stackoverflow.com/questions/10653809/making-webworkers-a-safe-environment
 */
self.lockDown = function(additionalWhiteListSymbols) {
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
                    throw new Error("Security Exception - cannot access: "+prop);
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
                    throw new Error("Security Exception - cannot access: "+prop);
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
// Run user script

/**
 * Sends custom action to host.
 */
Object.defineProperty(global, "postAction",  {
    writable: false,
    configurable: false,
    enumrable: false,
    value: function(args) {
        postCommand("action", args);
    }
});

/**
 * Sends a given command to the host.
 */
Object.defineProperty(global, "postCommand",  {
    writable: false,
    configurable: false,
    enumrable: false,
    value: function(cmd, args) {
        var msg = {senderId: currentSenderId, command: cmd, args: args};
        postMessage(msg);
    }
});

/**
 * Sends a given message to host, including currentSenderId.
 */
Object.defineProperty(global, "postInstanceMessage",  {
    writable: false,
    configurable: false,
    enumrable: false,
    value: function(msg) {
        msg.senderId = currentSenderId;
        postMessage(msg);
    }
});

/**
 * Fancy version of eval.
 */
Object.defineProperty(global, "runScript", {
    writable: false,
    configurable: false,
    enumrable: false,
    value: function(code) {
        try {
            // run user code
            return eval(code);
        } catch (err) {
            reportError(err);
        }
    }
});

/**
 * Report error back to host.
 *
 * TODO: Fix stacktrace parsing.
 */
Object.defineProperty(global, "reportError", {
    writable: false,
    configurable: false,
    enumrable: false,
    value: function(err) {
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
                var displayFunctionName = functionName === "eval" ? null : functionName;
                args.stacktrace.push({fileName: fileName, functionName: displayFunctionName, line: line, column: column});
            }
        }
        
        // warn dev
        //console.warn(trace.join("\n"));
        console.warn(err.stack);
        
        // run-time error
        postInstanceMessage({command: "error_eval", args: args});
    }
});


// ################################################################################################################
// Other utility methods

/**
 * Creates global events from an array of eventIds and a function that returns the name of the event handler function, given its id.
 */
Object.defineProperty(global, "createGlobalEvents", {
    writable: false,
    configurable: false,
    enumrable: false,
    value: function(eventIds, getEventHandlerNameById) {
        // create event handlers
        var eventHandlers = {};
            
        // create global getter which looks up the event handler in the events map
        var createEventHandler = function(eventId, eventHandlerName) {
            Object.defineProperty(global, eventHandlerName, {
                configurable: true,
                get: function() {
                    return eventHandlers[eventId];
                },
                set: function(value) {
                    eventHandlers[eventId] = value;
                }
            });
        };
        
        // create an event handler for every event
        for (var i = 0; i < eventIds.length; ++i) {
            var eventId = eventIds[i];
            var eventHandlerName = getEventHandlerNameById(eventId);
            
            createEventHandler(eventId, eventHandlerName);
            
            // add event handler stub to event map
            eventHandlers[eventId] = function() {};
        }
        
        return eventHandlers;
    }
});

/**
 * Expose all variables in the given object to the global context.
 */
Object.defineProperty(global, "exposeGlobals", {
    writable: false,
    configurable: false,
    enumrable: false,
    value: function(globals) {            
        // expose context-specific globals & white-list them, too
        for (var key in globals) {
            if (globals.hasOwnProperty(key)) {
                // add global
                Object.defineProperty(global, key, {
                    writable: false,
                    configurable: false,
                    enumrable: false,
                    value: globals[key]
                });
                
                // make sure, lockDown won't touch it
                whiteList[key] = 1;
            }
        }
    }
});



// ################################################################################################################
// Context initialization: Register the onmessage event handler.

/**
 * This function is initially and anonymously called to initialize this Worker.
 */
(function(local) {

    // register the message handler which acts as a simple command interpreter.
    onmessage = function(event) {
        if (!event.data) return;
        
        // remember command sender's id to identify the origin when messages are received by host
        self.currentSenderId = event.data.senderId;
        
        // get command name and arguments
        var cmd = event.data.command;
        var args = event.data.args;
        
        switch (cmd) {
            case "init":
                // initialize this guest context
                if (!lockDown) return;         // already initialized
                var baseUrl = args.baseUrl;
                
                // import some standard libraries
                importScripts(baseUrl + "lib/stacktrace.js");
                importScripts(baseUrl + "lib/require.js");
                
                // initialize custom globals
                try {
                    var guestGlobals = eval(args.guestGlobals);
                }
                catch (err) {
                    throw new Error("Unable to eval guestGlobals: " + err.stack);
                }
                var initScriptContext = guestGlobals.initScriptContext || function() {};
                var onInitializationFinished = guestGlobals.onInitializationFinished || function() {};
                var globals = guestGlobals.globals || {};
                var commandHandlers = guestGlobals.commandHandlers || {};
                
                // check for handler configuration
                local.commandHandlers = {};
                Object.keys(commandHandlers).forEach(function(prop) {
                    if (!commandHandlers.hasOwnProperty(prop)) return;
                    var handler = commandHandlers[prop];
                    if (handler instanceof Function) {
                        local.commandHandlers[prop] = handler;
                    }
                    else if (handler.handlerFunction instanceof Function) {
                        local.commandHandlers[prop] = handler.handlerFunction;
                        local.commandHandlers[prop].isPrivileged = handler.isPrivileged;
                    }
                    else {
                        console.warn("Invalid commandHandler \"" + prop + "\" is not a function, nor an object with a \"handlerFunction\" property that is a function.");
                    }
                });
                
                // register handler to run user scripts (not privileged!)
                local.commandHandlers["run"] = function(args) { runScript(args.code); };
                
                /**
                 * Simulator-specific initialization of the Worker context.
                 * This code is called before lockDown.
                 */
                Object.defineProperty(global, "initScriptContext",  {
                    writable: false,
                    configurable: false,
                    enumrable: false,
                    value: initScriptContext
                });

                /**
                 * This code is called after lockDown.
                 */
                Object.defineProperty(global, "onInitializationFinished",  {
                    writable: false,
                    configurable: false,
                    enumrable: false,
                    value: onInitializationFinished
                });
                
                // expose globals
                exposeGlobals(globals);
                
                // ScriptContext-specific initialization code
                initScriptContext(baseUrl, function() {
                    // lock down the context and make it secure
                    if (lockDown) {
                        local.unsecureGlobal = lockDown(arguments);
                        local.unsecureGlobal = null;        // apparently, copying some globals into another object and calling them from there is against the rules
                
                        // ScriptContext-specific second pass of initialization (post lockDown initialization)
                        onInitializationFinished(function() {
                            // this code is called after the second initialization pass has finished
                            postCommand("ready");
                        });
                    }
                });
                break;
            default:
                if (lockDown) return;        // the context has not been locked down yet. I.e. initialization has not finished yet.
                
                // check for custom command handler
                var handler = local.commandHandlers[cmd];
                if (handler) {        
                    // securityToken is used to to send privileged messages to the host, such as start or stop, while preventing user code from doing the same.
                    // We don't want the raw key to be lingering on the stack, due to ECMA's non-standardized stackframe API.
                    // Instead, we hide it in a closure whose stackframe is generally impossible (or at least harder) to obtain.
                    var postPrivilegedCommand = (function(securityToken) { return function(commandName, args) {
                        var msg = {senderId: currentSenderId, securityToken: securityToken, command: commandName, args: args};
                        postMessage(msg);
                    }})(event.data.securityToken);
                    event.data.securityToken = null;
                    
                    postPrivilegedCommand("start");     // signal host that command execution has started
                    try {
                        if (handler.isPrivileged) {
                            // pass postPrivilegedCommand only to privileged handlers
                            handler(args, postPrivilegedCommand);
                        }
                        else {
                            handler(args);
                        }
                    }
                    catch (err) {
                        reportError(err);
                    }
                    postPrivilegedCommand("stop");      // signal host that command execution has finished
                }
                else {
                    // developer error
                    console.warn("invalid command received by worker: " + cmd);
                }
                break;
        };
    };
})({});