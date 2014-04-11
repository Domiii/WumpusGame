/**
 * This file contains the worker code.
 * This file is responsible for containing user-scripts and disallowing any potentially harmful action. 
 * The links explain the approach and the global context for web workers, respectively.
 *
 * @see http://stackoverflow.com/questions/10653809/making-webworkers-a-safe-environment
 * @see https://developer.mozilla.org/en-US/docs/Web/Reference/Functions_and_classes_available_to_workers
 */
"use strict";

var global = this;

/**
 * Lock down the context and disallow everything that is a potential security risk.
 *
 * @param {Array.<String>} ... Additional whitelist objects, imported from libraries.
 * @see http://stackoverflow.com/questions/10653809/making-webworkers-a-safe-environment
 */
self.lockDown = function(additionalWhiteListSymbols) {
	/**
	 * Only allow these globals.
	 * All other globals are potentially harmful or not portable between run-time environments.
	 */
	var whiteList = {
		"self": 1,
		"onmessage": 1,
		"postMessage": 1,
		"global": 1,
		"whiteList": 1,
		"eval": 1,
		"Array": 1,
		"Boolean": 1,
		"Date": 1,
		"Function": 1,
		"Number" : 1,
		"Object": 1,
		"RegExp": 1,
		"String": 1,
		"Error": 1,
		"EvalError": 1,
		"RangeError": 1,
		"ReferenceError": 1,
		"SyntaxError": 1,
		"TypeError": 1,
		"URIError": 1,
		"decodeURI": 1,
		"decodeURIComponent": 1,
		"encodeURI": 1,
		"encodeURIComponent": 1,
		"isFinite": 1,
		"isNaN": 1,
		"parseFloat": 1,
		"parseInt": 1,
		"Infinity": 1,
		"JSON": 1,
		"Math": 1,
		"NaN": 1,
		"undefined": 1,
		
		"Intl": 1,
		"console": 1,
		
		// globals from utility libraries
		"printStackTrace": 1,
		"require": 1,				// require is not configurable, but luckily its harmless without importScripts
		"define": 1,				// require is not configurable, but luckily its harmless without importScripts
		"requirejs": 1,				// require is not configurable, but luckily its harmless without importScripts
		
		// harmless helper objects
		"runScript": 1,				// as harmless as eval
		"initScriptContext": 1,		// initialize context for interacting with the remote simulator
		"scriptGlobals": 1,			// the global context object contains all globals for interacting with the remote simulator
		"lockDown": 1,				// lockDown will be set to null explicitely to check for execution
	};
	
	// add external libraries to safe list
	for (var i = 0; i < additionalWhiteListSymbols.length; ++i) {
		var arg = additionalWhiteListSymbols[i];
		whiteList[arg] = 1;
	}

	/**
	 * Remove all potentially harmful functions from the global context.
	 */
	Object.getOwnPropertyNames( global ).forEach( function( prop ) {
		if( !whiteList.hasOwnProperty( prop ) ) {
			Object.defineProperty( global, prop, {
				get : function() {
					throw "Security Exception: cannot access "+prop;
				}, 
				configurable : false
			});    
		}
	});

	/**
	 * Remove all potentially harmful functions from the global context.
	 */
	Object.getOwnPropertyNames( global.__proto__ ).forEach( function( prop ) {
		if( !whiteList.hasOwnProperty( prop ) ) {
			Object.defineProperty( global.__proto__, prop, {
				get : function() {
					throw "Security Exception: cannot access "+prop;
				}, 
				configurable : false
			});    
		}
	});
	
	// unset this function
	Object.defineProperty(global, "lockDown", {
		writable: false,
		configurable: false,
		enumrable: false,
		value: null
	});
};

/**
 * Joining large arrays can potentially crash browser tabs.
 * @see http://stackoverflow.com/questions/10653809/making-webworkers-a-safe-environment
 */
Object.defineProperty( Array.prototype, "join", {
    writable: false,
    configurable: false,
    enumrable: false,
    value: function(old){
        return function(arg){
            if( this.length > 500 || (arg && arg.length > 500 ) ) {
                throw "Exception: too many items";
            }

            return old.apply( this, arguments );
        };
    }(Array.prototype.join)

});


/**
 * Fancy version of eval, with proper error reporting.
 */
Object.defineProperty(global, "runScript", {
    writable: false,
    configurable: false,
    enumrable: false,
	value: function(code) {
		// expose script globals
		for (var key in scriptGlobals) {
			if (scriptGlobals.hasOwnProperty(key)) {
				self[key] = scriptGlobals[key];
			}
		}
		
		try {
			// Disallow self for compatability. (Other script contexts might not have "self".)
			(function(self) {
				eval(code);
			})();
		} catch (err) {
			var trace = printStackTrace({e: err});
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
	}
});


/**
 * Simulator-specific initialization of the Worker context.
 * @param {Function} onInitDone Is called after initialization has fininshed.
 */
Object.defineProperty(global, "initScriptContext",  {
    writable: false,
    configurable: false,
    enumrable: false,
	value: function(baseUrl, onInitDone) {
		// configure requirejs
		require.config({
			baseUrl : baseUrl,
			paths : {
				Util: "js/util",
				squishy: "js/util/squishy"
			},
			shim: {
			}
		});
		
		// import game-related stuff
		require([baseUrl + "js/core/WumpusGame.Def.js", "squishy"], function() {
			// Done loading. Signal that we are ready.
			onInitDone("wumpusGame", "squishy");
		});
	}
});


/**
 * Returns the set of simulator-specific globals, available for remote manipulation inside this Worker context.
 */
Object.defineProperty(global, "scriptGlobals",  {
    writable: false,
    configurable: false,
    enumrable: false,
	value: {
		/**
		 * Calling this function lets the agent move forward.
		 */
		moveForward: function() {
			postMessage({command: "action", args: wumpusGame.PlayerAction.Forward});
		}
	}
});
	

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
				if (!lockDown) return; 		// already initialized
                var baseUrl = args;
				
				// import some standard libraries
				importScripts(baseUrl + "lib/stacktrace.js");
				importScripts(baseUrl + "lib/require.js");
                
				// initialize simulator context
				initScriptContext(baseUrl, function() {
					// lock down the context and make it secure
					if (lockDown) {
						lockDown(arguments);
					}
				});
				break;
			case "run":
				if (lockDown) return;		// the context has not been locked down yet. That also implies that initialization has not finished yet.
				
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