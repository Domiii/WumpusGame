/**
 * This file contains the initializes WorkerScriptCode to safely run any UserScript.
 * This ensures that the UserScript cannot interfere with the game context.
 */

"use strict";

define(["squishy", "./UserScript"], function(squishy) {
	 /**
	  * Constructs a ScriptContext object which determines how a script is executed.
	  * 
	  * @constructor
	  * @param {Object} game The game object that owns this context.
	  */
	var WorkerScriptContext = function(game, defaultScriptTimeout) {
		squishy.assert(game, "game is not defined");
		this.game = game;
		this.defaultScriptTimeout = defaultScriptTimeout || 500;
		
		this.scriptTimer = null;

		// copy config into this context
		//squishy.clone(config, this, false);
	};
	
	 /**
	  * Whether a script is currently running.
	  */
	WorkerScriptContext.prototype.isRunning = function() {
		return !!this.scriptTimer;		// convert to bool
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
		if (this.worker) return;			// check if already running
		
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
        this.worker.onmessage = (function(self) { return function (event) {
			if (!self.running) return;			// probably some message that was sent before termination and arrived after termination
			
			// input generated by UserScript
			var data = event.data;
			var cmd = data.command;
			var args = data.args;
			var player = self.game.player;
			switch (cmd) {
				case "action":
					// action to be performed by agent
        
        console.log('action: ' + args);
					player.performActionDelayed(args);
					break;
				case "error_eval":
					self.game.events.scriptError.notify(args.message, args.stacktrace);
					break;
			}
		};})(this);
		
		this.running = true;
		this.worker.postMessage({command: "init", args: baseUrl});	// start worker
	};
	
	 /**
	  * Terminates the worker. You will have to call startWorker again to run more scripts.
	  */
	WorkerScriptContext.prototype.stopWorker = function() {
		if (!this.worker) return;
		this.running = false;
	    this.worker.terminate();
		this.worker = null;
	}

	 /**
	  * Runs the given script in this context. Also starts a timer to stop execution after the given default timeout (in millis).
	  * 
	  * @param {UserScript} script A script to be executed.
	  */
	WorkerScriptContext.prototype.runScript = function(script) {
		var self = this;
		//this.scriptTimer = setTimeout(function() { self.restartWorker(); }, this.defaultScriptTimeout);
		
		this.worker.postMessage({
			command: "run",
			args: script.codeString
		});
	};
	
	// /**
	 // * Creates a string from a set of named globals that will be provided to the worker.
	 // * The initFunction will be executed anonymously, without arguments.
	 // */
	// WorkerScriptContext.prototype.buildWorkerCode = function(initFunction, globals) {
		// var str = WorkerScriptContext.objToVars(globals);
		// str += "(" + initFunction + ")(); ";
		// return str;
	// };
	
	// /**
	 // * This is a "deep toString" function. Unlike JSON.stringify, this also works for functions.
	 // * It also unwraps the outmost layer.
	 // * For example, {a : 'a', x = { y = 2 }} becomes:
	 // * 		"var a = 'a';
	 // *		var x = { 
	 // *			y = 2;
	 // *		};"
	 // */
	// WorkerScriptContext.objToVarString = function(obj, layer, indent) {
		// // TODO: Consider using proper stringbuilder for better performance
		
		// var str = "";
		// var isArray = typeof(obj) === "array";
		
		// if (!layer) {
			// layer = 0;
			// squishy.assert(!isArray, "objToVars cannot be called on arrays at the outmost layer. Consider starting with layer = 1.");
		// }
		
		// // prepare indentation
		// if (!indent) {
			// indent = "";
			// for (var i = 0; i < layer; ++i) {
				// indent += "    ";
			// }
		// }
		// else {
			// indent += "    ";
		// }
		
		// if (layer) {
			// // wrap object in the right parentheses
			// str += (isArray ? "[" : "{") + "\n";
		// }
		
		// for (var propName in obj) {
			// var prop = obj[propName];
			// var propStr;
			// if (prop.hasAnyProperty()) {
				// // prop is an object
				// propStr = WorkerScriptContext.objToVars(prop, layer+1, indent);
			// }
			// else {
				// propStr = prop.toString();
			// }
			// if (!layer) {
				// // unwrap outmost layer
				// str += indent + "var " + propName + " = " + propStr + ";\n";
			// }
			// else {
				// if (isArray) {
					// str += indent + propStr + ",\n";
				// }
				// else {
					// str += indent + propName + " : " + propStr + ",\n";
				// }
			// }
		// }
		
		// // remove dangling comma
		// if (str.trim().endsWith(",")) {
			// str = str.substring(0, str.length-1);
		// }
		
		// if (layer > 0) {
			// str += "\n" + indent;
			// str += isArray ? "]" : "}";
		// }
		// return str;
	// };
	
	return WorkerScriptContext;
});