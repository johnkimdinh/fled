// this module is responsible for:
//	loading animations from the database / filesystem
//  executing animation timelines
//  populating the Buffer we're passed with color values
//  transitioning between animations

var Display = require('./display'),
	vm = require('vm'),
	fs = require('fs'),
	TWEEN = require('./tween'),
	$ = require('jquery'),
	events = require('events'),
	util = require('util'),
	extend = require('extend'),
	THREE = require('three');

var Animator = function(ledBuffer, options) {
	options = options || {
		transition: {
			durationMin: 2,
			durationMax: 10
		},
		animation: {
			durationMin: 10,
			durationMax: 120
		},
		hslOffset: {
			h: 0,
			s: 0,
			l: 0
		},
		rgbOffset: {
			r: 0,
			g: 0,
			b: 0
		},
		animations: {
			
		},
		transitions: {

		},
		colorBalance: {
			red: 1,
			green: 1,
			blue: 1
		},
		speedFactor: 1
	};
	this.init(ledBuffer,options);
};

util.inherits(Animator,events.EventEmitter);

extend(Animator.prototype, {
	init: function(ledBuffer, options)  {
		this.options = options;

		// store reference to LED buffer for population later
		this.buffer = ledBuffer;

		this.anims = [];
		this.animsMap = {};
		this.animIndex = 0;

		this.currentAnim = null;


		// NOTE: this maps the animation led order to the physical LED order, tweak this if we end up with bad wiring order
		// =================================================================================================================
		// to reorder the above array use this code:
		// var newOrder = [new LED winding order, can be retrieved from using the online editor picking mode]
		// var ledMap = [];
		// for (var i=0; i < newOrder.length; i++) { ledMap[newOrder[i]] = i }
		

		this.ledMap = [
			0,	8,	16,	24,	32,	40,	48,	56,	64,	72,	80,	88,
			1,	9,	17,	25,	33,	41,	49,	57,	65,	73,	81,	89,
			2,	10,	18,	26,	34,	42,	50,	58,	66,	74,	82,	90,
			3,	11,	19,	27,	35,	43,	51,	59,	67,	75,	83,	91,
			4,	12,	20,	28,	36,	44,	52,	60,	68,	76,	84,	92,
			5,	13,	21,	29,	37,	45,	53,	61,	69,	77,	85,	93,
			6,	14,	22,	30,	38,	46,	54,	62,	70,	78,	86,	94,
			7,	15,	23,	31,	39,	47,	55,	63,	71,	79,	87,	95
		];
		// =================================================================================================================


		// read all animations and transitions and get them ready for usage
		this.display = new Display();
		this.compileAnimations();
		this.loadTransitions();

		this.next();
	},
	loadTransitions: function() {
		var transitionModules = fs.readdirSync('./transitions'),
			filename;

		this.transitions = [];
		for (var i=0; i < transitionModules.length; i++) {
			this.transitions.push(require('./transitions/' + transitionModules[i]));
		}
	},
	compileAnimations: function() {
		// read all filenames in anims folder
		var animFiles = fs.readdirSync('./anims'),
			filename, code, wrappedCode, script;

		// compile them into Script objects and store in our anims array
		for (var i=0; i < animFiles.length; i++) {
			filename = animFiles[i];
			code = fs.readFileSync('./anims/' + filename);
			wrappedCode = "val = function() { " + code + " }";
			script = vm.createScript(wrappedCode,filename);
			this.anims.push(filename);
			this.options.animations[filename] = true;
			this.animsMap[filename] = script;
		}
		console.log('info: Animations = ' + JSON.stringify(this.anims));
	},
	activateAnimation: function(name) {
		this.options.animations[name] = true;
	},
	deactivateAnimation: function(name) {
		this.options.animations[name] = false;
	},
	setOptions: function(options, value) {
		if (typeof options === 'object') {
			extend(true, this.options, options);
		} else {
			this.options[options] = value;
		}
		if (options.speedFactor) {
			this.startTime = Date.now();
		}
	},
	play: function() {
		this.startTime = Date.now();
		this.display.play();
	},
	update: function(time) {
		var elapsed = Date.now() - this.startTime;
		// update tweens and display state
		this.display.update(this.startTime + (elapsed*this.options.speedFactor));

		// update current animation
		if (this.currentAnim) {
			this.currentAnim.onUpdate(this.display,this.touchData,this);
		}

		// copy led color values into buffer
		var display = this.display,
			ledBuffer = this.buffer,
			leds = display.leds;

		if (this.transition) {
			leds = this.applyTransition(leds);
		}

		var index = 0, led = null, realIndex = 0;
		for (var i=0; i < leds.length; ++i) {
			index = i*3;
			realIndex = this.ledMap[i]*3;
			led = leds[i];

			// if we've been given color modifications (hue, saturation or lightness shift...)
			// apply it here before we translate to buffer
			if (this.filter) {
				var c = led.clone();
				c.offsetHSL(this.filter.h, this.filter.s, this.filter.l);
				led = c;
			}

			led.r *= this.options.colorBalance.red;
			led.g *= this.options.colorBalance.green;
			led.b *= this.options.colorBalance.blue;

			led.r = Math.min(1,led.r);
			led.g = Math.min(1,led.g);
			led.b = Math.min(1,led.b);
			led.r = Math.max(0,led.r);
			led.g = Math.max(0,led.g);
			led.b = Math.max(0,led.b);
			
			ledBuffer[realIndex] = led.r*254 & 255;
			ledBuffer[realIndex+1] = led.g*254 & 255;
			ledBuffer[realIndex+2] = led.b*254 & 255;
		}

		// TODO: if current anim doesn't provide touch implementation then apply touchData.filters here

		// ledBuffer now ready for sending to clients
	},
	applyTransition: function(newValues) {
		if (!this.transition) {
			return newValues;
		}
		return this.transition.calculate(this.oldValues, newValues);
	},

	startTransition: function(Transition) {
		// copy current led values
		var oldValues = [];
		for (var i=0; i < this.display.leds.length; i++) {
			var led = this.display.leds[i];
			oldValues.push(led.clone());
		}
		this.oldValues = oldValues;

		// calculate random duration based on settings
		var min = this.options.transition.durationMin,
			max = Math.max(this.options.transition.durationMax,min),
			duration = 0;

		min = Math.min(min, max);

		console.log('debug: transition min ' + min + ' max ' + max);
		duration = Math.round((min + (Math.random() * (max-min)))*1000);

		// create transition object and start it tweening
		var transition = new Transition(duration); // override settings here

		// ensure we're at the start of the transition
		transition.complete = 0;

		// let it setup whatever it needs
		transition.setup(this.display, this.oldValues);

		console.log('info: running transition for ' + transition.duration + 'ms');
		// create a tween to manage its lifetime
		var tween = this.display.tween(transition, {
				duration: transition.duration,
				repeat: 0,
				to: {
					complete: 1
				}
			});

		// handle listener for end of transition
		tween.onComplete(function() {
			// transition complete, clear it
			this.transition = null;
			console.log('info: clearing transition');
		}.bind(this));

		tween.start();
		// store it so we know we're transitioning
		this.transition = transition;
		return transition;
	},
	pickTransition: function() {
		var idx = Math.floor(Math.random()*this.transitions.length);
		return this.transitions[idx];
	},
	getActiveAnims: function() {
		var activeAnims = [];
		for (var animName in this.options.animations) {
			if (this.options.animations[animName]) {
				activeAnims.push(animName);
			}
		}
		return activeAnims;
	},
	resetIndex: function() {
		this.animIndex = -1;
	},
	next: function() {
		this.startTime = Date.now();
		this.display.cleanAnimation();
		// forces transition to the next animation immediately
		this.animIndex++;
		// loop round
		var anims = this.getActiveAnims();

		if (this.animIndex>=anims.length) {
			this.animIndex = 0;
		}
		var animName = anims[this.animIndex],
			script = this.animsMap[animName];

		this.currentAnim = script.runInNewContext({
			Display: Display,
			THREE: THREE,
			TWEEN: TWEEN,
			$: $,
			console: console
		})(); // execute the script to get the anim module all setup


		var Transition = this.pickTransition();
		// setup transition
		var transition = this.startTransition(Transition);

		// initialize it
		this.currentAnim.init(this.display,this);


		// setup timeout to trigger next
		if (this.nextAnimTimeout) {
			clearTimeout(this.nextAnimTimeout);
			this.nextAnimTimeout = null;
		}

		// pick random animation duration
		var min = this.options.animation.durationMin,
			max = Math.max(this.options.animation.durationMax,min),
			duration = 0;

		min = Math.min(min, max);
		duration = Math.round((min + (Math.random() * (max-min))) * 1000) + transition.duration;

		console.log('info: running animation : ' + animName + ' for ' + duration + 'ms');
		this.nextAnimTimeout = setTimeout(this.next.bind(this), duration);
		this.emit('animation-change', animName);
		this.display.play();
	},
	clearShift: function() {
		this.filter = null;
	},
	setShift: function(h,s,l) {
		this.filter = {
			h: h,
			s: s,
			l: l
		};
	}
});


module.exports = Animator;