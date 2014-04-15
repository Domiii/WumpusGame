/**
 * This file defines the squishy namespace as part of the global namespace.
 */
/*jslint node: true */
"use strict";
 
// create the squishy namespace
var squishy = squishy || {};


/**
 * Returns the global context object.
 */
squishy.getGlobalContext = function() {
    if (typeof(GLOBAL) !== "undefined")  {
        // Node.js
        return GLOBAL;
    }
    else if (typeof(window) !== "undefined") {
        // Browser
        return window;
    }
    else if (typeof(self) !== "undefined") {
        // Web Worker & some other APIs
        return self;
    }
    else {
        throw new Error("Unkown run-time environment. Currently only browsers, Node.js and web workers are supported.");
    }
};

/**
 * Exports the given object of the given name into the global context.
 */
squishy.exportGlobal = function(name, object) {
    var global = squishy.getGlobalContext();
    global[name] = object;
};

// export squishy itself
squishy.exportGlobal("squishy", squishy);


// require other squishy-related files

// TODO: http://stackoverflow.com/questions/18163413/how-to-make-a-requirejs-module-with-multiple-files

define(["squishy/../squishy.util", "squishy/../squishy.domUtil"], function() {
    return squishy;
});