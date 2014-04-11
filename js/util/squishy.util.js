/*jslint node: true */
"use strict";


define([], function() {
    // ##############################################################################################################
    // Debugging

    /**
     * Returns a string identifying the caller of the caller of this function.
     * TODO: Only works in English locale. Make it work with all locales.
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
    // File paths

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
    // Object

    /**
     * Clones the given object.
     * @param newObj The object to clone all properties to.
     * @param {bool} deepCopy Whether to deep-copy elements (true by default).
     */
    squishy.clone = function(obj, deepCopy, newObj) {
        if (arguments.length === 1) {
            deepCopy = true;
        }

        newObj = newObj || ((obj instanceof Array) ? [] : {});

        for (var i in obj) {
			var prop = obj[i];
            if (deepCopy && (typeof(prop) === "object" || typeof(prop) === "array")) {
                // deep-copy if the property is an object or an array
                newObj[i] = squishy.clone(obj[i], true);
            }
            else {
				// shallow-copy the property
                newObj[i] = prop;
            }
        }
        return newObj;
    };

    /**
     * Clones the given object. Ignores all properties (also of children) that do not pass the filter.
     * @param newObj The object to clone all properties to.
     * @param {bool} deepCopy Whether to deep-copy elements (true by default).
     */
    squishy.cloneFiltered = function(obj, filter, deepCopy, newObj) {
        if (arguments.length === 2) {
            deepCopy = true;
        }

        newObj = newObj || ((obj instanceof Array) ? [] : {});

        for (var i in obj) {
            var prop = obj[i];
            if (!filter(prop)) continue;
            
            if (deepCopy && prop.getFirstProperty()) {
                // obj[i] is an object
                newObj[i] = squishy.clone(obj[i], true);
            }
            else {
                newObj[i] = prop;
            }
        }
        return newObj;
    };

    Object.defineProperty(Object.prototype, "getObjectPropertyCount", {
        enumerable: false,
        configurable: false,
        writable: false,
        value:
            /**
             * Determines how many properties the given object has.
             *
             * @see http://stackoverflow.com/questions/5533192/how-to-get-object-length-in-jquery
             */
            function() {
                var size = 0;
                for (var i in this) {
                    ++size;
                }
                return size;
            }
    });


    Object.defineProperty(Object.prototype, "hasProperty", {
        enumerable: false,
        configurable: false,
        writable: false,
        value:
            /**
             * Checks whether the given object has the given property
             *
             * @param key
             */
            function(key) {
                return this.getObjectPropertyCount(key) === 0;
            }
    });


    Object.defineProperty(Object.prototype, "getFirstProperty", {
        enumerable: false,
        configurable: false,
        writable: false,
        value:
            /**
             * Returns the first property of the given object, or null if it has none.
             */
            function() {
                for (var prop in this)
                    return this[prop];
                return null;
            }
    });


    Object.defineProperty(Object.prototype, "hasAnyProperty", {
        enumerable: false,
        configurable: false,
        writable: false,
        value:
            /**
             * Returns the first property of the given object, or null if it has none.
             */
            function() {
                for (var prop in this)
                    return true;
                return false;
            }
    });


    Object.defineProperty(Object.prototype, "stringify", {
        enumerable: false,
        configurable: false,
        writable: false,
        value:
            /** 
             * Render object to string, using JSon.
             */
            function() {
                return JSON.stringify(this, null, 4);
            }
    });


    /**
     * Checks whether the given type indicates that the object has been declared and assigned a value.
     *
     * @param objType
     */
    squishy.isDefinedType = function(objType) {
        return objType !== "undefined";
    };


    /**
     * Checks whether the given object is undefined.
     *
     * @param obj
     */
    squishy.isDefined = function(obj) {
        return squishy.isDefinedType(typeof(obj));
    };


    /**
     * Sets obj[propName] = value, if the object does not yet have the property.
     *
     * @param obj
     */
    squishy.setIfUndefined = function(obj, propName, value) {
        if (!squishy.isDefined(obj[propName])) {
            obj[propName] = value;
        }
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
    // Flags & Enums

    /**
     * Adds the given flag to the current set of flags and returns the result.
     * This is the equivalent of setting a bit in a number to 1.
     */
    squishy.setFlag = function(flags, newFlag) {
        return flags | newFlag;
    };

    /**
     * Removes the given flag from the current set of flags and returns the result.
     * This is the equivalent of setting a bit in a number to 0.
     */
    squishy.removeFlag = function(flags, oldFlag) {
        return flags & ~oldFlag;
    };



    // ##############################################################################################################
    // URL

    /**
     * Returns a hashmap of all GET arguments of the current URL.
     *
     * @see http://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript
     */
    squishy.retrieveURLArguments = function() {
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
                        arr[i] = squishy.clone(defaultVal, false);     // shallow-copy default value
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
     * Removes the given item from the given array, if it exists.
     */
    squishy.removeItem = function(arr, item) {
        var idx = arr.indexOf(item);
        if (idx >=0) {
            array.splice(idx, 1);
        }
    };

    /**
     * @see http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
     */
    Array.prototype.shuffle = function() {
        for(var j, x, i = this.length; i; j = Math.floor(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
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
    squishy.getCurrentTimeMillis = function() {
        return new Date().getTime();
    };


    // ##############################################################################################################
    // Events

    /**
     * Creates a new event, representing a list of event handler callbacks.
     */
    squishy.Event = function() {
        var Event = function(self) {
            this.self = self;
            this.listeners = [];
        };
        
        Event.prototype = {
            /**
             * Adds the given callback function to this event.
             */
            addListener : function(listener) {
                this.listeners.push(listener);
            },
            
            /**
             * Removes the given callback function from this event.
             */
            removeListener : function(listener) {
                squishy.removeItem(this.listeners, listener);
            },
            
            /**
             * Calls all event handlers of this event with all given arguments, and this = the object given in the event constructor.
             */
            notify : function() {
                for (var i = 0; i < this.listeners.length; ++i) {
                    var listener = this.listeners[i];
                    listener.apply(this.self, arguments);
                }
            }
        };
        
        return Event;
    }();


    // ##############################################################################################################
    // Number/math utilities

    /**
     * Generates a random integer between min and max, inclusive.
     */
    squishy.randomInt = function(min, max) {
        return Math.ceil((Math.random() * (max-min+1))+min-1);
    };
});