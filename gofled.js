var net = require("net");

// this module handles sending of animation data from a buffer to the arduino
var GoFLED = function(options) {
	this.init(options);
};

GoFLED.prototype = {
	setConnectTimeout: function() {
		if (this.connectTimeout) {
			clearTimeout(this.connectTimeout);
			this.connectTimeout = null;
		}
		
		this.connectTimeout = setTimeout(this.connect.bind(this), 3000);
	},
	connect: function() {
		this.connectTimeout = null;
		var that = this;
		// create connection to gofled port
		that.client = null;

		console.log("Attempting connection...");
		var client = net.connect({host:"fled.vpc.supplyframe.com", port:9001}, function() {
			// client connected!
			console.log("Connected to GoFLED");
			that.client = client;

			// send meta message
			var meta = {
				"name": "fled-js",
				"fps":30,
				"author": "Various",
				"active": true
			};

			var metaBuffer = new Buffer(JSON.stringify(meta));
			that.sendMessage(5, metaBuffer);
		});

		client.on('end', function() {
			console.log("GoFLED disconnected");
			// attempt reconnect
			that.client = null;
			that.setConnectTimeout();
		});
		client.on('error', function() {
			console.log("GoFLED connection error");
			// attempt reconnect
			that.client = null;
			that.setConnectTimeout();
		});
	},
	init: function(options) {
		// trigger connect code
		this.options = options;
		this.ledCount = options.ledCount;
		this.connect();

		this.dataBuffer = new Buffer(this.ledCount*3);
	},
	sendMessage: function(cmd, buffer) {
		// message is 4 bytes of command, 4 bytes of packet len, and then the buffer length
		var data = new Buffer(buffer.length+4+4);
		data.writeUInt32LE(buffer.length + 4, 0);
		data.writeUInt32LE(cmd, 4);

		buffer.copy(data, 8);

		this.client.write(data);
	},
	send: function(buffer) {
		if (!this.client) {
			//	console.log('warn: no arduino port available for writing');
			return;
		}
		try {
			var that = this, index, realIndex;
			// reorder buffer according to internal LED map
			for (var i=0; i < this.ledCount; i++) {
				index = i*3;	
				this.dataBuffer[index] = Math.round((buffer[index]/255)*255);
				this.dataBuffer[index+1] = Math.round((buffer[index+1]/255)*255);
				this.dataBuffer[index+2] = Math.round((buffer[index+2]/255)*255);
			}
			this.sendMessage(0, this.dataBuffer);
		} catch(ex) {
			console.log('Exception thrown while writing to GoFLED socket : ' + ex);
			process.exit(-1);
		}
	}
};

module.exports = GoFLED;