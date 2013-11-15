var path = require('path'),
	util = require('util'),
	fs = require('fs'),
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

		this.animator = options.animator;
		this.animations = options.animations;
		this.playlist = options.playlist;

		server.listen(8080);

		var that = this;

		this.data = {};

		this.animator.setData(this.data);

		app.use(express.static(path.join(__dirname, 'public')));
		app.get('/', function (req, res) {
			res.sendfile(__dirname + '/index.html');
		});
		app.get('/edit', function (req, res) {
			res.sendfile(__dirname + '/editor.html');
		});
		app.post('/data', function(req, res) {
			that.addData(req.body);
			res.json({success: 'ok'});
		});
		app.get('/data', function(req, res) {
			res.json(that.data);
		});

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
			}
		};
		that.playlist.on('change', client.onPlaylistChange);
		that.animator.on('animation-change', client.onAnimationChange);
		that.animations.on('change', client.onAnimations);
		that.on('data-change', client.onDataChange);

		io.sockets.on('connection', function (socket) {
			socket.emit('initDisplay', that.animator.display.config);
			// initialize state
			socket.emit('playlist', that.playlist.getList());
			socket.emit('animations', that.animations.get());
			socket.emit('data', that.data);

			socket.on('get-anim', function(name) {
				var anim = that.animations.get(name);
				socket.emit('anim-data', anim);
			});
			socket.on('save-anim', function(data) {
				// save data to drive
				var filename = data.filename;
				if (!filename) {
					filename = 'anims/' + new Date().getTime() + '.js';
				} else {
					filename = 'anims/' + filename;
				}
				// write to disk
				fs.writeFile(filename, JSON.stringify(data), function(err) {
					socket.emit('anim-saved', data);
					// update animations class
					var anim = that.animations.set(filename, data);
					that.animator.next(anim);
				});
			});

			socket.on('play-animation', function(data) {
				var anim = that.animations.get(data);
				that.animator.next(anim);
			});
			socket.on('queue-animation', function(data) {
				var anim = that.animations.get(data);
				that.playlist.enqueue(anim);
			});
			socket.on('nextAnim', function() {
				that.animator.next();
			});
			socket.on('settings', function(data) {
				that.animator.setOptions(data);
			});
			socket.on('disconnect', function() {
				console.log('Client disconnected');
			});
		});

		// all ready? send first animation
		this.animator.next(that.playlist.pop());
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
		this.io.sockets.emit('update', buffer.toJSON());
	}
});
module.exports = Controller;