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
var changed = false;

app.post('/data', function(req, res) {
	var packet = req.body;
	// store data
	if (typeof data[packet.name] === 'undefined') {
		data[packet.name] = {};
	}
	extend(data[packet.name], packet.data);
	changed = true;
	res.json({success: 'ok'});
});

// set update interval timer
setInterval(function() {
	if (changed) {
		process.send(data);
		changed = false;
	}
}, 200);