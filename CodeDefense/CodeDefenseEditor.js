function loadCodeDefenseEditor(game, elem) {
	return extendElement(elem, new CodeDefenseEditorDef(game));
}

// Defines the visual code editor for the code defense game.
var CodeDefenseEditorDef = (function() {
	var ctor = function(game)
	{
		this.elem = $(this);
		this.game = game;
		game.editor = this;
		
		// NOTE: Don't call any methods on viewer here, since it is not fully constructed yet!
		// Instead, we call setup() after the extend() function has returned.
	};
	
	ctor.prototype = {
		setup : function() {
			this.varList = ;
		}
	}
	
	return ctor;
})();


var CodeElementTemplate = (function() {
	var ctor = function() {
	};
	
	ctor.prototype = {
		toString : function() {
			return this.getName();
		}
	}
	
	return ctor;
})();

var CodeVarTemplate = (function() {
	var ctor = function() {
		
	};
	
	extend(CodeElementTemplate, ctor);
	
	ctor.prototype = {
		getName : function() {
			return "var";
		}
	}
	return ctor;
})();