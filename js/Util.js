/*jslint node: true */
"use strict";

// ##############################################################################################################
// Debug stuff


/**
 * Returns a string identifying the caller of the caller of this function.
 * Only works on English locale.
 */
squishy.getCallerInfo = function() {
    try { throw new Error(''); } catch (err) {
        var callerLine = err.stack.split("\n")[3];        // get line of caller
        var index = callerLine.indexOf("at ");
        return callerLine.slice(index + 3, callerLine.length);
    }
};

/**
 * Standard assert statement.
 * Throws a string identifying caller, if assertion does not hold.
 */
squishy.assert = function(stmt, msg) {
    if (!stmt) {
        var info = "";
        if (msg) {
            info += msg + " -- ";
        }
        info += "ASSERTION FAILED at " + squishy.getCallerInfo();
        throw info;
    }
};

// ##############################################################################################################
// File path stuff

/**
 * Concats two partial paths with a "/".
 */
squishy.concatPath2 = function(file1, file2) {
    var path = file1;
    if (!path.endsWith("/") && !path.endsWith("\\")) {
        path += "/";
    }
    path += file2;
    return path;
};

/**
 * Concats multiple partial paths by "/".
 * 
 * @param root
 * @param file1
 */
squishy.concatPath = function(file1, file2/*, fileN */) {
    var path = "";
    for (var argLen = arguments.length, i = 1; i < argLen; ++i) {
        path = squishy.concatPath2(path, arguments[i]);
    }
    return path;
};


// ##############################################################################################################
// Arrays

/**
 * Creates an array of given size.
 * If the optional defaultVal parameter is supplied,
 * initializes every element with it.
 * NOTE: There is a design bug in Google's V8 JS engine that sets an arbitrary threshold of 99999 to be the max size for array pre-allocation.
 * @param {number} size Number of elements to be allocated.
 * @param {Object=} defaultVal Optional value to be used to set all array elements.
 */
squishy.createArray = function(size, defaultVal) {
	try {
		var arr = new Array(size);
		if (arguments.length == 2) {
			// optional default value
			for (var i = 0; i < size; ++i) {
				if (typeof defaultVal == "object")
					arr[i] = defaultVal.clone(false);     // shallow-copy default value
				else
					arr[i] = defaultVal;                        // simply copy it
			}
		}
	}
	catch (excep) {
		console.log("Could not create array of size: " + size);
		throw excep;
	}
    return arr;
};

/**
 * @see http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
 */
Array.prototype.shuffle = function() {
    for(var j, x, i = this.length; i; j = Math.floor(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
};


// ##############################################################################################################
// Object

/**
 * Adds a copy method to every object.
 * @param newObj The object to clone all properties to.
 * @param {bool} deepCopy Whether to deep-copy elements (true by default).
 */
Object.prototype.clone = function(deepCopy, newObj) {
  if (arguments.length === 0) {
    deepCopy = true;
  }
  
  newObj = newObj || ((this instanceof Array) ? [] : {});
  
  for (var i in this) {
    if (deepCopy && typeof this[i] == "object") {
        newObj[i] = this[i].clone();
    }
    else {
        newObj[i] = this[i];
    }
  }
  return newObj;
};


/**
 * Determines how many properties the given object has.
 *
 * @see http://stackoverflow.com/questions/5533192/how-to-get-object-length-in-jquery
 */
Object.prototype.getObjectPropertyCount = function() {
    var size = 0;
    for (var i in this) {
        ++size;
    }
    return size;
};

/**
 * Checks whether the given object has the given property
 *
 * @param obj
 * @param key
 */
Object.prototype.hasProperty = function(key) {
    return this.getObjectPropertyCount(this.key) === 0;
};

/**
 * Returns the first property of the given object.
 */
Object.prototype.getFirstProperty = function() {
    for (var prop in this)
        return this[prop];
};

/** 
 * Render object to string, using JSon.
 */
Object.prototype.stringify = function(obj) {
    return JSON.stringify(obj, null, 4);
};


/**
 * Checks whether the given type indicates that the object has been declared and assigned a value.
 *
 * @param objType
 */
squishy.isDefinedType = function(objType) {
    return objType != "undefined";
};

/**
 * Checks whether the given object has been assigned a value and is not null nor false.
 *
 * @param obj
 */
squishy.isSet = function(obj) {
    return obj !== null && obj !== false;
};



// ##############################################################################################################
// String

// add utilities to string
String.prototype.startsWith = function(prefix) {
    return this.substring(0, prefix.length) === prefix;
};

String.prototype.endsWith = function(suffix) {
    return this.substring(this.length - suffix.length, this.length) === suffix;
};


// ##############################################################################################################
// URL

/**
 * Returns a hashmap of all GET arguments of the current URL.
 *
 * @see http://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript
 */
squishy.retrieveURLArguments = function()
{
    var prmstr = window.location.search.substr(1);
    var prmarr = prmstr.split ("&");
    var params = {};

    for ( var i = 0; i < prmarr.length; i++) {
        var tmparr = prmarr[i].split("=");
        params[tmparr[0]] = tmparr[1];
    }
    return params;
};

/**
 * Extracts the folder from a complete path.
 * 
 * @param path A nix-style path (using '/' as separator).
 */
squishy.extractFolder = function(path) {
    var folder = path.substring(0, path.lastIndexOf('/'));
    return folder;
};



// ##############################################################################################################
// Stable merge sort

// Add stable merge sort to Array prototypes.
// Note: We wrap it in a closure so it doesn't pollute the global
//       namespace, but we don't put it in $(document).ready, since it's
//       not dependent on the DOM.
(function() {
  /**
   * Performs a stable merge sort on this array.
   * Note that it does not change the array, but returns a fresh copy.
   * 
   * @param compare The compare function to be used.
   * @see http://stackoverflow.com/questions/1427608/fast-stable-sorting-algorithm-implementation-in-javascript
   */
  Array.prototype.stableSort = function(compare) {
    var length = this.length,
        middle = Math.floor(length / 2);

    if (!compare) {
      compare = function(left, right) {
        if (left < right) 
          return -1;
        if (left == right)
          return 0;
        else
          return 1;
      };
    }

    if (length < 2)
      return this.slice();

    return merge(
      this.slice(0, middle).stableSort(compare),
      this.slice(middle, length).stableSort(compare),
      compare
    );
    
    function merge(left, right, compare) {
        var result = [];
        
        while (left.length > 0 || right.length > 0) {
          if (left.length > 0 && right.length > 0) {
            if (compare(left[0], right[0]) <= 0) {
              result.push(left[0]);
              left = left.slice(1);
            }
            else {
              result.push(right[0]);
              right = right.slice(1);
            }
          }
          else if (left.length > 0) {
            result.push(left[0]);
            left = left.slice(1);
          }
          else if (right.length > 0) {
            result.push(right[0]);
            right = right.slice(1);
          }
        }
        return result;
    }
  };
  
  /**
   * Select a random element from this array. 
   */
  Array.prototype.randomElement = function() {
  	var idx = squishy.randomInt(0, this.length-1);
  	return this[idx];
  };
})();




// ##############################################################################################################
// Time-related utilities

/**
 * Returns the current system time in milliseconds for global synchronization and timing events.
 */
squishy.getCurrentTimeMillis = function()
{
    return new Date().getTime();
};


// ##############################################################################################################
// Number/math utilities

/**
 * Generates a random integer between min and max, inclusive.
 */
squishy.randomInt = function(min, max) {
    return Math.ceil((Math.random() * (max-min+1))+min-1);
};


