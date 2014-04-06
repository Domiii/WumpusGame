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
wumpusGame.Player = function(game, state) {
    this.game = game;
    
    // shallow copy state into this object
    state.clone(false, this);
    
    this.actionLog = [];
    
    // TODO: Sanity checks
};


/**
 * Moves the player to the initial position.
 */
wumpusGame.Player.prototype.initializePlayer = function() {
    this.movePlayer(this.position);
};


 /**
  * Moves the player to the given tile.
  */
wumpusGame.Player.prototype.movePlayer = function(newPos) {
    var lastTile = this.getTile();
    var newTile = this.game.grid.getTile(newPos[0], newPos[1]);
    
    // update position
    this.position[0] = newPos[0];
    this.position[1] = newPos[1];
    
    // mark as visited
    newTile.markTileVisited();
    
    // update style
    if (lastTile != newTile) {
        lastTile.notifyTileChanged();
    }
    newTile.notifyTileChanged();
};


 /**
  * Lets the player perform the given wumpusGame.PlayerAction.
  */
wumpusGame.Player.prototype.performAction = function(action) {
    switch (action) {
        case wumpusGame.PlayerAction.Forward:
            var neighbor = this.getTile().getNeighborTile(this.direction);
            if (!neighborTile) return;
            // move player to new tile
            this.movePlayer(neighborTile.getTilePosition());
            break;
        case wumpusGame.PlayerAction.Backward:
            var neighbor = this.getTile().getNeighborTile(wumpusGame.Direction.getOppositeDirection(this.direction));
            if (!neighborTile) return;
            // move player to new tile
            this.movePlayer(neighborTile.getTilePosition());
            break;
        case wumpusGame.PlayerAction.TurnClockwise:
            // update direction
            this.direction = wumpusGame.Direction.getTurnedDirection(this.direction, true);
            this.getTile().notifyTileChanged();
            break;
        case wumpusGame.PlayerAction.TurnCounterClockwise:
            // update direction
            this.direction = wumpusGame.Direction.getTurnedDirection(this.direction, false);
            this.getTile().notifyTileChanged();
            break;
        default:
            squishy.assert(false, "Invalid player action");
            break;
    }
    
    // remember action
    this.actionLog.push(action);
};

/**
 * Returns the tile that this player is currently standing on.
 */
wumpusGame.Player.prototype.getTile = function() {
    var pos = this.position;
    return this.game.grid.getTile(pos[0], pos[1]);
};
