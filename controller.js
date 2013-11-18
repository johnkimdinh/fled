var path = require('path'),
	util = require('util'),
	fs = require('fs'),
	extend = require('extend'),
	EventEmitter = require('events').EventEmitter,
	Memcached = require('memcached'),
	express = require('express');

var Controller = function(options) {
	this.init(options);
};

util.inherits(Controller, EventEmitter);

extend(Controller.prototype, {
	init: function(options) {
		var app = express(),
			server = require('http').createServer(app),
			io = require('socket.io').listen(server);

		app.use(express.bodyParser());

		this.animator = options.animator;
		this.animations = options.animations;
		this.playlist = options.playlist;
		this.buffer = options.buffer;

		this.cache = new Memcached('localhost:11211');

		server.listen(8080);

		var that = this;

		this.data = {};

		/*app.use(express.static(path.join(__dirname, 'public')));
		app.get('/', function (req, res) {
			res.sendfile(__dirname + '/index.html');
		});
		app.get('/edit', function (req, res) {
			res.sendfile(__dirname + '/editor.html');
		});*/

		this.server = server;
		this.io = io;
		this.app = app;

		io.set('log level', 1);


		this.animator.on('animation-finished',function(animator) {
			// pop item from playlist
			var anim = that.playlist.pop();
			animator.next(anim,that.data);
		});

		var client = {
			onPlaylistChange: function(playlist) {
				io.sockets.emit('playlist', playlist.getList());
			},
			onAnimationChange: function(animation) {
				io.sockets.emit('animation-change', animation);
			},
			onAnimations: function(animations) {
				io.sockets.emit('animations', animations);
			},
			onDataChange: function(data) {
				io.sockets.emit('data', data);
			},
			onUpdate: function(buffer) {
				io.sockets.emit('update',buffer);
			}
		};
		that.playlist.on('change', client.onPlaylistChange);
		that.animator.on('animation-change', client.onAnimationChange);
		that.animations.on('change', client.onAnimations);
		//that.on('data-change', client.onDataChange);

		// setup 30fps only timer to update clients all together if necessary
		setInterval(function() {
			client.onDataChange(that.data);
		},100);
		setInterval(function() {
			client.onUpdate(that.buffer);
		},33);

		io.sockets.on('connection', function (socket) {
			socket.emit('initDisplay', that.animator.display.config);
			// initialize state
			socket.emit('playlist', that.playlist.getList());
			socket.emit('animations', that.animations.get());

			socket.on('get-anim', function(name) {
				var anim = that.animations.get(name);
				socket.emit('anim-data', anim);
			});
			socket.on('request-variables', function() {
				// fetch variables from db
				that.cache.get('variables', function(err, data) {
					if (err) {
						console.log('Error retrieving variables from memcache : ' + err);
						return;
					}
					data = JSON.parse("[" + data + "]");
					socket.emit('variables', data);
				});
			});
			socket.on('save-anim', function(data) {
				// save data to drive
				var timestamp = data.filename;
				var filename = null;
				if (!timestamp) {
					timestamp = new Date().getTime() + '.js';
					filename = 'anims/' + timestamp;
				} else {
					filename = 'anims/' + timestamp;
				}
				var anim = that.animations.set(timestamp, data);
				if (anim) {
					// write to disk
					fs.writeFile(filename, JSON.stringify(data), function(err) {
						socket.emit('anim-saved', anim);
						// update animations class
						that.animator.next(anim,that.data);
					});
				} else {
					socket.emit('anim-error','Invalid javascript!');
				}
			});

			socket.on('play-animation', function(data) {
				var anim = that.animations.get(data);
				that.animator.next(anim, that.data);
			});
			socket.on('queue-animation', function(data) {
				var anim = that.animations.get(data);
				that.playlist.enqueue(anim);
			});
			socket.on('nextAnim', function() {
				that.animator.next(null, that.data);
			});
			socket.on('settings', function(data) {
				that.animator.setOptions(data);
			});
			socket.on('disconnect', function() {
				console.log('Client disconnected');
			});
		});

		// all ready? send first animation
		this.animator.next(that.playlist.pop(), this.data);
	},
	addData: function(packet) {
		/* expects object of form:
		{
			name: 'datasheet.net',
			data: {
				// whatever data you like here
			}
		}
		*/
		if (typeof this.data[packet.name] === 'undefined') {
			this.data[packet.name] = {};
		}
		extend(this.data[packet.name], packet.data);
		this.emit('data-change', this.data);
	},
	send: function(buffer) {
		if (!this.io) {
			return;
		}
		this.io.sockets.emit('update', buffer);
	}
});
module.exports = Controller;