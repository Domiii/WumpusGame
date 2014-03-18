 var   b2Vec2 = Box2D.Common.Math.b2Vec2
	,	b2BodyDef = Box2D.Dynamics.b2BodyDef
	,	b2Body = Box2D.Dynamics.b2Body
	,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
	,	b2Fixture = Box2D.Dynamics.b2Fixture
	,	b2World = Box2D.Dynamics.b2World
	,	b2MassData = Box2D.Collision.Shapes.b2MassData
	,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
	,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
	,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw
	;
			
function checkCompatability()
{
	// TODO: Make sure, that the game can run
}

// loads the game
function loadCodeDefense(elem)
{
	return window.codeDefense = extendElement(elem, new CodeDefenseDef());
}

// "JS-style OOP"
// see: http://stackoverflow.com/questions/1114024/constructors-in-javascript-objects
var CodeDefenseDef = (function () {
	var ctor = function()
	{
		this.playTimer = null;
		this.frameRate = 1/60.;
		
		// NOTE: Don't call any methods on viewer here, since it is not fully constructed yet!
		// Instead, we call setup() after the extend() function has returned.
	};
	
	ctor.prototype = {
		
		// ############################################################################################################
		// getters & setters
		
		isReady : function() { return true },
		
		isPlaying : function()
		{
			return this.playTimer != null;
		},
		
		// ############################################################################################################
		// setup
		
		// attach viewer functionality to viewer buttons
		setup : function()
		{
			this.elem = $(this);
			
			game = this;
			
			// create world
			 world = new b2World(
				   new b2Vec2(0, 10)    //gravity
				,  true                 //allow sleep
			 );
			 
			 var fixDef = new b2FixtureDef;
			 fixDef.density = 1.0;
			 fixDef.friction = 0.5;
			 fixDef.restitution = 0.2;
			 
			 var bodyDef = new b2BodyDef;
			 
			 //create ground
			 bodyDef.type = b2Body.b2_staticBody;
			 bodyDef.position.x = 9;
			 bodyDef.position.y = 13;
			 fixDef.shape = new b2PolygonShape;
			 fixDef.shape.SetAsBox(10, 0.5);
			 world.CreateBody(bodyDef).CreateFixture(fixDef);
			 
			 //create some objects
			 bodyDef.type = b2Body.b2_dynamicBody;
			 bodyDef.bullet = true;
			 for(var i = 0; i < 10; ++i) {
				if(Math.random() > 0.5) {
				   fixDef.shape = new b2PolygonShape;
				   fixDef.shape.SetAsBox(
						 Math.random() + 0.1 //half width
					  ,  Math.random() + 0.1 //half height
				   );
				} else {
				   fixDef.shape = new b2CircleShape(
					  Math.random() + 0.1 //radius
				   );
				}
				bodyDef.position.x = Math.random() * 10;
				bodyDef.position.y = Math.random() * 10;
				world.CreateBody(bodyDef).CreateFixture(fixDef);
			 }
			 
			 //setup debug draw
			 var debugDraw = new b2DebugDraw();
				debugDraw.SetSprite(this.getContext("2d"));
				debugDraw.SetDrawScale(30.0);
				debugDraw.SetFillAlpha(0.3);
				debugDraw.SetLineThickness(.3);
				debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
				world.SetDebugDraw(debugDraw);
			 
			 (function(game) {
				game.playTimer = setInterval(function() { 
					game.update.call(game);
				}, 1000 * this.frameRate);
			 })(this);
		  },
		  
		  update : function() {
			 world.Step(
				   this.frameRate
				,  10       //velocity iterations
				,  10       //position iterations
			 );
			 world.DrawDebugData();
			 world.ClearForces();
		  },
		
		
		toString : function()
		{
			return "CodeDefense";
		},
		
		onFail : function(message)
		{
			this.statusLabel.text(message);
			this.statusLabel.css('background-color', 'red');
		}
	}
	
	return ctor;
})();