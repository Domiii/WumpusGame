/**
 * This file contains the worker code.
 * See the given link for built-in Worker globals.
 * TODO: Fix this (http://stackoverflow.com/questions/10653809/making-webworkers-a-safe-environment)
 * @see https://developer.mozilla.org/en-US/docs/Web/Reference/Functions_and_classes_available_to_workers
 */
"use strict";


/**
 * Evals the given text with proper error handling.
 */
this.runScript = function(text) {
	try {
        // use a black-list approach to disable any outside-world communication
        (function(postMessage, onmessage, Worker, WebSocket, XMLHttpRequest, importScripts, require, requirejs, define, jQuery, $) {
            // TODO: Improve security. Consider ADSAFE & JSLint
            eval(text);
        })();
	} catch (err) {
		var trace = printStackTrace({e: err});
		//console.log(trace.join("\n"));
		var args = {message: err.message, stacktrace: [] };
		var beforeEval = true;
		for (var i = 0; i < trace.length; ++i) {
			// Each line has the format: "functionName@url:line:column"
			var line = trace[i];
			var functionName = line.split("@", 1)[0].split(" ", 1)[0];
            
			// Ignore everything but actual eval call.
			if (beforeEval) {
				var info = line.split(":");
				var line = parseInt(info[info.length-2]);
				var column = parseInt(info[info.length-1]);
				var displayFunctionName = functionName == "eval" ? null : functionName;
				args.stacktrace.push({functionName: displayFunctionName, line: line, column: column});
			}
			if (functionName === "eval") {
				beforeEval = false;
			}
		}
        
        if (beforeEval) {
            // never went into eval(), so all this information should not be given to the user, only to the developer
            console.warn(err.stack);
            args.stacktrace = [];
        }
        else {
            console.warn(err.stack);
        }
        
        // run-time error
        postMessage({command: "error_eval", args: args});
	}
};

/**
 * Calling this function lets the agent move forward.
 */
this.moveForward = function() {
	postMessage({command: "action", args: wumpusGame.PlayerAction.Forward});
};

/**
 * This function is initially and anonymously called to initialize this Worker.
 */
(function() {

	// register the message handler which acts as a simple command interpreter.
	onmessage = function(event) {
		if (!event.data) return;
		
		var cmd = event.data.command;
		var args = event.data.args;
		switch (cmd) {
			case "init":
                var baseUrl = args;
                
                // import some standard libraries
				importScripts(baseUrl + "lib/stacktrace.js");
				importScripts(baseUrl + "lib/require.js");
                
                // configure requirejs
                require.config({
                    baseUrl : baseUrl,
                    paths : {
                        Util: "js/util"
                    },
                    shim: {
                    }
                });
                
                // import game constants
				require([baseUrl + "js/core/WumpusGame.Def.js"]);
				break;
			case "run":
                // run the actual script outside the context of the initializer
				setTimeout(function() { runScript(args); }, 1);
				break;
			default:
				// developer error
				console.warn("invalid command received by worker: " + cmd);
				break;
		};
	};
})();