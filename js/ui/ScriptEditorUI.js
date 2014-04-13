/**
 * This file provides the UI for an instance of ACE script editor.
 * The API can be found here: http://ace.c9.io/#nav=api&api=editor
 */
"use strict";
 
 define(["ace/ace"], function (ace) {
    /**
     * Makes the given DOM element a script editor, according to the given options.
     *
     * @constructor
     * @param {Object} config The ScriptEditor configuration.
     * @param {Element} [config.editorEl] The underlying DOM element of the editor.
     * @param {String=} [config.theme] The theme (Default = "ace/theme/monokai").
     * @param {String=} [config.mode] The mode (Default = "ace/mode/javascript").
     */
    wumpusGame.makeScriptEditorUI = function(gameUI, config) {
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
        // see: http://ace.c9.io/#nav=embedding
        var scriptEditor = ace.edit(config.editorEl);
        scriptEditor.setTheme(config.theme);
        scriptEditor.getSession().setMode(config.mode);
        
        scriptEditor.gameUI = gameUI;
        scriptEditor.editorEl = $(config.editorEl);                            // this is the actual editor
        scriptEditor.editorContainerEl = $(config.editorEl.parentNode);        // this is the top-level node of the editor
        
        scriptEditor.setShowPrintMargin(true);
        scriptEditor.setHighlightActiveLine(true);
        
        
        // ################################################################################################################
        // Script Editor UI functions
        
        // TODO: Notifications
        // scriptEditor.
        
        /**
         * Update script editor layout
         */
        scriptEditor.updateScriptEditorLayout = function() {
            this.resize(true);
        };
        
        return scriptEditor;
    };
    return wumpusGame.makeScriptEditorUI;
});