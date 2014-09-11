"use strict";

 /**
  * Constructs a new WorldGenerator base class.
  * 
  * @interface
  * @param {Object} config Generator configuration.
  * @param {Object} state Generator configuration.
  */
wumpusGame.WorldGenerator = function(config) {
    // shallow copy config into this object
    squishy.clone(config, false, this);
};