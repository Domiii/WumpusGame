/**
 *
 */
"use strict";

define(["squishy", "./UserScript"], function() {
    /**
     * Indexes all scripts by their virtualPath property.
     */
    var UserScriptManager = function() {
        this.scripts = {};
        this.scriptList = [];
    };
    
    // methods
    UserScriptManager.prototype = {
        /**
         * Adds the given script to this manager.
         */
        addScript: function(script) {
            if (!script.virtualPath || this.scripts[script.virtualPath]) {
                throw new Error("Invalid script name or script with same name has already been added: " + script);
            }
            this.scripts[script.virtualPath] = script;
            this.scriptList.push(script);
        },
        
        /**
         * 
         */
        getScript: function(virtualPath) {
            return this.scripts[virtualPath];
        }
    };
    
    return UserScriptManager;
});