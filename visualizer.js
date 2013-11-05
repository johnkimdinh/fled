/*var app = require('http').createServer(handler),
	io = require('socket.io').listen(app),
	fs = require('fs');*/
var path = require('path');

var Visualizer = function(animator, options) {
	this.init(animator, options);
};

Visualizer.prototype = {
	init: function(animator, options) {
		var express = require('express'),
			app = express(),
			server = require('http').createServer(app),
			io = require('socket.io').listen(server);

		this.animator = animator;
		server.listen(80);

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
		this.socket = null;
		io.sockets.on('connection', function (socket) {
			that.socket = socket;

			socket.on('nextAnim', function() {
				that.animator.next();
			});

			socket.emit('settings', animator.options);

			socket.on('settings', function(data) {
				that.animator.setOptions(data);
			});

			socket.on('animation-activate', function(data) {
				console.log('animation activated : ' + data);
				that.animator.activateAnimation(data);
			});
			socket.on('animation-deactivate', function(data) {
				that.animator.deactivateAnimation(data);
			});
			animator.on('animation-change', function(animName) {
				socket.emit('animation-change', animName);
			});
			socket.on('reset-index', function() {
				that.animator.resetIndex();
			});
		});
	},
	send: function(buffer) {
		if (!this.socket) {
			return;
		}
		this.socket.emit('update', buffer.toJSON());
	}
};
module.exports = Visualizer;