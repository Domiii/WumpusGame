"use strict";

 /**
  * Constructs a new Player.
  * 
  * @param {Object} state The initial Player state.
  * @param {Array} [state.position] A two-dimensional array, containing x and y coordinates in the grid.
  * @param {Number} [state.direction] The direction the player is currently facing, according to wumpusGame.Direction.
  * @param {Number} [state.ammo] Amount of arrows the player has to shoot the Wumpus.
  * @param {Number=} [state.score] Initial score (defaults = 0).
  */
wumpusGame.Player = function(state) {
    // shallow copy state into this object
    state.clone(false, this);
    
    // TODO: Sanity checks
};