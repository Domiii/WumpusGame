/**
 * This file contains the initializes WorkerScriptCode to safely run any UserScript.
 * This ensures that the UserScript cannot interfere with the game context.
 * TODO: Make this game-agnostic.
 */

"use strict";

define(["squishy", "./UserScript"], function(squishy) {
    // ################################################################################################################################################################
    // static variables

    var WorkerScriptConstants = {
        /**
         * A unique identifier to figure out the origin of a user-supplied script. 
         * 
         * @const
         */
        UserScriptName: "_userscript_912313_"
    };
    
    /**
     * Used to generate unique id for each worker.
     */
    var lastContextId = 0;


    // ################################################################################################################################################################
    // Constructor
    
     /**
      * Constructs a ScriptContext object which determines how a script is executed.
      * 
      * @constructor
      * @param {Object} game The game object that owns this context.
      */
    var WorkerScriptContext = function(game, config) {
        squishy.assert(game, "game is not defined");
        this.game = game;
        this.defaultScriptTimeout = config.defaultScriptTimeout || 500;
        
        // reset stuff
        this.scriptTimer = null;
        this.events = {
            scriptStarted: new squishy.Event(this),
            scriptFinished: new squishy.Event(this),
            scriptCancelled: new squishy.Event(this),
            scriptTimeout: new squishy.Event(this),
            scriptError: new squishy.Event(this),
            scriptInvalidMessage: new squishy.Event(this)      // args: message, scriptInstance
        }

        // register player event callback
        var self = this;
        var workerListenerCode = function(event, args) {
            onPlayerEvent(event, args);
        };
        game.events.playerEvent.addListener(function(player, event, args) {
            var argsString = WorkerScriptContext.objToVarString(args, 1);
            var code = "(" + workerListenerCode + ")(" + event + ", " + argsString + ");";
            var script = new squishy.UserScript({name: "__listenercode__playerEvent", codeString: code});
            self.runScript(script);
        });
        
        // copy config into this context
        squishy.clone(config, this, false);
    };
    
    
    // ################################################################################################################################################################
    // Start & stop worker
    
    
     /**
      * Whether a script is currently running.
      */
    WorkerScriptContext.prototype.isRunning = function() {
        return !!this.scriptTimer;        // convert to bool
    };
    
     /**
      * Restarts the worker (stops if it is currently running).
      */
    WorkerScriptContext.prototype.restartWorker = function() {
        this.stopWorker();
        this.startWorker();
    };
    
     /**
      * Starts and initializes the worker that executes UserScript objects in parallel, in a separate context.
      */
    WorkerScriptContext.prototype.startWorker = function() {
        if (this.worker) return;            // check if already running
        
        // the worker initialization code
        // var workerContext = WorkerScriptContext.createWorkerContext();
        // var code = this.buildWorkerCode(workerContext.init, workerContext.globals);
        // //console.log(code);

        // // Obtain a blob URL reference to our virtual worker 'file'.
        // var blob = new Blob([code], {type: 'text/javascript'});
        // var blobURL = window.URL.createObjectURL(blob);
        // this.worker = new Worker(blobURL);
        
        
        var baseUrl;
        if (squishy.getGlobalContext().document) {
            // browser
            baseUrl = document.URL.toString().trim();
            if (!baseUrl.endsWith("/")) {
                baseUrl = squishy.extractFolder(baseUrl) + "/";
            }
        }
        else if (squishy.getGlobalContext().__dirname) {
            // Node
            baseURL = __dirname + "/../..";
        }
        this.worker = new Worker("js/script/WorkerScriptCode.js");
        this.worker.onerror = function(event) {
            throw new Error("Worker failed: " + event.message + " (" + event.filename + ":" + event.lineno + ")");
        };
        
        this.worker.onmessage = this.onmessage.bind(this);
        
        // setup state machine
        this.contextId = ++lastContextId;
        this.runningScriptInstances = {};
        this.running = true;
        this.commandQueue = [];
        
        if (DEBUG) {
            // keep track of all messages sent forth and back
            this.protocolLog = [];
        }
        
        // send initialization message
        this.initializeGuest(baseUrl);
    };
    
     /**
      * Terminates the worker. You will have to call startWorker again to run more scripts.
      */
    WorkerScriptContext.prototype.stopWorker = function() {
        if (!this.worker) return;
        this.runningScriptInstances.forEach(function(prop) {
            if (this.runningScriptInstances.hasOwnProperty(prop)) {
                var scriptInstance = this.runningScriptInstances[prop];
                this.stopScript(scriptInstance, true);
            }
        });
        this.ready = false;
        this.running = false;
        this.worker.terminate();
        this.worker = null;
    };
    
    
    // ################################################################################################################################################################
    // Protocol implementation
    
     /**
      * Send message to guest.
      */
    WorkerScriptContext.prototype.postMessage = function(msg) {
        squishy.assert(this.worker, "Trying to postMessage while worker is not running.");
        
        if (DEBUG) {
            this.protocolLog.push(msg);
        }
        this.worker.postMessage(msg);
    };
    
    /**
     * Is called after a new Worker has started.
     * Initializes guest environment.
     */
    WorkerScriptContext.prototype.initializeGuest = function(baseUrl) {
        var initArgs = {
            workerId: this.workerId,
            baseUrl: baseUrl,
            userScriptFileNames: [WorkerScriptConstants.UserScriptName]
        };
        this.postMessage({command: "init", args: initArgs});    // start worker
    };
    
    /**
     * Called whenever a message is received by the host.
     */
    WorkerScriptContext.prototype.onmessage = function (event) {
        var data = event.data;
        var instanceId = data.instanceId;
        var cmd = data.command;
        var args = data.args;
        
        // Script-independent WorkerScriptContext protocol
        switch (cmd) {
            case "ready":
                // worker finished initialization
                this.ready = true;
                this.onReady();
                return;
        }
         
        // ignore user messages that were sent before termination and arrived after termination
        if (!this.running) return;
        
        // Retrieve the script instance that sent this message.
        var scriptInstance = this.runningScriptInstances[instanceId];
        if (!scriptInstance || !scriptInstance.isRunning()) {
            // The script that sent this message is gone (possibly a left-over message of a terminated script).
            console.warn("Message received from invalid scriptInstance (" + instanceId + "): " + cmd + "; args: " + args.stringify());    // TODO: Localization
            this.events.scriptInvalidMessage.notify(scriptInstance, event.data);
            return;
        }
        
        switch (cmd) {
            // Script-dependent WorkerScriptContext protocol
            case "start":
                if (key != scriptInstance.instanceKey) {
                    // The start message is used to start the script timeout timer. If a user can fake the message, user code can keep running forever.
                    // If there is an invalid start message: There either is a bug in security-critical code, or someone is trying to cheat.
                    console.warn("Illegal start message from userscript: " + scriptInstance);    // TODO: Localization
                    this.events.scriptInvalidMessage.notify(scriptInstance, event.data);
                    this.restartWorker();
                    return;
                }
                
                // start script timeout timer that kills long-running scripts
                scriptInstance.scriptTimer = setTimeout(
                    (function(self, scriptInstance) { return function() { 
                        if (scriptInstance.isRunning()) { 
                            self.onScriptTimeout(scriptInstance);
                        }
                    }})(this, scriptInstance),
                    this.defaultScriptTimeout);
                break;
            case "stop":
                var key = args;
                if (key != scriptInstance.instanceKey) {
                    // The stop message is used to stop the script timeout timer. If a user can fake the message, user code can keep running forever.
                    // If there is an invalid stop message: There either is a bug in security-critical code, or someone is trying to cheat.
                    console.warn("Illegal stop message from userscript: " + scriptInstance);    // TODO: Localization
                    this.events.scriptInvalidMessage.notify(scriptInstance, event.data);
                    this.restartWorker();
                    return;
                }
                this.onScriptFinished(scriptInstance);
                break;
            case "error_eval":
                this.events.scriptError.notify(scriptInstance, args.message, args.stacktrace);
                this.stopScript(scriptInstance);
                break;
                
            // custom messages
            // TODO: Move them out of here
            case "action":
                // action to be performed by agent
                var player = this.game.player;
                player.performActionDelayed(args);
                break;
        }
    };
    
     /**
      * Called when the guest finished initialization.
      * Runs queued commands.
      */
    WorkerScriptContext.prototype.onReady = function() {
        for (var i = 0; i < this.commandQueue.length; ++i) {
            var cmd = this.commandQueue[i];
            cmd();
        }
        this.commandQueue = [];
    };
    
    
    // ################################################################################################################################################################
    // Run, stop and manage UserScripts and UserScriptInstances
    
     /**
      * Cancel the currently running script.
      */
    WorkerScriptContext.prototype.stopScript = function(scriptInstance, dontNotify) {
        if (scriptInstance.scriptTimer) {
            clearTimeout(scriptInstance.scriptTimer);
        }
        if (scriptInstance.running) {
            scriptInstance.running = false;
            if (!dontNotify) 
                this.events.scriptCancelled.notify(scriptInstance);
        }
    };
    
     /**
      * Restarts the worker when a script ran too long.
      */
    WorkerScriptContext.prototype.onScriptTimeout = function(scriptInstance) {
        this.events.scriptTimeout.notify(scriptInstance);
        this.restartWorker();
    };
    
     /**
      * Notifies listeners of the scriptFinished event.
      */
    WorkerScriptContext.prototype.onScriptFinished = function(scriptInstance) {
        this.stopScript(scriptInstance, true);
        this.events.scriptFinished.notify(scriptInstance);
    };

     /**
      * Runs the given code in this context. Also starts a timer to stop execution after the given default timeout (in millis).
      * 
      * @param {UserScript} script A script to be executed.
      */
    WorkerScriptContext.prototype.runUserCode = function(code) {
        // create script object and run it
        var script = new wumpusGame.UserScript({name: WorkerScriptConstants.UserScriptName, codeString: code});
        return this.runScript(script);
    };

     /**
      * Runs the given script in this context.
      * 
      * @param {UserScript} script A script to be executed.
      */
    WorkerScriptContext.prototype.runScript = function(script) {
        var scriptInstance = new squishy.UserScriptInstance(this, script);
        this.runScriptInstance(scriptInstance);
        return scriptInstance;
    };

     /**
      * Runs the given ScriptInstance in this context.
      * 
      * @param {UserScript} script A script to be executed.
      */
    WorkerScriptContext.prototype.runScriptInstance = function(scriptInstance) {
        squishy.assert(this.worker, "Trying to run ScriptInstance while worker has not been started yet: " + scriptInstance);
        
        if (this.ready) {
            // Guest has been initialized:
            squishy.assert(!scriptInstance.ran, "UserScriptInstances must not be executed more than once: " + scriptInstance);
            scriptInstance.ran = true;
            
            // notify listeners
            this.events.scriptStarted.notify(scriptInstance);
            
            // start timer to make sure, the user script won't run forever
            this.runningScriptInstances[scriptInstance.instanceId] = scriptInstance;
        
            var code = scriptInstance.script.getCodeString();
            
            // run script
            scriptInstance.postCommand("run", {
                code: code,
                name: script.name
            });
        }
        else {
            // queue script, and run it when guest is ready:
            this.commandQueue.push((function(self) { return function() { self.runScriptInstance(scriptInstance); }; })(this));
        }
    };
    
    
    // ################################################################################################################################################################
    // Code-to-string helpers:
    
    /**
      * Creates a string from a set of named globals that will be provided to the worker.
      * The initFunction will be executed anonymously, without arguments.
      */
    WorkerScriptContext.prototype.buildWorkerCode = function(initFunction, globals) {
        var str = WorkerScriptContext.objToVarString(globals);
        str += "(" + initFunction + ")(); ";
        return str;
    };
    
    /**
      * This is a "deep toString" function. Unlike JSON.stringify, this also works for functions.
      * It also unwraps the outmost layer.
      * For example, {a : 'a', x = { y = 2 }} becomes:
      *         "var a = 'a';
      *        var x = { 
      *            y = 2;
      *        };"
      */
    WorkerScriptContext.objToVarString = function(obj, layer, indent) {
        // TODO: Consider using proper stringbuilder for better performance
        
        var str = "";
        var isArray = obj instanceof Array;
        var isObject = typeof(obj) === "object";
        
        if (!layer) {
            layer = 0;
            squishy.assert(!isArray, "objToVarString cannot be called on arrays at the outmost layer. Consider starting with layer = 1.");
        }
        
        // prepare indentation
        if (!indent) {
            indent = "";
            for (var i = 0; i < layer; ++i) {
                indent += "    ";
            }
        }
        else {
            indent += "    ";
        }
        
        // for (var propName in obj) {
            // if (!obj.hasOwnProperty(propName)) continue;
        if (isArray || isObject) {        
            if (layer) {
                str += (isArray ? "[" : "{") + "\n";
            }
            
            // iterate over all properties of array or object
            var iterator = function(propName) {
                var prop = obj[propName];
                var propStr = WorkerScriptContext.objToVarString(prop, layer+1, indent);
                
                if (!layer) {
                    // unwrap outmost layer
                    str += indent + "var " + propName + " = " + propStr + ";\n";
                }
                else {
                    if (isArray) {
                        str += indent + propStr + ",\n";
                    }
                    else {
                        str += indent + propName + " : " + propStr + ",\n";
                    }
                }
            };
            
            if (isArray) {
                // array
                for (var i = 0; i < obj.length; ++i) {
                    iterator(i);
                }
            }
            else {
                // object
                Object.getOwnPropertyNames(obj).forEach(iterator);
            }
            
            // remove dangling comma
            if (str.trim().endsWith(",")) {
                str = str.substring(0, str.length-1);
            }

            // close array or object definition
            if (layer > 0) {
                str += "\n" + indent;
                str += isArray ? "]" : "}";
            }
        }
        else {
            // obj is neither object nor array
            if (obj == null) {
                str += "null";
            }
            else if (!squishy.isDefined(obj)) {
                str += "undefined";
            }
            else {
                str += obj.toString();
            }
        }
        return str;
    };
    
    return WorkerScriptContext;
});
