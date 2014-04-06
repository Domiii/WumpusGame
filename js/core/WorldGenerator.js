"use strict";

 /**
  * Constructs a new WorldGenerator base class.
  * 
  * @param {Object} config Generator configuration.
  */
wumpusGame.WorldGenerator = function(config) {
    // shallow copy config into this object
    config.clone(false, this);
};