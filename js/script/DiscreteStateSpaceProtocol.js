/**
 * This file defines a basic protocol between guest and host.
 * In order to let the guest guide an agent through a simulator (or game), guest and host need to communicate, and this protocol aims at making that simpler.
 *
 * In the use-case of this protocol, the host contains the full simulator (possibly with a UI attached), which consists of two parts:
 *  1. Static (or read-only) state (that is the configuration and the static parts of the environment, i.e. the parts that never change)
 *  2. Dynamic state (anything in the simulator environment that can change)
 * Agents, which run in a guest environment (no shared memory), can usually (but not necessarily) only see parts of that environment (which makes the environment partially observable).
 * Agents might or might not be part of the state space (for example, in strategy games, often the agent making all the decisions does not have a physical representation, however can control multiple "stupid" agents).
 *
 * This protocol works best with a state space description that mostly involves discrete objects.
 * For example, this protocol works well for an RPG game, but probably won't work so well for a non-trivial fluid simulator (i.e. one where fluid <-> agent interactions are complex).
 * 
 *
 * Guest can:
 *  1. Perform actions
 *
 * Host can:
 *  1. Change the state space randomly (which makes the environment non-deterministic)
 *  2. Change the state space to react to player actions
 */

"use strict";

define(["squishy", "./UserScript"], function(squishy) {
    /**
     * Constructs a new DiscreteStateSpaceProtocol instance.
     *
     * @constructor
     */
    var DiscreteStateSpaceProtocol = function() {
        
    };
    
    // define methods
    DiscreteStateSpaceProtocol.prototype = {
         
    };
    
    return;
});