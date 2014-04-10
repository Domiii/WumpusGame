/**
 * This file defines the WumpusGame class.
 */
"use strict";


define(["Util/squishy"], function() {
    /**
     * Defines the namespace of the Wumpus game.
     */
    squishy.exportGlobal("wumpusGame", {});

    /**
     * In the wumpus game, there are only four directions.
     * @const
     */
    wumpusGame.Direction = {
        Up : 0,
        Right : 1,
        Down : 2,
        Left : 3,
        
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
        Forward : 0,
        Backward : 1,
        TurnClockwise : 2,
        TurnCounterClockwise : 3
    };
     
     return wumpusGame;
});
