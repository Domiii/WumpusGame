/**
 * This file contains a wrapper for user-supplied Javascript strings.
 */
 "use strict";

define(["squishy", "squishy/../squishy.crypto"], function() {
    /**
     * The same UserScript may be run in many different contexts at the same time.
     * In order to identify the execution context, we need to wrap it in a unique instance with a unique id.
     */
    squishy.UserScriptInstance = function(context, script) {
        this.context = context;
        this.contextId = context.contextId;     // this id changes on restart
        this.script = script;
        
        this.instanceId = squishy.randomInt();       // this id is known by the script code
        this.instanceKey = squishy.randomInt();      // this is a private key, not to be exposed to the code running in the script context
        this.running = true;
    };
    
    squishy.UserScriptInstance.prototype = {
        /**
         * Whether this script instance is still running.
         */
        isRunning: function() {
            return this.running;
        },
        
        /**
         * Whether the context is still the same as when the script started.
         * If it is not, any input from this script should be ignored.
         */
        isContextActive: function() {
            return this.contextId == this.context.contextId && this.context.running;
        },
        
         /**
          * Send action command to guest.
          */
        postAction: function(args) {
            this.postCommand("action", args);
        },
        
        /**
         * Send command message to guest.
         */
        postCommand: function(cmd, args) {
            this.postMessage({command: cmd, args: args});
        },
        
        /**
         * Send "signed" message to worker context.
         */
        postMessage: function(msg) {
            if (!this.running) {
                console.warn("Trying to send script message to Worker while script is not running: " + this);
                return;
            }
            
            msg.instanceId = this.instanceId;
            msg.instanceKey = this.instanceKey;
            
            this.context.postMessage(msg);
        },
        
        toString: function() {
            return this.script.toString();
        },
    };


    var lastScriptId = 0;

     /**
      * Creates a new instance of a user-supplied script.
      * A (user-supplied) script is just a string that can be edited by a script editor and interpreted by Google Caja.
      * 
      * @param {Object} config The Script contents and settings.
      * @param {Element} [config.name] The name of this script (can be used for debugging to identify the script).
      * @param {Element} [config.codeString] The actual script as a string.
      */
    squishy.UserScript = function(config) {
        // shallow-copy config options into this object
        squishy.clone(config, false, this);
        
        this.scriptId = ++lastScriptId;       // this is just for bookkeeping
        
        squishy.assert(typeof config.codeString === "string", "config.codeString is empty or otherwise invalid");
    };
    
    squishy.UserScript.prototype = {
        /**
         * Add "code id" for debugging purposes.
         */
        getCodeString : function() {
            return squishy.nameCode(this.codeString, this.name);
        },
        
        toString: function() {
            return this.name + " (" + this.scriptId + ")";
        }
    };
    
    return squishy.UserScript;
});