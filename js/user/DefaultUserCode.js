// Keyboard shortcuts in this editor:
// https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts


// ############################################################################
// Global state & utility functions

var playerX, playerY, playerDirection, score, ammo, visitedTiles;

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
    
    var directions = [Direction.Up, Direction.Right, Direction.Down, Direction.Left];
    var randDirection = directions.randomElement();
    turnToward(randDirection);
    
    // TODO: Build kb
    
    // take a leap of faith
    //moveForward();
};

self.onMove = function(args) {
    // update game state
    playerX = args.playerX;
    playerY = args.playerY;
    score = args.newScore;
    
    var firstVisit = args.firstVisit;
    var tileContent = args.tileContent;
    if (firstVisit) {
        // remember tile
        visitedTiles.push({tileX: playerX, tileY: playerY, tileContent: tileContent});
    }
};

self.onTurn = function(args) {
    // update game state
    playerDirection = args.playerDirection;
};

self.onGrabGold = function(args) {
    // update score
    score = args.newScore;
}