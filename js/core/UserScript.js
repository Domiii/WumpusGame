/**
 * This file contains capabilities for safe and simple editing & running of user-supplied scripts.
 */
 "use strict";

require(["./core/ScriptWorker"], function () {
	 /**
	  * Creates a new instance of a user-supplied script.
	  * A (user-supplied) script is just a string that can be edited by a script editor and interpreted by Google Caja.
	  * 
	  * @param {Object} config The Script contents and settings.
	  * @param {Element} [config.text] The actual script as a string.
	  * @param {wumpusGame.ScriptContext} [config.context] The context that determines how this script should be executed.
	  */
	wumpusGame.UserScript = function(config) {
		// shallow-copy config options into this object
		squishy.clone(config, false, this);
		
		squishy.assert(config.text && typeof config.text.length !== "undefined", "the script is empty or otherwise invalid");
		squishy.assert(config.context, "The script context is missing");
	};

	/**
	 * Run this script, in this script's context.
	 */
	wumpusGame.UserScript.prototype.run = function() {
		// create script context, if not already created
		// if (!global.scriptContext) {
			// global.scriptContext = new wumpusGame.ScriptContext();
		// }
		// var context = global.scriptContext;
		var context = this.context;
		
		// TODO
	};
});