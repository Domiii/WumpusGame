/**
 * This file contains the initializes WorkerScriptCode to safely run any UserScript.
 * This ensures that the UserScript cannot interfere with the game context.
 * TODO: Make this game-agnostic.
 */

"use strict";

define(["squishy", "./UserScript"], function(squishy) {
    var WorkerScriptConstants = {
        /**
         * A unique identifier to figure out the origin of a user-supplied script. 
         * 
         * @const
         */
        UserScriptName: "_userscript_912313_"
    };

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
            scriptError: new squishy.Event(this)
        }

        // register player event callback
        var self = this;
        var workerListenerCode = function(event, args) {
            onPlayerEvent(event, args);
        };
        game.events.playerEvent.addListener(function(player, event, args) {
            var argsString = WorkerScriptContext.objToVarString(args, 1);
            var code = "(" + workerListenerCode + ")(" + event + ", " + argsString + ");";
            var script = new wumpusGame.UserScript({name: "__listenercode__playerEvent", codeString: code});
            self.runScript(script);
        });
        
        // copy config into this context
        squishy.clone(config, this, false);
    };
    
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
        this.worker = new Worker("js/core/WorkerScriptCode.js");
        this.worker.onerror = function(event) {
            throw new Error("Worker failed: " + event.message + " (" + event.filename + ":" + event.lineno + ")");
        };
        this.worker.onmessage = (function(self) { return function (event) {
            var data = event.data;
            var cmd = data.command;
            var args = data.args;
            
            // messages that are independent of user-scripts
            switch (cmd) {
                case "ready":
                    // can start
                    self.ready = true;
                    self.onReady();
                    break;
            }
             
            // ignore user messages that:
            //   1. were sent before termination and arrived after termination
            //   2. were sent by the worker while it was not "active"
            if (!self.running || !self.scriptRunning) return;
            
            var player = self.game.player;
            
            switch (cmd) {
                case "stop":
                    self.onScriptFinished();
                    break;
                case "action":
                    // action to be performed by agent
                    player.performActionDelayed(args);
                    break;
                case "error_eval":
                    self.events.scriptError.notify(args.message, args.stacktrace);
                    self.stopScript(true);
                    break;
            }
        };})(this);
        
        this.running = true;
        this.commandQueue = [];
        
        var initArgs = {
            baseUrl: baseUrl,
            userScriptFileNames: [WorkerScriptConstants.UserScriptName]
        };
        this.worker.postMessage({command: "init", args: initArgs});    // start worker
    };
    
     /**
      * Terminates the worker. You will have to call startWorker again to run more scripts.
      */
    WorkerScriptContext.prototype.stopWorker = function() {
        if (!this.worker) return;
        this.stopScript();
        this.ready = false;
        this.running = false;
        this.worker.terminate();
        this.worker = null;
    };
    
     /**
      * Cancel the currently running script.
      */
    WorkerScriptContext.prototype.stopScript = function(dontNotify) {
        if (this.scriptRunning) {
            clearTimeout(this.scriptTimer);
            this.scriptRunning = null;
            this.scriptTimer = null;
            if (!dontNotify) 
                this.events.scriptCancelled.notify();
        }
    };
    
    
     /**
      * Called as soon as the Worker is fully initialized.
      */
    WorkerScriptContext.prototype.onReady = function() {
        for (var i = 0; i < this.commandQueue.length; ++i) {
            var cmd = this.commandQueue[i];
            cmd();
        }
    };
    
     /**
      * Restarts the worker when a script ran too long.
      */
    WorkerScriptContext.prototype.onScriptTimeout = function() {
        this.events.scriptTimeout.notify();
        this.stopScript(true);
        this.restartWorker();
    };
    
     /**
      * Notifies listeners of the scriptFinished event.
      */
    WorkerScriptContext.prototype.onScriptFinished = function() {
        this.stopScript(true);
        this.events.scriptFinished.notify();
    };

     /**
      * Runs the given code in this context. Also starts a timer to stop execution after the given default timeout (in millis).
      * 
      * @param {UserScript} script A script to be executed.
      */
    WorkerScriptContext.prototype.runUserCode = function(code) {
        if (!this.worker) throw new Error("Trying to run script while worker is not running: " + (code.length > 60 ? code.substring(0, 60) + "..." : script));
        if (this.ready) {
            // go right ahead
            var self = this;
            
            // notify and start timer to make sure, the user script won't run forever
            this.events.scriptStarted.notify();
            this.scriptRunning = true;
            this.scriptTimer = setTimeout(function() { if (self.scriptRunning) { self.onScriptTimeout(); } }, this.defaultScriptTimeout);
        
            // create script object and run it
            var script = new wumpusGame.UserScript({name: WorkerScriptConstants.UserScriptName, codeString: code});
            this.runScript(script);
        }
        else {
            // wait until its ready
            var self = this;
            this.commandQueue.push(function() { self.runUserCode(code); } );
        }
    };

     /**
      * Runs the given script in this context.
      * 
      * @param {UserScript} script A script to be executed.
      */
    WorkerScriptContext.prototype.runScript = function(script) {
        var code = script.getCodeString();
        var cmd = {
            command: "run",
            args: { 
                code: code,
                name: script.name
            }
        };
        this.worker.postMessage(cmd);
    };
    
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
