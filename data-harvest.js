var path = require('path'),
	util = require('util'),
	fs = require('fs'),
	extend = require('extend'),
	EventEmitter = require('events').EventEmitter,
	express = require('express');

/*var app = express(),*/
var server = require('http').createServer(function(req, res) {
	var data = "";

    req.on("data", function(chunk) {
        data += chunk;
    });
    req.on('end', function() {
    	var json = JSON.parse(data);
    	console.log('Received : ' + JSON.stringify(json));
    });
    res.writeHead(200);
    res.end(JSON.stringify({'success': 'ok'}));
}).listen(8081);
/*
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
}, 200);*/