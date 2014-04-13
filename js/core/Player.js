"use strict";

define(["./WumpusGame.Def"], function(wumpusGame) {
     /**
      * Constructs a new Player.
      * 
	  * @constructor
	  * @param game
      */
    wumpusGame.Player = function(game) {
        this.game = game;
    };


    /**
	 * Moves the player to the initial position.
	 *
	 * @param {Object} state The initial Player 
	 * @param {Array} [position] A two-dimensional array, containing x and y coordinates in the grid.
	 * @param {Number} [direction] The direction the player is currently facing, according to wumpusGame.Direction.
	 * @param {Number} [ammo] Amount of arrows the player has to shoot the Wumpus.
	 * @param {Number=} [score] Initial score (defaults = 0).
     */
    wumpusGame.Player.prototype.initializePlayer = function(state) {
        // TODO: Sanity checks
		
        // deep-copy state into this object
        squishy.clone(state, true, this);
		
        // reset action queue & timer
        this.actionQueue = [];
        if (this.actionTimer) {
            clearTimeout(this.actionTimer);
            this.actionTimer = null;
        }
        
		// reset action log
        this.actionLog = [];
		
		// move to initial position
        this.movePlayer(this.position);
    };

    
    // ##################################################################################################################################
    // Movement

    /**
     * Returns the tile that this player is currently standing on.
     */
    wumpusGame.Player.prototype.getTile = function() {
        var pos = this.position;
        return this.game.grid.getTile(pos[0], pos[1]);
    };
    
     /**
      * Moves the player to the given tile.
      */
    wumpusGame.Player.prototype.movePlayer = function(newPos) {
        var lastTile = this.getTile();
        var newTile = this.game.grid.getTile(newPos[0], newPos[1]);
        var firstVisit = !newTile.visited;
        
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
        
        // apply game rules
        this.game.onPlayerEvent(this, wumpusGame.PlayerEvent.Move, {pos: squishy.clone(this.position, true), firstVisit: firstVisit});
    };
    
    /**
     * Sets the direction the player is currently facing.
     */
    wumpusGame.Player.prototype.setDirection = function(direction) {
        this.direction = direction;
        this.getTile().notifyTileChanged();
        
        // apply game rules
        this.game.onPlayerEvent(this, wumpusGame.PlayerEvent.Turn, this.direction);
    };

    /**
     * Perform the next action in the queue.
     */
    wumpusGame.Player.prototype.startNextAction = function() {
        if (this.actionQueue.length == 0) {
            this.actionTimer = null;
            return;
        }
        
        // dequeue action
        var nextAction = this.actionQueue[0];
        this.actionQueue.splice(0, 1);
        
        // start timer
        this.actionTimer = setTimeout((function(player, action) { return function() { player.performAction(action, true); }; })(this, nextAction), this.game.playerActionDelay);
    };

     /**
      * Lets the player perform the given wumpusGame.PlayerAction after the default delay.
      */
    wumpusGame.Player.prototype.performActionDelayed = function(action) {
        this.actionQueue.push(action);
        if (!this.actionTimer) {
            this.startNextAction();
        }
    };

     /**
      * Lets the player perform the given wumpusGame.PlayerAction.
      */
    wumpusGame.Player.prototype.performAction = function(action, instant) {
        if (!instant && this.actionTimer) {
            this.actionQueue.push(action);
            return;
        }
        if (this.game.status != wumpusGame.GameStatus.Playing) return;
    
        switch (action) {
            case wumpusGame.PlayerAction.Forward:
                var neighborTile = this.getTile().getNeighborTile(this.direction);
                if (!neighborTile) return;
                // move player to new tile
                this.movePlayer(neighborTile.getTilePosition());
                break;
            case wumpusGame.PlayerAction.Backward:
                var neighborTile = this.getTile().getNeighborTile(wumpusGame.Direction.getOppositeDirection(this.direction));
                if (!neighborTile) return;
                // move player to new tile
                this.movePlayer(neighborTile.getTilePosition());
                break;
            case wumpusGame.PlayerAction.TurnClockwise:
                // update direction
                this.setDirection(wumpusGame.Direction.getTurnedDirection(this.direction, true));
                break;
            case wumpusGame.PlayerAction.TurnCounterClockwise:
                // update direction
                this.setDirection(wumpusGame.Direction.getTurnedDirection(this.direction, false));
                break;
            case wumpusGame.PlayerAction.Exit:
                if (!this.getTile().hasObject(wumpusGame.ObjectTypes.Entrance)) return;   // nothing happened
                this.game.onPlayerEvent(this, wumpusGame.PlayerEvent.Exit);
                break;
            default:
                squishy.assert(false, "Invalid player action");
                break;
        }
        
        // remember action
        this.actionLog.push(action);
        
        // start next action
        this.startNextAction();
    };
    
    
    // ##################################################################################################################################
    // Manage Player state
    
    
     /**
      * Lets the player perform the given wumpusGame.PlayerAction.
      */
    wumpusGame.Player.prototype.setScore = function(score) {
        this.score = score;
        this.game.events.playerStateChanged.notify("score", score);
    };
    
    
     /**
      * Lets the player perform the given wumpusGame.PlayerAction.
      */
    wumpusGame.Player.prototype.setAmmo = function(ammo) {
        this.ammo = ammo;
        this.game.events.playerStateChanged.notify("ammo", ammo);
    };
    
    return wumpusGame.Player;
});
