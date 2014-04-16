/**
 * This file defines the UserCommand class, used for proper guest <-> host protocol handling.
 */
 "use strict";

define(["squishy", "squishy/../squishy.crypto"], function() {
    /**
     * We use UserCommand objects to run and keep track of potentially non-privileged code in the guest context.
     * Every command has a public id (senderId) and a private security token (securityToken).
     *
     * @param {HostScriptContext} context The context to which this command belongs.
     * @param {String} commandName The name of the command.
     * @param {Object} commandArgs Command arguments.
     */
    squishy.UserCommand = function(context, commandName, commandArgs) {
        this.context = context;
        this.contextId = context.contextId;         // this id changes on restart
        this.message = {
            command: commandName,
            args: commandArgs,
            
            // Generate an id that is known by user code, to send non-privileged messages to the host.
            senderId: squishy.randomInt(),
            
            // Generate a private key, not to be exposed to user code.
            // It can be used by non-user code of the guest context to send privileged messages (such as start and stop).
            securityToken: squishy.randomInt()
        };
        
        this.active = true;
    };
    
    squishy.UserCommand.prototype = {
        /**
         * Returns the public senderId of this command.
         */
        getId: function() {
            return this.message.senderId;
        },
        
        /**
         * Returns the private securityKey of this command.
         */
        getSecurityToken: function() {
            return this.message.securityToken;
        },
        
        /**
         * Whether this script instance is still active. Meaning that the guest can still perform actions caused by this command.
         */
        isActive: function() {
            return this.active;
        },
        
        /**
         * Whether the context is still the same as when the command was sent.
         * If it is not, any reaction to this command should be ignored.
         */
        isContextActive: function() {
            return this.contextId == this.context.contextId && this.context.running;
        },
        
        /**
         * Stop this command from having any further effects.
         * Once stopped, any command sent by the guest that is a reaction of this command will be ignored.
         * The timeout timer will not be stopped, and can only be stopped by restarting the script context.
         */
        stopCommand: function(dontNotify) {
            this.context.stopCommand(this, dontNotify);
        },
        
        toString: function() {
            return squishy.objToString(this.message);
        },
    };
    
    return squishy.UserCommand;
});