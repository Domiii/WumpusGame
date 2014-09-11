// Some help:
//   1. Keyboard shortcuts for ACE editor:
//      https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts
//   2. All built-in functions are defined in 
//      GameScriptContext.js (`Globals`)
//   3. All built-in events ("on" + <event name>) and 
//      other constants are defined in WumpusGame.Def.js
//   4. Arrow shooting and picking up gold has not been added yet
//
// Game world:
//   W = Wumpus
//   G = Gold
//   P = Pit
//   B = Bats
//   E = Entrance/Exit
//   s = stench
//   b = breeze
//   f = flapping noise



// ############################################################################
// Global state & utility functions

/**
 * Entire game state.
 */
var playerX, playerY, playerDirection, score, ammo, visitedTiles;

/**
 * All available directions.
 */
var allDirections = [Direction.Up, Direction.Right, Direction.Down, Direction.Left];


/**
 * The amount of moves we want to take.
 */
var nMoves = 10;

/**
 * The amount of moves we have performed.
 */
var iMove = 0;

/**
 * Stupid AI: Make a random move
 */
var makeNextMove = function() {
    if (iMove < nMoves) {
        ++iMove;

        // face a random direction
        var randDirection = allDirections.randomElement();
        turnToward(randDirection);
        
        // take a leap of faith in that random direction
        moveForward();
    };
};

/**
 * Figure out smallest set of actions to face the new direction.
 */
var turnToward = function(newDirection) {
    // var directionName = Direction.toString(newDirection);
    // console.log("Turning toward: " + directionName);
    
    // compute amount of turns in clockwise direction
    var clockwiseDistance = (newDirection+4 - playerDirection)%4;
    var turns, action;
    if (clockwiseDistance > 2) {
        turns = 4 - clockwiseDistance;
        action = turnCounterClockwise;
    }
    else {
        turns = clockwiseDistance;
        action = turnClockwise;
    }
    
    // turn 0, 1 or 2 times to face the new direction
    for (var i = 0; i < turns; ++i) {
        action();
    }
};


// ############################################################################
// Event handlers

/**
 * This functions is called every time the game resets to the initial state.
 */
self.onGameStart = function(args) {
    // set game state
    playerX = args.playerX;
    playerY = args.playerY;
    playerDirection = args.playerDirection;
    score = args.score;
    ammo = args.ammo;
    visitedTiles = args.visitedTiles;
    visitedTiles.forEach(function(tile) {
        var tileX = tile.tileX;
        var tileY = tile.tileY;
        var tileContent = tile.tileContent;
        
        // place code for each visited tile here
    });

    // start moving
    makeNextMove();
};


/**
 * This functions is called every time our agent has performed a move.
 * Note: The move might have failed because the agent tried to run against a wall.
 */
self.onMove = function(args) {
    // update game state
    playerX = args.playerX;
    playerY = args.playerY;
    score = args.newScore;
    
    var firstVisit = args.firstVisit;   // whether we were here before
    var tileContent = args.tileContent; // what is on this tile
    if (firstVisit) {
        // remember tile
        visitedTiles.push({tileX: playerX, tileY: playerY, tileContent: tileContent});
    }

    // keep moving
    makeNextMove();
};

/**
 * This function is called when our agent failed to perform an action.
 * E.g. when moving against a wall.
 */
self.onNothing = function() {
    // keep moving
    makeNextMove();
};

/**
 * This functions is called every time our agent has successfully changed direction.
 */
self.onTurn = function(args) {
    // update game state
    playerDirection = args.playerDirection;
};

/**
 * This functions is called every time our agent has successfully
 * picked up some gold.
 */
self.onGrabGold = function(args) {
    // update score
    score = args.newScore;

    console.log("We picked up some gold! New score: " + score);
};