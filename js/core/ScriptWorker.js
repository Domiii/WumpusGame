/**
 * This file contains the code and context for a web worker to run a given UserScript.
 */

"use strict";


	 /**
	  * Constructs a ScriptContext object which determines how a script is executed.
	  * 
	  * @constructor
	  * @param {Object} config The configuration for the script context.
	  * @param {Object} [config.game] The game object.
	  */
	wumpusGame.WorkerScriptContext = function(config) {
		squishy.assert(config.game, "config.game is not defined");

		// copy config into this context
		squishy.clone(config, this, false);

		// create new worker
		this.worker = new Worker();
		this.worker.onmessage = function(evt) {
			var data = evt.data;
			
		};
	};

	/**
	 * This function is executed in the worker.
	 * IMPORTANT: It will have an entirely different context.
	 * @see http://stackoverflow.com/questions/22506026/how-to-safely-run-user-supplied-javascript-code
	 */
	wumpusGame.WorkerScriptContext.workerInit = function() {
		var baseUrl = "../..";

		// import require.js if not present already
		if (typeof require === "undefined") {
			importScripts(baseUrl + "/lib/require.min.js");
		}
		
		// configure require.js
		require.config({
			baseUrl : baseUrl
		});
		
		//// get started
		//require("js/AppStarter.js");
		
		var grid;
		
		onmessage = function(event) {
			// simple interpreter
			var cmd = event.data.command;
			var args = event.data.args;
			switch (cmd) {
				case "set":
					// TODO: Set grid object
					break;
				case "eval":
					// TODO: Enforce hygiene...
					eval(args);
					break;
			};
		};
	};
	
	wumpusGame.WorkerScriptContext.actions = {
		moveForward : function() {
			postMessage();
		}
	};

	 /**
	  * Runs the given script in this context.
	  * 
	  * @param {wumpusGame.UserScript} script A script to be executed.
	  */
	wumpusGame.WorkerScriptContext.prototype.runScript = function(script) {
		
	};