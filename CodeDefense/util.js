

// ######################################################################################
// debug utils

function getCallerInfo(){
    try { throw Error('') } catch(err) { 				
		var callerLine = err.stack.split("\n")[4];		// get line of caller
		var index = callerLine.indexOf("at ");
		return callerLine.slice(index+3, callerLine.length); 
	}
}

function assert(stmt, msg)
{
	if (window.disableAssert) return;
	
	if (!stmt) {
		var info = "";
		if (msg) {
			info += msg + " -- ";
		}
		info += "ASSERTION FAILED at " + getCallerInfo();
		throw info;
	}
}

// echo object to console
function logObject(msg, obj)
{
	console.log(msg + ": " + JSON.stringify(obj, null, 4) );
}


// ######################################################################################
// time utils

// Returns the current system time in milliseconds for global synchronization and timing events
function getCurrentTimeMillis()
{
	return new Date().getTime();
}


// ######################################################################################
// object utils

// Copied from: http://stackoverflow.com/questions/4152931/javascript-inheritance-call-super-constructor-or-use-prototype-chain
// Extends the given element with the given class definition and calls setup() on it.
function extendElement(sub, base) {
  // Avoid instantiating the base class just to setup inheritance
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
  // for a polyfill
  sub.prototype = Object.create(base.prototype);
  // Remember the constructor property was set wrong, let's fix it
  sub.prototype.constructor = sub;
  // In ECMAScript5+ (all modern browsers), you can make the constructor property
  // non-enumerable if you define it like this instead
  Object.defineProperty(sub.protoype, 'constructor', { 
    enumerable: false, 
    value: sub 
  });
}

// see: http://stackoverflow.com/questions/5533192/how-to-get-object-length-in-jquery
function getObjectSize(obj)
{
	var size = 0;
	for (var i in obj) {
		++size;
	}
	return size;
}

// Checks whether the given type indicates that the object has been declared and assigned a value.
function isDefinedType(objType)
{
	return objType != "undefined";
}

// Checks whether the given object has been assigned a value and is not null nor false.
function isSet(obj)
{
	return obj != null && obj != false;
}

function hasProperty(obj, key)
{
	return getObjectSize(obj.key) == 0;
}

// Returns the first property of the given object
function getFirstProperty(obj)
{
	for (var prop in obj)
		return obj[prop];
}


// ######################################################################################
// file, path & URL utils

function concatPath2(root, file1) {
	var path = root;
	if (!path.endsWith("/") && !path.endsWith("\\")) {
		path += "/";
	}
	path += file1;
	return path;
}

function concatPath(root, file1, file2, file3, file4) {
	var path = concatPath2(root, file1);
	if (typeof file2 !== "undefined") {
		path = concatPath2(path, file2);
		if (typeof file3 !== "undefined") {
			path = concatPath2(path, file3);	
			if (typeof file4 !== "undefined") {
				path = concatPath2(path, file4);
			}
		}
	}
	return path;
}

// See: http://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript
function retrieveURLArguments()
{
	var prmstr = window.location.search.substr(1);
	var prmarr = prmstr.split ("&");
	var params = {};

	for ( var i = 0; i < prmarr.length; i++) {
		var tmparr = prmarr[i].split("=");
		params[tmparr[0]] = tmparr[1];
	}
	return params;
}


// ######################################################################################
// string utils

// add utilities to string
String.prototype.startsWith = function(prefix) {
    return this.substring(0, prefix.length) === prefix;
};
String.prototype.endsWith = function(suffix) {
    return this.substring(this.length - suffix.length, this.length) === suffix;
};


// ######################################################################################
// GUI utils

// add some utilities to jQuery
if (window.jQuery)
{
	$( document ).ready(function() {
		// add centering functionality to jQuery components
		// see: http://stackoverflow.com/questions/950087/how-to-include-a-javascript-file-in-another-javascript-file
		jQuery.fn.center = function (relativeParent) {
			if (undefined == relativeParent) relativeParent = $(window);
			var elem = $(this);
			
			var parentOffset = relativeParent.offset();
			var leftOffset = Math.max(0, ((relativeParent.outerWidth() - elem.outerWidth()) / 2) + relativeParent.scrollLeft());
			var topOffset = Math.max(0, ((relativeParent.outerHeight() - elem.outerHeight()) / 2) + relativeParent.scrollTop())
			if (undefined != parentOffset)
			{
				leftOffset += parentOffset.left;
				topOffset += parentOffset.top;
			}
			elem.offset({left : leftOffset, top : topOffset});
			return this;
		};
		
		jQuery.fn.centerWidth = function (relativeParent) {
			if (undefined == relativeParent) relativeParent = $(window);
			var elem = $(this);
			
			
			var parentOffset = relativeParent.offset();
			var leftOffset = Math.max(0, ((relativeParent.outerWidth() - elem.outerWidth()) / 2) + relativeParent.scrollLeft());
			if (undefined != parentOffset)
			{
				leftOffset += parentOffset.left;
			}
			elem.offset({left : leftOffset, top : elem.offset().top});
			return this;
		};
		
		// Add text width measurement tool to jQuery components
		// see: http://stackoverflow.com/questions/1582534/calculating-text-width-with-jquery
		$.fn.textWidth = function(){
		  var html_org = $(this).html();
		  var html_calc = '<span>' + html_org + '</span>';
		  $(this).html(html_calc);
		  var width = $(this).find('span:first').width();
		  $(this).html(html_org);
		  return width;
		};
	});
}