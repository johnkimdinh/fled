var serialport = require("serialport"),
	SerialPort = serialport.SerialPort;

// this module handles sending of animation data from a buffer to the arduino
var Arduino = function(options) {
	this.init(options);
};

Arduino.prototype = {
	setConnectTimeout: function() {
		if (!this.connectTimeout) {
			this.connectTimeout = setTimeout(this.connect.bind(this), 1000);
		}
	},
	connect: function() {
		var that = this;
		// attempt connection, if fail trigger a timeout for 1 second to retry
		serialport.list(function (err, ports) {
			that.connectTimeout = null;

			if (err) {
				console.log('error: error listing serial ports : ' + err);
				// trigger retry in 1 second
				return that.setConnectTimeout();
			}
			if (that.serialPort) {
				// already connected
				console.log('warn: Arduino already connected!');
				return;
			}

			var port = null;
			ports.forEach(function(p) {
				if (p.manufacturer.indexOf('Arduino')!==-1) {
					port = p.comName;
				} else {
					if (p.hasOwnProperty('pnpId')){
						// FTDI captures the duemilanove //
						// Arduino captures the leonardo //
						if (p.pnpId.search('FTDI') != -1 || p.pnpId.search('Arduino') != -1) {
							port = p.comName;
						}
					}
				}
			});
			if (!port) {
				// trigger retry in 1 second
				//console.log('error: failed to find valid arduino port');
				that.serialPort = null;
				return that.setConnectTimeout();
			}
			// open the port
			var serialPort = new SerialPort(port, {
				baudrate: 250000,
				parser: serialport.parsers.readline("\n") 
			});
			var oldNumber = 0;
			serialPort.once("open", function () {
				setTimeout(function() {
					that.serialPort = serialPort;
					console.log('info: ' + port + ' port opened to arduino');
					
					var lastByte = 0;
					var byteCount = 0;

					serialPort.on('data', function(data) {
						console.log('Received: ' + data);
/*
						var delta = (data[0])-oldNumber;
						console.log('debug: data received from arduino : ' + JSON.stringify(delta)) ;
						oldNumber = data[0];
						console.log(JSON.stringify(data));*/
					});
				},5000);
			});
			serialPort.once("close", function() {
				that.serialPort = null;
				console.log('warn: serial port to arduino closed.');
				that.setConnectTimeout();
			});
			serialPort.once("error", function() {
				that.serialPort = null;
				console.log('error: error on serial port : ' + err);
				that.setConnectTimeout();
			});
		});
	},
	init: function(options) {
		// trigger connect code
		this.options = options;
		this.connect();
		this.headerBuffer = new Buffer(256);
		this.headerBuffer.fill(255);
		this.sendCount = 0;
	},
	send: function(buffer) {
		if (!this.serialPort) {
		//	console.log('warn: no arduino port available for writing');
			return;
		}
		try {
			var that = this;
			//console.log('debug: Writing buffer : ' + buffer.toJSON());
			this.serialPort.write(this.headerBuffer, function(err, results) {
				if (err) {
					console.log('error: failed to send data to arduino : ' + err);
					that.serialPort = null;
					that.setConnectTimeout();
				}
			});
			var sendCountBuf = new Buffer(1);
			sendCountBuf[0] = this.sendCount % 255;
			this.serialPort.write(sendCountBuf);

			this.serialPort.write(buffer, function(err, results) {
				if (err) {
					console.log('error: failed to send data to arduino : ' + err);
					that.serialPort = null;
					that.setConnectTimeout();
				}
			});
			//console.log('Sent:' + this.sendCount);
			this.sendCount++;
		} catch(ex) {
			console.log('Exception thrown while writing to serialport : ' + ex);
			process.exit(-1);
		}
	}
};

module.exports = Arduino;