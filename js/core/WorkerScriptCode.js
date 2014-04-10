/**
 * This file contains the worker code.
 * See the given link for built-in Worker globals.
 * @see https://developer.mozilla.org/en-US/docs/Web/Reference/Functions_and_classes_available_to_workers
 */
"use strict";

/**
 * @const
 */
this.evalFunctionName = "runScript";


/**
 * Evals the given text with proper error handling.
 */
this.runScript = function(text) {
	try {
        // override some vars
        var postMessage, onmessage;
        
		// TODO: Improve security. Consider ADSAFE, JSLint etc.
		eval(text);
	} catch (err) {
		var trace = printStackTrace({e: err});
		//console.log(trace.join("\n"));
		var args = {message: err.message, stacktrace: [] };
		var inEval = true;
		for (var i = 0; i < trace.length; ++i) {
			// Each line has the format: "functionName@url:line:column"
			var line = trace[i];
			var functionName = line.split("@", 1)[0].split(" ", 1)[0];
            
			// Ignore everything but actual eval call.
			if (inEval) {
				var info = line.split(":");
				var line = parseInt(info[info.length-2]);
				var column = parseInt(info[info.length-1]);
				var displayFunctionName = functionName == "eval" ? null : functionName;
				args.stacktrace.push({functionName: displayFunctionName, line: line, column: column});
			}
			if (functionName === "eval") {
				inEval = false;
			}
		}
        
        // run-time error
        console.log(args.stringify());
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
	// // import require.js if not present already
	// if (typeof require === "undefined") {
		// importScripts(baseUrl + "/lib/require.min.js");
	// }
	
	// // configure require.js
	// require.config({
		// baseUrl : baseUrl
	// });
	
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
                        Util: "js/util",
                        WumpusGame: "js",
                    },
                    shim: {
                    }
                });
                
                // import game constants
				require([baseUrl + "js/core/WumpusGame.Def.js"]);
                
				// TODO: Load enums and some other game context
				// TODO: Don't do anything before initialization has completed
				break;
			case "run":
				setTimeout(function() { self[evalFunctionName](args); }, 1);
				break;
			default:
				// developer error
				console.warn("invalid command received by worker: " + cmd);
				break;
		};
	};
})();