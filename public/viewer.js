

(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
							  window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

var Viewer = function() {
	this.init();
};

Viewer.prototype = {
	container: null,

	// the animation being shown/edited right now
	theAnim: null,
	// the actual animation instance
	currentAnim: null,

	init: function() {

		this.leds = [];

		this.initScene();
		this.addListeners();
		// create the dome object to represent our dome and its leds

		this.resizeContainer();
		this.onUpdate();

	},
	connect: function() {
		var that = this;
		var socket = io.connect();
		socket.on('reconnect', function() {
		});
		socket.on('initDisplay', function(data) {
			that.initDisplay(data);
		});
		socket.on('playlist', function(data) {
			that.playlist(data);
		});
		socket.on('animations', function(data) {
			that.animations(data);
		});
		socket.on('update', function (data) {
			that.update(data);
		});

		socket.on('animation-change', function(animName) {
			that.onAnimationChange(animName);
		});
		this.socket = socket;
	},
	initDisplay: function(config) {
		this.leds = [];
		// initialize
		this.LED_ROWS = config.rows;
		this.LED_COLS = config.cols;
		this.MAX_LEDS = this.LED_ROWS*this.LED_COLS;
		this.ratio = config.cols/config.rows;

		for (var i=0; i < this.MAX_LEDS; i++) {
			this.leds.push({r: 0, g: 0, b: 0});
		}
		this.resizeContainer();
	},
	playlist: function(playlist) {
		// update playlist in UI
		var list = $('#playlist .list-group');
		var template = $('<li class="list-group-item"></li>');
		list.empty();
		for (var i=0; i < playlist.length; i++) {
			var item = template.clone().text(playlist[i].name);
			item.data('index', i);
			item.data('animName', playlist[i].name);
			list.append(item);	
		}
	},
	animations: function(animations) {
		var list = $('#animations .list-group');
		var template = $('<li class="list-group-item"><button type="button" class="pull-right btn edit-button"><span class="glyphicon glyphicon-pencil"></span></button><button type="button" class="pull-right btn queue-button"><span class="glyphicon glyphicon-list"></span></button><button type="button" class="pull-right btn play-button"><span class="glyphicon glyphicon-play"></span></button></li>');
		list.empty();
		for (var filename in animations) {
			var anim = animations[filename];
			var item = template.clone().append('<span>' + anim.name + '</span>');
			item.data('anim', anim);
			list.append(item);	
		}
	},
	onAnimationChange: function(animName) {
		$('#animationName').text(animName);
	},
	nextAnim: function() {
		if (this.socket) {
			this.socket.emit('nextAnim');
		}
	},
	resizeContainer: function() {
		this.canvas.width('100%');
		var width = this.canvas.width();
		var height = Math.round(width / 1.5);
		var maxHeight =  parseInt(this.canvas.css('max-height'),10);
		if (height > maxHeight) {
			height = maxHeight;
			// recalculate width
			width = Math.round(height * 1.5);
			this.canvas.width(width);
		}
		this.canvas.height(height);
		this.canvas.attr('width', width);
		this.canvas.attr('height', height);
		// calculate spacing for LEDs
		var ledW = width / this.LED_COLS;
		var ledH = height / this.LED_ROWS;
		this.ledSize = Math.min(ledW,ledH);
		this.xOffset = (width - this.ledSize*this.LED_COLS)/2;
		this.yOffset = (height - this.ledSize*this.LED_ROWS)/2;
	},
	onWindowResize: function() {
		this.resizeContainer();
		var width = this.canvas.width();
		var height = this.canvas.height();

		this.halfX = width / 2;
		this.halfY = height / 2;
	},
	initScene: function() {

		this.canvas = $('#canvas');
	},
	createLEDS: function() {
		// calculate width/height of canvas
		var width = this.canvas.width();
		var height = this.canvas.height();

		// calculate offset to indent LEDs
		var offsetX = Math.round((width / 12)/2);
		var offsetY = Math.round((height / 8)/2);
		var gapX = Math.round(width/12);
		var gapY = Math.round(height/8);
		var radius = (Math.round(width / 12)/2)*1;

		if (this.ledObjects) {
			for (var i=0; i < this.ledObjects.length; i++) {
				this.ledObjects[i].remove();
			}
		}

		this.ledObjects = [];
		for (var i=0; i < this.leds.length; i++) {
			var x = i%12;
			var y = Math.floor(i/12);
			var posX = offsetX + (gapX*x);
			var posY = offsetY + (gapY*y);

			var led = new paper.Path.Circle({
				center: [posX,posY],
				radius: radius
			});
			led.fillColor = {
				gradient: {
					stops: [
						{red: 0, green: 0, blue: 0},
						{red: 0, green: 0, blue: 0}
					],
					radial: true
				},
				origin: led.position,
				destination: led.bounds.rightCenter
			};

			this.ledObjects.push(led);
		}
	},
	addListeners: function() {
		$(window).on('resize', $.proxy(this.onWindowResize, this));
		var that = this;
		$('#animations .list-group').on('click', '.queue-button', function(ev) {
			var item = $(ev.target).closest('li');
			var anim = item.data('anim');
			if (that.socket) {
				that.socket.emit('queue-animation', anim.filename);
			}
		});
		$('#animations .list-group').on('click', '.edit-button', function(ev) {
			var item = $(ev.target).closest('li');
			var anim = item.data('anim');
			window.location = '/edit.html?anim=' + encodeURIComponent(anim.filename);
		});
		$('#animations .list-group').on('click', '.play-button', function(ev) {
			var item = $(ev.target).closest('li');
			var anim = item.data('anim');
			if (that.socket) {
				that.socket.emit('play-animation', anim.filename);
			}
		});
	},

	update: function(data) {
		// loop over data and update led info
		for (var i=0; i < this.leds.length; i++) {
			var index = i*3,
				led = this.leds[i];
			led.r = data[index];
			led.g = data[index+1];
			led.b = data[index+2];
		}
	},
	
	onUpdate: function() {
		this.render();
		requestAnimationFrame($.proxy(this.onUpdate,this));
	},

	render: function() {
		if (!this.leds || this.leds.length <= 0) {
			return;
		}

		var canvas = this.canvas[0];
		var ctx = canvas.getContext('2d');
		ctx.globalCompositeOperation = 'screen';

		// Use the identity matrix while clearing the canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		for (var i=0; i < this.leds.length; i++) {
			// figure out coordinates of this led
			var ledX = i%this.LED_COLS,
				ledY = Math.floor(i/this.LED_COLS),
				x = this.xOffset + (ledX*this.ledSize) +this.ledSize/2,
				y = this.yOffset + (ledY*this.ledSize) +this.ledSize/2;
			var gradient = ctx.createRadialGradient(x,y,0, x,y,this.ledSize*0.85);

			var col = this.leds[i];
			var colString = "rgba(" + col.r + "," + col.g + "," + col.b + ",1)";
			gradient.addColorStop(0, colString);
			gradient.addColorStop(0.1, colString);
			colString = "rgba(" + col.r + "," + col.g + "," + col.b + ",0)";
			gradient.addColorStop(1, colString);
			ctx.fillStyle = gradient;
			ctx.beginPath();
			ctx.arc(x,y,this.ledSize, 0, Math.PI*2, true); 
			ctx.closePath();
			ctx.fill();
		}				
	}
};