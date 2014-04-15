/**
 * This file defines some basic cryptographic tools. It depends on the Clipperz cryptography library.
 */
/*jslint node: true */
"use strict";
 
var cryptoRoot = "lib/js_crypto/";
var cryptoPath = cryptoRoot + "js/Clipperz/";
var cryptoFiles = [
    "Base.js",
    "Logging.js",
    "ByteArray.js",
    "Crypto/BigInt.js",
    "Crypto/Base.js",
    "Crypto/AES.js",
    "Crypto/SHA.js",
    "Crypto/PRNG.js"        // pseudo random number generator
];

for (var i = 0; i < cryptoFiles.length; ++i) { cryptoFiles[i] = cryptoPath + cryptoFiles[i]; }
 
define(["squishy", cryptoRoot + "other_libraries/MochiKit/MochiKit.js"].concat(cryptoFiles), function() {
    /**
     * Generates a strong random uint32.
     */
    squishy.strongRandomUInt32 = function() {
        // generate 4 random bytes
        var arr = Clipperz.Crypto.PRNG.defaultRandomGenerator().getRandomBytes(4);
        
        // convert 4 bytes to uint
        var uint8s = new Uint8Array(arr).buffer;
        return new Uint32Array(uint8s)[0];
    };
    
    // /**
     // * Generates a strong random float between 0 and 1.
     // */
    // squishy.strongRandomFloat32 = function() {
        // return squishy.strongRandomUInt32() / ;
    // };

    /**
     * Generates a cryptographically strong random integral value between from and to (inclusively).
     */ 
	squishy.strongRandomInRange = function(from, to) {
        var rand = squishy.strongRandomUInt32();
        return (rand / 4294967295) * ((to-from)) + from;
    }
});