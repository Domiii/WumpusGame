"use strict";

 /**
  * Constructs a new WorldGenerator base class.
  * 
  * @interface
  * @param {Object} state Generator configuration.
  */
wumpusGame.WorldGenerator = function(config) {
    // shallow copy config into this object
    config.clone(false, this);
    
    // TODO: Sanity checks
	
	
};