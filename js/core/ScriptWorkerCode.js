/**
 * This file contains the worker code.
 * See the given link for built-in Worker globals.
 * @see https://developer.mozilla.org/en-US/docs/Web/Reference/Functions_and_classes_available_to_workers
 */
"use strict";

/**
 * @const
 */
var evalFunctionName = "doEval";


/**
 * Eval the given text.
 */
this.doEval = function(text) {
	try {
		// TODO: Improve security. Consider ADSAFE, JSLint etc.
		eval(text);
	} catch (err) {
		// var trace = printStackTrace({e: err});
		// console.log(err.stack);
		var trace = printStackTrace({e: err});
		//console.log(trace.join("\n"));
		var args = {message: err.message, stacktrace: [] };
		var inEval = true;
		for (var i = 0; i < trace.length; ++i) {
			// Each line has the format: "functionName@url:line:column"
			// Ignore everything but actual eval call.
			var line = trace[i];
			var functionName = line.split("@", 1)[0].split(" ", 1)[0];
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
		if (args.length == 0) {
			// either the parser was unable to parse the code and no extra information was generated (happens in webkit), or there is something wrong in this file
			postMessage({command: "error_static", args: args});
			throw err;			// throw the error anyway
		}
		else {
			// run-time error
			postMessage({command: "error_runtime", args: args});
		}
	}
};

/**
 * Calling this function lets the agent move forward.
 */
this.moveForward = function() {
	postMessage({command: "action", args: PlayerAction.Forward});
};

/**
 * This function is initially and anonymously called to initialize this Worker.
 */
(function() {
	var baseUrl = "../..";
	
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
				importScripts("http://localhost/lib/stacktrace.js");
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