

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
		this.initScene();
		this.addListeners();

	},
	connect: function() {
		var that = this;
		var socket = io.connect();
		socket.on('reconnect', function() {
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
			if (anim.publish) {
				item.addClass('published');
			}
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
	initScene: function() {
		this.view = new Renderer("canvas");
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
		if (this.view) {
			this.view.updatePixels(data);
		}
	}
};