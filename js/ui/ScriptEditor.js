/**
 * This file contains capabilities for safe and simple editing & running of user-supplied scripts.
 */
 

 /**
  * The constructor of a new script.
  * A (user-supplied) script is just a string that can be edited by a script editor and interpreted by Google Caja.
  * 
  * 
  */
searchGame.Script = function(config) {
};


/**
 * The constructor of a new script editor.
 *
  * @param {Object} config The ScriptEditor configuration.
  * @param {Element} [config.editorEl] The underlying DOM element of the editor.
 */
searchGame.ScriptEditor = function(config) {
    // initialize the script editor
    var scriptEditor = ace.edit(config.editorEl);
    scriptEditor.setTheme("ace/theme/monokai");
    scriptEditor.getSession().setMode("ace/mode/javascript");
};