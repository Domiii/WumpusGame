/**
 * This file contains a wrapper for user-supplied Javascript strings.
 */
 "use strict";

define(["Squishy", "Squishy/../squishy.crypto"], function() {
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