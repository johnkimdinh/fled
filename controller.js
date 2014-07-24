var path = require('path'),
	util = require('util'),
	fs = require('fs'),
	Data = require('./data'),
	extend = require('extend'),
	EventEmitter = require('events').EventEmitter,
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

		this.data = new Data();

		app.get('/data/register', function (req, res) {
			var key = req.param('key');
			that.data.register(key);
		});

		this.animator = options.animator;
		this.animations = options.animations;
		this.playlist = options.playlist;
		this.buffer = options.buffer;


		server.listen(8080);

		var that = this;

		this.animator.setData(this.data);

		this.server = server;
		this.io = io;
		this.app = app;

		io.set('log level', 1);


		this.animator.on('animation-finished',function(animator) {
			// pop item from playlist
			var anim = that.playlist.pop();
			animator.next(anim);
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
			onVariableChange: function(data) {
				io.sockets.emit('variables', data);
			},
			onUpdate: function(buffer) {
				io.sockets.emit('update',buffer);
			}
		};
		that.playlist.on('change', client.onPlaylistChange);
		that.animator.on('animation-change', client.onAnimationChange);
		that.animations.on('change', client.onAnimations);
		that.data.on('data', client.onDataChange);
		that.data.on('variables', client.onVariableChange);
		//that.on('data-change', client.onDataChange);

		// setup 30fps only timer to update clients all together if necessary
		setInterval(function() {
			client.onDataChange(that.data.data);
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
			socket.on('variable-subscribe', function(name) {
				// subscribe to a variable room
				socket.join(name);
				that.data.subscribe(name);
			});
			socket.on('variable-unsubscribe', function(name) {
				socket.leave(name);
				that.data.unsubscribe(name);
			});
			socket.on('request-variables', function() {
				// fetch variables from db
				that.data.list(function(err, data) {
					if (err) {
						console.log('Error retrieving variables from memcache : ' + err);
						return;
					}
					io.sockets.emit('variables', data);
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
						if (data.publish) {
							that.animator.next(anim);
						}
					});
				} else {
					socket.emit('anim-error','Invalid javascript!');
				}
			});

			socket.on('play-animation', function(data) {
				var anim = that.animations.get(data);
				that.animator.next(anim);
			});
			socket.on('queue-animation', function(data) {
				var anim = that.animations.get(data);
				that.playlist.enqueue(anim);
			});
			socket.on('disconnect', function() {
				var rooms = io.sockets.manager.roomClients[socket.id];
				for (var room in rooms) {
					var variable = room.substr(1);
					that.data.unsubscribe(variable);
				}
				console.log('Client disconnected');
			});
		});

		// all ready? send first animation
		this.animator.next(that.playlist.pop());
	}
});
module.exports = Controller;