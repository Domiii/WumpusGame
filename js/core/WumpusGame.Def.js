/**
 * This file defines the WumpusGame class.
 */
"use strict";


define(["squishy"], function() {
    /**
     * Defines the namespace of the Wumpus game.
     */
    squishy.exportGlobal("wumpusGame", {});
    
    /**
     * The status of the game (or rather the player in the game).
     * @const
     */
    wumpusGame.GameStatus = {
        Playing: 0,
        Failed: 1,
        Win: 2
    };

    /**
     * In the wumpus game, there are only four directions.
     * @const
     */
    wumpusGame.Direction = {
        Up: 0,
        Right: 1,
        Down: 2,
        Left: 3,
        
        /**
         * Returns the angle of the given direction in radians, assuming that Up is 0 degrees, and we are rotating clockwise (that is also the frame of reference in CSS3).
         */
        computeAngle : function(direction) {
            return direction * Math.PI / 2;
        },
        
        /**
         * Returns the opposite direction of the given direction.
         */
        getOppositeDirection : function(direction) {
            return (direction + 2) % 4;
        },
        
        /**
         * Returns the given direction turned by one unit in the clockwise or counter-clockwise direction.
         */
        getTurnedDirection : function(direction, turnClockwise) {
            if (turnClockwise) {
                return (direction + 1) % 4;
            }
            else {
                // ccw
                return (direction + 3) % 4;
            }
        }
    };

    /**
     * All possible player actions.
     * @const
     */
    wumpusGame.PlayerAction = {
        // Moves
        Forward: 0,
        Backward: 1,
        TurnClockwise: 2,
        TurnCounterClockwise: 3,
        
        // Other
        /**
         * The player can leave if standing on an entrance tile.
         */
        Exit: 4,
        
        isMove : function(action) {
            return action == wumpusGame.PlayerAction.Forward || action == wumpusGame.PlayerAction.Backward;
        },
    };
    
    
     /**
      * The state of each tile is comprised of a set of objects and a set of indicators.
      * These are all object types.
      * Note that objects are not mutually exclusive.
      * (E.g. there can be a Wumpus hanging on the side of the walls of a pit which contains gold, with bats hovering above.)
      */
    wumpusGame.ObjectTypes = {
        None: 0x00,
        Wumpus: 0x01,
        Pit: 0x02,
        Gold: 0x04,
        Bats: 0x08,
        Entrance : 0x10
    };
    wumpusGame.ObjectTypes.AllNames = Object.keys(wumpusGame.ObjectTypes);
        
     /**
      * The state of each tile is comprised of an object and a set of indicator flags.
      * These are all indicator flags.
      * Note that flags are not mutually exclusive.
      */
    wumpusGame.TileFlags = {
        None: 0x00,
        Stench: 0x01,
        Breeze: 0x02,
        FlappingNoise: 0x04
    };
    wumpusGame.TileFlags.AllNames = Object.keys(wumpusGame.TileFlags);
        
     /**
      * All possible events that can happen to a player.
      * TODO: Properly implement these in the UI (and reconsider all other events)
      * TODO: Properly implement these in UserScripts
      */
    wumpusGame.PlayerEvent = {
        Nothing: 0,
        Move: 1,            // player moved to new tile (args: tile)
        Turn: 2,            // player changed direction (args: direction)
        GrabGold: 3,        // player grabbed gold (args: )
        Teleport: 4,        // bats dropped player off somewhere (args: )
        ShootArrow: 5,      // Player shoots arrow (args: )
        ArrowHitWumpus: 6,  // Player killed Wumpus (args: )
        ArrowMissed: 7,     // Arrow missed (args: )
        DeadPit: 8,         // dead in pit (args: )
        DeadWumpus: 9,      // dead through Wumpus (args: )
        Exit: 10            // Player exited (args: )
    };
    wumpusGame.PlayerEvent.AllNames = Object.getOwnPropertyNames(wumpusGame.PlayerEvent);

     
     return wumpusGame;
});
