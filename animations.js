var vm = require('vm'),
	util = require('util'),
	extend = require('extend'),
	EventEmitter = require('events').EventEmitter,
	fs = require('fs');

var Animations = function() {
	// read all filenames in anims folder
	var animFiles = fs.readdirSync('./anims'),
		filename, data, wrappedCode, script;

	this.anims = [];
	this.animsMap = {};

	// compile them into Script objects and store in our anims array
	for (var i=0; i < animFiles.length; i++) {
		filename = animFiles[i];
		data = fs.readFileSync('./anims/' + filename);
		this.add(JSON.parse(data),filename);
	}
};

util.inherits(Animations, EventEmitter);

extend(Animations.prototype, {
	get: function(name) {
		if (name) {
			return this.animsMap[name];
		}
		return this.animsMap;
	},
	set: function(filename, data) {
		try {
			var wrappedCode = "val = function() { " + data.code + " }",
				script = vm.createScript(wrappedCode,filename);

			data.filename = filename;
			data.script = script;

			if (!this.animsMap[filename]) {
				this.anims.push(filename);
			}
			this.animsMap[filename] = data;
			this.emit('change', this.animsMap);
			return data;
		} catch (ex) {
			console.log(ex.stack);
			return null;
		}
	},
	list: function() {
		return this.anims;
	},
	add: function(data, filename) {
		try {
			var wrappedCode = "val = function() { " + data.code + " }",
				script = vm.createScript(wrappedCode,filename);

			data.filename = filename;
			data.script = script;

			this.anims.push(filename);
			this.animsMap[filename] = data;
			this.emit('change', this.animsMap);
		} catch (ex) {
			console.log(ex.stack);
			return null;
		}
	}
});

module.exports = Animations;