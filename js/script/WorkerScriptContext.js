/**
 * This file initializes and manages the remote GuestCode to safely run any UserScript.
 */

"use strict";

define(["squishy", "./UserScript", "./UserCommand"], function(squishy, UserScript, UserCommand) {
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
        this.timeoutTimer = null;
        this.events = {
            commandStarted: new squishy.Event(this),
            commandFinished: new squishy.Event(this),
            commandCancelled: new squishy.Event(this),
            commandTimeout: new squishy.Event(this),
            scriptError: new squishy.Event(this),
            invalidGuestResponse: new squishy.Event(this)      // args: triggeringCommand, message
        }
        
        // guestResponseHandlers are called when the guest sends a custom response
        this.guestResponseHandlers = {};
        
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
            
            // setup command tracking
            this.contextId = ++lastContextId;
            this.running = true;
            this.sentCommands = {};
            this.callbackQueue = [];
            
            if (DEBUG) {
                // keep track of all messages sent forth and back
                this.protocolLog = [];
            }
            
            // send initialization message
            this.initializeGuest(baseUrl);
        },
        
         /**
          * Terminates the worker.
          * You will have to call startWorker again to run more commands.
          */
        stopWorker: function() {
            if (!this.worker) return;
            
            var self = this;
            Object.keys(this.sentCommands).forEach(function(prop) {
                if (self.sentCommands.hasOwnProperty(prop)) {
                    var cmd = self.sentCommands[prop];
                    self.stopCommand(cmd, true);
                    
                    // stop timeout timer
                    if (cmd.timeoutTimer) {
                        clearTimeout(cmd.timeoutTimer);
                    }
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
         * Register a callback to be called when the guest sends a custom command.
         * Every such guest message will be checked with checkPrivilegedAction, unless notPrivileged is set to true.
         * IMPORTANT: If notPrivileged is set to true, the handler should have as few parameters as possible and MUST thorougly validate all arguments to prevent the following:
         *      -> Cheating (allow the user to do things that it usually cannot).
         *      -> Execution of potentially harmful code.
         *      -> Unwanted modification of global state.
         */
        setGuestResponseHandler: function(name, handler, notPrivileged) {
            handler.isPrivileged = !notPrivileged;
            this.guestResponseHandlers[name] = handler;
        },
        
        /**
         * Send command message to guest.
         */
        postCommand: function(commandOrcommandName, args, doesNotRequireReady) {
            var cmd;
            
            // check function overloading: First parameter may be commandName or the actual command object
            // Must use typeof, cannot use instanceof here (see http://stackoverflow.com/questions/203739/why-does-instanceof-return-false-for-some-literals)
            if (typeof commandOrcommandName === "string") {
                cmd = new UserCommand(this, commandOrcommandName, args);
            }
            else {
                cmd = commandOrcommandName;
            }
            
            if (!doesNotRequireReady && !this.ready) {
                // queue message, and run it when guest is ready:
                this.callbackQueue.push(function() { this.postCommand(cmd); }.bind(this));
            }
            else {
                // notify listeners
                this.events.commandStarted.notify(cmd);
                
                // add to list of active commands
                this.sentCommands[cmd.getId()] = cmd;
                
                // send message to guest
                this.postMessage(cmd.message, doesNotRequireReady);
            }
        },
        
         /**
          * Send message to guest.
          */
        postMessage: function(msg) {
            squishy.assert(this.worker, "Tried to call postMessage while worker is not running.");
            
            // log message and send to guest
            if (DEBUG) {
                this.protocolLog.push(msg);
            }
            this.worker.postMessage(msg);
        },
        
        /**
         * Called whenever a message is received by the host.
         */
        onmessage: function (event) {
            var guestMsg = event.data;
            var senderId = guestMsg.senderId;
            var guestResponse = guestMsg.command;
            var args = guestMsg.args;
            
            if (DEBUG) {
                this.protocolLog.push(guestMsg);
            }
            
            if (!guestResponse) return;
            
            // Script-independent WorkerScriptContext protocol
            switch (guestResponse) {
                case "ready":
                    // worker finished initialization
                    this.ready = true;

                    // call queued callbacks
                    for (var i = 0; i < this.callbackQueue.length; ++i) {
                        var callback = this.callbackQueue[i];
                        callback();
                    }
                    this.callbackQueue = [];
                    
                    // signal possible listeners
                    this.onGuestReady();
                    return;
            }
             
            // ignore user messages that were sent before termination and arrived after termination
            if (!this.running) return;
            
            // Retrieve the host command instance that triggered this message.
            var triggeringCommand = this.sentCommands[senderId];
            if (!triggeringCommand || !triggeringCommand.isActive()) {
                // The command that caused this message to be sent is gone (invalid user-sent message or a left-over message of a terminated script).
                console.warn("Guest response was triggered by invalid host command (" + senderId + "): " + guestResponse + "; args: " + squishy.toString(args));    // TODO: Localization
                this.events.invalidGuestResponse.notify(triggeringCommand, guestMsg);
                return;
            }
            
            switch (guestResponse) {
                // Script-dependent WorkerScriptContext protocol
                case "start":
                    // The start command is privileged.
                    // It is used to start the script timeout timer. If a user can execute this command, user code can keep running forever.
                    // If there is an invalid start message: There either is a bug in security-critical code, or someone is trying to cheat.
                    if (!this.checkPrivilegedAction(triggeringCommand, guestMsg) || triggeringCommand.timeoutTimer) return;
                    
                    // start timer to make sure, command execution won't run forever
                    triggeringCommand.timeoutTimer = setTimeout(function() {
                            if (triggeringCommand.isActive()) {
                                this.onCommandTimeout(triggeringCommand);
                            }
                        }.bind(this),
                        this.defaultScriptTimeout);
                    break;
                case "stop":
                    // The stop command is privileged.
                    // It is used to stop the script timeout timer. If a user can execute this command, user code can keep running forever.
                    // If there is an invalid stop message: There either is a bug in security-critical code, or someone is trying to cheat.
                    if (!this.checkPrivilegedAction(triggeringCommand, guestMsg)) return;
                    
                    this.onCommandFinished(triggeringCommand);
                    break;
                case "error_eval":
                    // TODO: Get an idea of how the error came about and do not run erroneous scripts again before restart, in order to avoid evil infinite loops and error spam
                    this.events.scriptError.notify(args.message, args.stacktrace);
                    break;
                default:
                    var handler = this.guestResponseHandlers[guestResponse];
                    if (handler) {
                        if (handler.isPrivileged && !checkPrivilegedAction(triggeringCommand, guestMsg)) return;
                        handler(args);
                    }
                    else {
                        // invalid guest response
                        this.events.invalidGuestResponse.notify(triggeringCommand, guestMsg);
                    }
                    break;
            }
        },
        
        /**
         * Check whether the given guest message, triggered by the given command, is authenticated to perform privileged actions on the host side.
         */
        checkPrivilegedAction: function(triggeringCommand, guestMsg) {
            var key = guestMsg.securityToken;
            
            // The guest message must have the triggeringCommand's securityToken.
            // If it does not have that, we have a security breach.
            if (key != triggeringCommand.getSecurityToken()) {
                console.warn("Possible SECURITY breach: Guest tried to execute privileged command " + guestMsg.command + " without proper authentication. Triggered by: " + triggeringCommand);
                this.events.invalidGuestResponse.notify(triggeringCommand, guestMsg);
                this.restartWorker();
                return false;
            }
            return true;
        },
        
        
        // ################################################################################################################################################################
        // Initialization part of the protocol
        
        /**
         * Is called after initialization (in the host context!)
         */
        onGuestReady: squishy.abstractMethod(),
        
        /**
         * Remembers a set of globals to be sent to the guest upon initialization.
         */
        setGuestGlobals: function(guestGlobals) {
            this.guestGlobals = guestGlobals;
        },
        
        /**
         * Is called after a new Worker has started.
         * Initializes guest context.
         */
        initializeGuest: function(baseUrl) {
            squishy.assert(this.guestGlobals, "setGuestGlobals must be called on ScriptContext, prior to initialization.");
            
            var initArgs = {
                baseUrl: baseUrl,
                guestGlobals: squishy.nameCode(squishy.objToEvalable(this.guestGlobals), "initGuestGlobals")
            };
            
            this.postCommand("init", initArgs, true);    // initialize guest context
        },
        
        // ################################################################################################################################################################
        // Run, stop and manage UserScripts and UserCommands
        
         /**
          * Prevent the given command from having any further effects.
          */
        stopCommand: function(command, dontNotify) {
            if (command.isActive()) {
                command.active = false;
                if (!dontNotify) {
                    this.events.commandCancelled.notify(command);
                    console.log(new Error().stack);
                }
            }
        },
        
         /**
          * Restarts the worker when a script ran too long.
          */
        onCommandTimeout: function(command) {
            var contextId = this.contextId;
            this.events.commandTimeout.notify(command);
            if (contextId == this.contextId) {
                // worker was not restarted by event listeners, so we do it now
                this.restartWorker();
            }
        },
        
         /**
          * Notifies listeners of the scriptFinished event.
          */
        onCommandFinished: function(command) {
            this.stopCommand(command, true);
            this.events.commandFinished.notify(command);
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
            // run script
            this.postCommand("run", {
                code: script.getCodeString(),
                name: script.name
            });
        },
        
        
        // ################################################################################################################################################################
        // Code-to-string helpers:
        
        /**
          * Creates a string from a set of named globals that will be provided to the worker.
          * The initFunction will be executed anonymously, without arguments.
          */
        buildWorkerCode: function(initFunction, globals) {
            var str = squishy.toString(globals);
            str += "(" + initFunction + ")(); ";
            return str;
        }
    };
    
    return WorkerScriptContext;
});
