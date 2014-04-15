/**
 * This file initializes and manages the remote GuestCode to safely run any UserScript.
 */

"use strict";

define(["squishy", "./UserScript"], function(squishy) {
    // ################################################################################################################################################################
    // static variables
    
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
      * @param {Object} config Configuration
      */
    var WorkerScriptContext = function(config) {
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
        
        // copy config into this context
        squishy.clone(config, false, this);
    };
    
    
    // ################################################################################################################################################################
    // Start & stop worker
    
    
     /**
      * Whether a script is currently running.
      */
    WorkerScriptContext.prototype = {
         /**
          * Restarts the worker (stops if it is currently running).
          */
        restartWorker: function() {
            this.stopWorker();
            this.startWorker();
        },
        
         /**
          * Starts and initializes the worker that executes UserScript objects in parallel, in a separate context.
          */
        startWorker: function() {
            if (this.running) return;            // check if already running
            
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
            this.worker = new Worker("js/script/GuestScriptContext.js");
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
        },
        
         /**
          * Terminates the worker. You will have to call startWorker again to run more scripts.
          */
        stopWorker: function() {
            if (!this.worker) return;
            
            var self = this;
            Object.keys(this.runningScriptInstances).forEach(function(prop) {
                if (self.runningScriptInstances.hasOwnProperty(prop)) {
                    var scriptInstance = self.runningScriptInstances[prop];
                    self.stopScript(scriptInstance, true);
                }
            });
            this.ready = false;
            this.running = false;
            this.worker.terminate();
            this.worker = null;
        },
        
        
        // ################################################################################################################################################################
        // Protocol implementation
        
        /**
         * Send command message to guest.
         */
        postCommand: function(cmd, args) {
            this.postMessage({command: cmd, args: args});
        },
        
         /**
          * Send message to guest.
          */
        postMessage: function(msg) {
            squishy.assert(this.worker, "Trying to postMessage while worker is not running.");
            
            if (DEBUG) {
                this.protocolLog.push(msg);
            }
            
            this.worker.postMessage(msg);
        },
        
        /**
         * Called whenever a message is received by the host.
         */
        onmessage: function (event) {
            var msg = event.data;
            var instanceId = msg.instanceId;
            var cmd = msg.command;
            var args = msg.args;
            
            if (DEBUG) {
                this.protocolLog.push(msg);
            }
            
            if (!cmd) return;
            
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
                // The script that sent this message is gone (invalid user-sent message or a left-over message of a terminated script).
                console.warn("Message received from invalid scriptInstance (" + instanceId + "): " + cmd + "; args: " + squishy.objToString(args));    // TODO: Localization
                this.events.scriptInvalidMessage.notify(scriptInstance, msg);
                return;
            }
            
            switch (cmd) {
                // Script-dependent WorkerScriptContext protocol
                case "start":
                    var key = args;
                    if (key != scriptInstance.instanceKey) {
                        // The start message is used to start the script timeout timer. If a user can fake the message, user code can keep running forever.
                        // If there is an invalid start message: There either is a bug in security-critical code, or someone is trying to cheat.
                        console.warn("Illegal start message from userscript: " + scriptInstance);    // TODO: Localization
                        this.events.scriptInvalidMessage.notify(scriptInstance, msg);
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
                        this.events.scriptInvalidMessage.notify(scriptInstance, msg);
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
                    this.onAction(args);
                    break;
                default:
                    this.events.scriptInvalidMessage.notify(scriptInstance, msg);
                    break;
            }
        },
        
        /**
         * Is called whenever the client sends a custom action.
         */
        onAction: squishy.abstractMethod(),
        
        
        // ################################################################################################################################################################
        // Initialization part of the protocol
        
        setGuestGlobals: function(guestGlobals) {
            this.guestGlobals = guestGlobals;
        },
        
        /**
         * Is called after a new Worker has started.
         * Initializes guest environment.
         */
        initializeGuest: function(baseUrl) {
            //initArgs.workerId: this.workerId;
            var initArgs = {
                baseUrl: baseUrl,
                guestGlobals: squishy.objToString(this.guestGlobals)
            };
            
            this.postMessage({command: "init", args: initArgs});    // start worker
        },
        
         /**
          * Called when the guest finished initialization.
          * Runs queued commands.
          */
        onReady: function() {
            for (var i = 0; i < this.commandQueue.length; ++i) {
                var cmd = this.commandQueue[i];
                cmd();
            }
            this.commandQueue = [];
        },
        
        // ################################################################################################################################################################
        // Run, stop and manage UserScripts and UserScriptInstances
        
         /**
          * Cancel the currently running script.
          */
        stopScript: function(scriptInstance, dontNotify) {
            if (scriptInstance.scriptTimer) {
                clearTimeout(scriptInstance.scriptTimer);
            }
            if (scriptInstance.running) {
                scriptInstance.running = false;
                if (!dontNotify) 
                    this.events.scriptCancelled.notify(scriptInstance);
            }
        },
        
         /**
          * Restarts the worker when a script ran too long.
          */
        onScriptTimeout: function(scriptInstance) {
            this.events.scriptTimeout.notify(scriptInstance);
            this.restartWorker();
        },
        
         /**
          * Notifies listeners of the scriptFinished event.
          */
        onScriptFinished: function(scriptInstance) {
            this.stopScript(scriptInstance, true);
            this.events.scriptFinished.notify(scriptInstance);
        },

         /**
          * Runs the given code in this context. Also starts a timer to stop execution after the given default timeout (in millis).
          * 
          * @param {UserScript} script A script to be executed.
          */
        runUserCode: function(code, name) {
            // create script object and run it
            var script = new squishy.UserScript({name: name, codeString: code});
            return this.runScript(script);
        },

         /**
          * Runs the given script in this context.
          * 
          * @param {UserScript} script A script to be executed.
          */
        runScript: function(script) {
            var scriptInstance = new squishy.UserScriptInstance(this, script);
            this.runScriptInstance(scriptInstance);
            return scriptInstance;
        },

         /**
          * Runs the given ScriptInstance in this context.
          * 
          * @param {UserScript} script A script to be executed.
          */
        runScriptInstance: function(scriptInstance) {
            squishy.assert(this.running, "Trying to run ScriptInstance while context was not initialized: " + scriptInstance);
            
            if (this.ready) {
                // Guest has been initialized:
                squishy.assert(!scriptInstance.started, "UserScriptInstances must not be executed more than once: " + scriptInstance);
                scriptInstance.started = true;
                
                // notify listeners
                this.events.scriptStarted.notify(scriptInstance);
                
                // start timer to make sure, the user script won't run forever
                this.runningScriptInstances[scriptInstance.instanceId] = scriptInstance;
            
                var code = scriptInstance.script.getCodeString();
                
                // run script
                scriptInstance.postCommand("run", {
                    code: code,
                    name: scriptInstance.script.name
                });
            }
            else {
                // queue script, and run it when guest is ready:
                this.commandQueue.push((function(self) { return function() { self.runScriptInstance(scriptInstance); }; })(this));
            }
        },
        
        
        // ################################################################################################################################################################
        // Code-to-string helpers:
        
        /**
          * Creates a string from a set of named globals that will be provided to the worker.
          * The initFunction will be executed anonymously, without arguments.
          */
        buildWorkerCode: function(initFunction, globals) {
            var str = squishy.objToString(globals);
            str += "(" + initFunction + ")(); ";
            return str;
        }
    };
    
    return WorkerScriptContext;
});
