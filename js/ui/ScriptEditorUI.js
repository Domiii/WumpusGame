/**
 * This file contains capabilities for (safe and) simple editing & running of user-supplied scripts.
 */
"use strict";
 

/**
 * Makes the given DOM element a script editor, according to the given options.
 *
 * @constructor
 * @param {Object} config The ScriptEditor configuration.
 * @param {Element} [config.editorEl] The underlying DOM element of the editor.
 * @param {String=} [config.theme] The theme (Default = "ace/theme/monokai").
 * @param {String=} [config.mode] The mode (Default = "ace/mode/javascript").
 */
wumpusGame.makeScriptEditor = function(gameUI, config) {
    // sanity checks
    squishy.assert(gameUI);
    squishy.assert(config.editorEl);
    
    // default settings
    if (!config.theme) {
        config.theme = "ace/theme/monokai";
    }
    if (!config.mode) {
        config.mode = "ace/mode/javascript";
    }
    
    // initialize the script editor
    var scriptEditor = ace.edit(config.editorEl);
    scriptEditor.setTheme(config.theme);
    scriptEditor.getSession().setMode(config.mode);
    
    scriptEditor.gameUI = gameUI;
    
    return scriptEditor;
};