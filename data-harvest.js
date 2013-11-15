var path = require('path'),
	util = require('util'),
	fs = require('fs'),
	extend = require('extend'),
	EventEmitter = require('events').EventEmitter,
	express = require('express');

var app = express(),
	server = require('http').createServer(app);

app.use(express.bodyParser());

server.listen(8081);

var data = {};

app.post('/data', function(req, res) {
	var packet = req.body;
	// store data
	if (typeof data[packet.name] === 'undefined') {
		data[packet.name] = {};
	}
	extend(data[packet.name], packet.data);

	process.send(data);

	res.json({success: 'ok'});
});