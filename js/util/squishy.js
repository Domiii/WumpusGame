/**
 * This file defines the squishy namespace as part of the global namespace.
 */
/*jslint node: true */
"use strict";
 
// create the squishy namespace
var squishy = squishy || {};

/**
 * Exports the given object into the global context.
 */
squishy.exportGlobal = function(name, object) {
	if (typeof(GLOBAL) !== "undefined")  {
		// Node.js
		GLOBAL[name] = object;
	}
	else if (typeof(window) !== "undefined") {
		// JS with GUI (usually browser)
		window[name] = object;
	}
	else {
		throw new Error("Unkown run-time environment. Currently only browsers and Node.js are supported.");
	}
};

// export squishy itself
squishy.exportGlobal("squishy", squishy);