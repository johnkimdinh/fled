// this module creates a virtual display object that the animations will be running on
// it handles lighting calcuations and various other stuff and ultimately is responsible for
// setting colors on the buffer array
// this object should provide the same interfaces as the display.js on the animation editor

var TWEEN = require('./tween'),
	Color = require('./color');

// Blend modes from http://www.venture-ware.com/kevin/coding/lets-learn-math-photoshop-blend-modes/
// many thanks to Kevin Jensen!
var BlendModes = {
	normal: function(top, bottom) {
		return top;
	},
	darken: function(top, bottom) {
		return (top > bottom) ? bottom : top;
	},
	multiply: function(top, bottom) {
		return (top * bottom);
	},
	colorBurn: function(top, bottom) {
		if ( top === 0 ) return 0; // We don't want to divide by zero
		var col = ( 1 - ( 1 - bottom ) / top );
		return ( col < 0 ) ? 0 : col;
	},
	linearBurn: function(top, bottom) {
		return (top + bottom < 1.0) ? 0 : top + bottom - 1.0;
	},
	lighten: function(top, bottom) {
		return (top > bottom) ? top : bottom;
	},
	screen: function(blend, base) {
		return 1 - (( 1 - base) * (1-blend));
	},
	colorDodge: function(top, bottom) {
		if (top === 1) return 1;
		var col = bottom / (1-top);
		return (col > 1) ? 1 : col;
	},
	linearDodge: function(top, bottom) {
		return (top + bottom > 1) ? 1 : top + bottom;
	},
	overlay: function(top, bottom) {
		return (bottom < 0.5) ? (2*top*bottom) : ((1 - 2 * (1 - top) ) * (1-bottom));
	},
	softLight: function(top, bottom) {
		return ( ( 1 - top ) * top * bottom + top * ( 1 - ( 1 - top ) * ( 1 - bottom ) ) );
	},
	hardLight: function(top, bottom) {
		if (bottom < 0.5) {
			return 2*top*bottom;
		} else {
			return (1-2 * (1 - top) * (1 - bottom));
		}
	},
	vividLight: function(top, bottom) {
		if (top < 0.5) {
			return BlendModes.colorBurn(2*top, bottom);
		}
		return BlendModes.colorDodge(2 * (top - 0.5), bottom);
	},
	linearLight: function(top, bottom) {
		if (top < 0.5) {
			return BlendModes.linearBurn(2*top, bottom);
		}
		return BlendModes.linearDodge(2* (top-0.5), bottom);
	},
	pinLight: function(top, bottom) {
		return (top < 0.5) ? BlendModes.darken(2*top, bottom) : BlendModes.lighten(2*(top-0.5), bottom);
	},
	hardMix: function(blend, base) {
		return (blend < 1 - base) ? 0 : 1;
	},
	difference: function(top, bottom) {
		return Math.abs(top - bottom);
	},
	exclusion: function(top, bottom) {
		return top + bottom - 2 * top * bottom;
	},
	subtract: function(blend, base) {
		return Math.max(base - blend,0);
	},
	divide: function(blend, base) {
		if (blend === 0) {
			return 0;
		}
		return base / blend;
	},
	wrap: function(top, bottom) {
		bottom += top;
		bottom = bottom % 1;
		return bottom;
	}
};
// aliases
BlendModes.add = BlendModes.linearDodge;

var Display = function() {

	var config = require('./display-config.json');

	this.config = config;
	this.rows = config.rows;
	this.cols = config.cols;
	this.ratio = this.cols/this.rows;
	this.MAX_LEDS = this.rows*this.cols;

	this.reset();
};

Display.prototype = {
	leds: [],

	playing: false,
	tweens: [],

	play: function() {
		// start all tweens from 0
		this.playing = true;
		TWEEN.removeAll();
		for (var i=0; i < this.tweens.length; i++) {
			TWEEN.add(this.tweens[i]);
			this.tweens[i].start();
		}
	},
	stop: function() {
		// clear all tweens from Tween object
		this.playing = false;
		TWEEN.removeAll();
	},
	isPlaying: function() {
		return this.playing;
	},
	update: function(time) {
		TWEEN.update(time);
	},

	cleanAnimation: function() {
		// prepare the display for the next animation

		// stop all our tweens
		TWEEN.removeAll();
		this.tweens = [];
	},

	tween: function(obj, params) {
		var t = new TWEEN.Tween(obj)
			.to(params.to, params.duration);

		if (params.repeat!==undefined) {
			t.repeat(params.repeat);
		}
		if (params.delay!==undefined) {
			t.delay(params.delay);
		}
		if (params.yoyo!==undefined) {
			t.yoyo(params.yoyo);
		}
		if (params.easing!==undefined) {
			t.easing(params.easing);
		}
		this.tweens.push(t);
		return t;
	},

	_setColorBlend: function(led, color, blendMode) {
		if (!BlendModes[blendMode]) {
			blendMode = 'normal';
		}
		var blendFunc = BlendModes[blendMode],
			r = blendFunc(color.r, led.r),
			g = blendFunc(color.g, led.g),
			b = blendFunc(color.b, led.b),
			c = new Color();
		c.r = r;
		c.g = g;
		c.b = b;
		return c;
	},
	clear: function(color) {
		var r = 0, g = 0, b = 0;
		if (color) {
			r = color.r, g = color.g, b = color.b;
		}
		for (var i=0; i < this.leds.length; ++i) {
			this.leds[i].setRGB(r,g,b);
		}
	},
	setColor: function(leds, color, blendMode) {
		if (!blendMode) {
			blendMode = 'normal';
		}
		// led can be array
		if (!Array.isArray(leds)) {
			leds = [leds];
		}
		// set all leds in array to color
		for (var i=0; i < leds.length; ++i) {
			// look up array index in leds
			var ledIndex = leds[i],
				led = this.leds[ledIndex];
			//this.leds[ledIndex] = color.clone();
			this.leds[ledIndex] = this._setColorBlend(led, color, blendMode);
		}
	},
	getColor: function(leds,useOriginal) {
		// leds can be array
		if (!Array.isArray(leds)) {
			leds = [leds];
		}
		// set all leds in array to color
		var colors = [];
		for (var i=0; i < leds.length; ++i) {
			// look up array index in leds
			var ledIndex = leds[i];
			if (useOriginal) {
				colors.push(this.leds[ledIndex]);
			} else {
				colors.push(this.leds[ledIndex].clone());
			}
		}
		return colors;
	},


	reset: function() {
		// setup arrays of indices
		
		// initialise LED states to off
		this.leds = [];
		for (var i=0; i < this.MAX_LEDS; i++) {
			var c =  new Color(0x0);
			this.leds.push(c);
		}

		TWEEN.removeAll();

		this.tweens = [];
	}
};

// map some shortcuts to make life easier
Display.Color = Color;

module.exports = Display;