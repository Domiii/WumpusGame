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
        this.stopPlayer();
        
        this.lastActionTime = squishy.getCurrentTimeMillis();
        
        // reset action log
        this.actionLog = [];
        
        // move to initial position
        this.movePlayer(this.position);
    };

    
    // ##################################################################################################################################
    // Movement, events & actions

    /**
     * Returns the tile that this player is currently standing on.
     */
    wumpusGame.Player.prototype.getTile = function() {
        var pos = this.position;
        return this.game.grid.getTile(pos[0], pos[1]);
    };

    /**
     * Returns the tile that this player is currently standing on.
     */
    wumpusGame.Player.prototype.isMoving = function() {
        return this.eventQueue.length > 0;
    };
    
     /**
      * Moves the player to the given tile.
      */
    wumpusGame.Player.prototype.movePlayer = function(newPos, dontNotify) {
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
        this.game.triggerPlayerEvent(this, wumpusGame.PlayerEvent.Move, {firstVisit: firstVisit});
    };
    

     /**
      * Moves the player, after the default delay.
      */
    wumpusGame.Player.prototype.movePlayerDelayed = function(newPos) {
        (function(player) {
            // queue move
            player.addDelayedEvent(function() { player.movePlayer(newPos); }, 0);
        })(this);
    };
    
    /**
     * Sets the direction the player is currently facing.
     */
    wumpusGame.Player.prototype.setDirection = function(direction) {
        this.direction = direction;
        this.getTile().notifyTileChanged();
        
        // apply game rules
        this.game.triggerPlayerEvent(this, wumpusGame.PlayerEvent.Turn);
    };

    /**
     * Perform the next event in the queue.
     */
    wumpusGame.Player.prototype.startNextEvent = function() {
        if (this.eventQueue.length == 0) {
            // nothing left in queue: Stop running
            this.eventTimer = null;
            return;
        }
        
        // dequeue action
        var nextAction = this.eventQueue[0];    // get action
        this.eventQueue.splice(0, 1);           // remove from queue
        
        // start timer
        this.eventTimer = setTimeout(nextAction, this.game.playerActionDelay);
    };

    /**
     * Add callback to event queue and keep running.
     */
    wumpusGame.Player.prototype.addDelayedEvent = function(callback, index) {
        (function(player) {
            if (squishy.isDefined(index)) {
                // insert at index
                player.eventQueue.splice(index, 0, function() { callback(); player.startNextEvent(); });
            }
            else {
                // add to end of queue
                player.eventQueue.push(function() { callback(); player.startNextEvent(); });
            }
            if (!player.eventTimer) {
                // if timer currently not running, continue processing the queue now
                player.startNextEvent();
            }
        })(this);
        
    };

     /**
      * Lets the player perform the given wumpusGame.PlayerAction after the default delay.
      */
    wumpusGame.Player.prototype.performActionDelayed = function(action) {
        (function(player) {
            var now = squishy.getCurrentTimeMillis();
            var timeSinceLastAction = now - player.lastActionTime;
            var remainingDelay = player.game.playerActionDelay - timeSinceLastAction;
            
            if (player.eventTimer || remainingDelay > 0) {
                // queue action
                player.addDelayedEvent(function() { player.performActionNow(action); });
            }
            else {
                // first move is done instantly
                player.performActionNow(action);
            }
        })(this);
    };
    
    /**
     * Stops the player dead in her tracks.
     */
    wumpusGame.Player.prototype.stopPlayer = function() {
        this.eventQueue = [];
        if (this.eventTimer) {
            clearTimeout(this.eventTimer);
            this.eventTimer = null;
        }
    };

     /**
      * Lets the player perform the given wumpusGame.PlayerAction.
      */
    wumpusGame.Player.prototype.performActionNow = function(action) {
        if (this.game.status != wumpusGame.GameStatus.Playing) return;
        
        this.lastActionTime = squishy.getCurrentTimeMillis();
        
        var actionHappened = true;
    
        switch (action) {
            case wumpusGame.PlayerAction.Forward:
                var neighborTile = this.getTile().getNeighborTile(this.direction);
                if (neighborTile) {
                    // move player to new tile
                    this.movePlayer(neighborTile.getTilePosition());
                }
                else {
                    actionHappened = false;
                }
                break;
            case wumpusGame.PlayerAction.Backward:
                var neighborTile = this.getTile().getNeighborTile(wumpusGame.Direction.getOppositeDirection(this.direction));
                if (neighborTile) {
                    // move player to new tile
                    this.movePlayer(neighborTile.getTilePosition());
                }
                else {
                    actionHappened = false;
                }
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
                if (this.getTile().hasObject(wumpusGame.ObjectTypes.Entrance)) {
                    this.game.triggerPlayerEvent(this, wumpusGame.PlayerEvent.Exit);
                }
                else {
                    actionHappened = false;
                }
                break;
            default:
                squishy.assert(false, "Invalid player action");
                break;
        }
        
        // remember action
        this.actionLog.push(action);
    };
    
    
    // ##################################################################################################################################
    // Manage Player state
    
    
     /**
      * Lets the player perform the given wumpusGame.PlayerAction.
      */
    wumpusGame.Player.prototype.setScore = function(score) {
        this.score = score;
        this.game.events.playerStateChanged.fire("score", score);
    };
    
    
     /**
      * Lets the player perform the given wumpusGame.PlayerAction.
      */
    wumpusGame.Player.prototype.setAmmo = function(ammo) {
        this.ammo = ammo;
        this.game.events.playerStateChanged.fire("ammo", ammo);
    };
    
    return wumpusGame.Player;
});
