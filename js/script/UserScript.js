/**
 * This file contains a wrapper for user-supplied Javascript strings.
 */
 "use strict";
 
define(["../core/WumpusGame.Def"], function(wumpusGame) {
     /**
      * Creates a new instance of a user-supplied script.
      * A (user-supplied) script is just a string that can be edited by a script editor and interpreted by Google Caja.
      * 
      * @param {Object} config The Script contents and settings.
      * @param {Element} [config.name] The name of this script (can be used for debugging to identify the script).
      * @param {Element} [config.codeString] The actual script as a string.
      */
    wumpusGame.UserScript = function(config) {
        // shallow-copy config options into this object
        squishy.clone(config, false, this);
        
        squishy.assert(typeof config.codeString === "string", "config.codeString is empty or otherwise invalid");
    };
    
    wumpusGame.UserScript.prototype = {
        /**
         * Add some stuff for debugging and safety purposes.
         */
        getCodeString : function() {
            var code = this.codeString;
            if (this.name) {
                code += "\n//@ sourceURL=" + this.name;
            }
            return code;
        }
    };
    
    return wumpusGame.UserScript;
});