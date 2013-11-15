var path = require('path'),
	express = require('express');

var Controller = function(options) {
	this.init(options);
};

Controller.prototype = {
	init: function(options) {
		var app = express(),
			server = require('http').createServer(app),
			io = require('socket.io').listen(server);

		this.animator = options.animator;
		this.playlist = options.playlist;

		server.listen(8080);

		app.use(express.static(path.join(__dirname, 'public')));
		app.get('/', function (req, res) {
			res.sendfile(__dirname + '/index.html');
		});
		app.get('/edit', function (req, res) {
			res.sendfile(__dirname + '/editor.html');
		});

		this.server = server;
		this.io = io;
		this.app = app;

		io.set('log level', 1);

		var that = this;

		var client = {
			onPlaylistChange: function(playlist) {
				io.sockets.emit('playlist', playlist.getList());
			},
			onAnimationChange: function(animation) {
				io.sockets.emit('animation-change', animation);
			},
			onDataChange: function(data) {
				io.sockets.emit('data', data);
			}
		};
		that.playlist.on('change', client.onPlaylistChange);
		that.animator.on('animation-change', client.onAnimationChange);
		//that.variables.on('change', client.onDataChange);

		io.sockets.on('connection', function (socket) {
			socket.emit('initDisplay', that.animator.display.config);
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
	},
	send: function(buffer) {
		if (!this.io) {
			return;
		}
		this.io.sockets.emit('update', buffer.toJSON());
	}
};
module.exports = Controller;