/**
 * This file contains capabilities for safe and simple editing & running of user-supplied scripts.
 */
 

 /**
  * Creates a new instance of a user-supplied script.
  * A (user-supplied) script is just a string that can be edited by a script editor and interpreted by Google Caja.
  * 
  * @param {Object} config The Script contents and settings.
  * @param {Element} [config.text] The underlying DOM element of the grid.
  */
searchGame.Script = function(config) {
    // shallow-copy config options into this object
    config.clone(false, this);
    
    squishy.assert(config.text.length, "text has not been given");
};

/**
 * Run this script, using the global scriptContext.
 */
searchGame.Script.prototype.run() {
    // create script context, if not already created
    if (!global.scriptContext) {
        global.scriptContext = new searchGame.ScriptContext();
    }
    
    var context = global.scriptContext;
    
    
};

 /**
  * The constructor of a .
  * 
  * @param {Object=} config The optional configuration for the script context.
  * @param {Element=} [config.text] The underlying DOM element of the grid.
  */
searchGame.ScriptContext = function(config) {
    
};