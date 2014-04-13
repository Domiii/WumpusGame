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
      * @param {Element} [config.text] The actual script as a string.
      */
    wumpusGame.UserScript = function(config) {
        // shallow-copy config options into this object
        squishy.clone(config, false, this);
        
        squishy.assert(config.codeString && typeof config.codeString.length !== "undefined", "the script is empty or otherwise invalid");
    };
    
    return wumpusGame.UserScript;
});