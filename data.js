var vm = require('vm'),
	util = require('util'),
	extend = require('extend'),
	Memcached = require('memcached'),
	EventEmitter = require('events').EventEmitter;

var Data = function() {
	// create connection to memcache
	this.cache = new Memcached('localhost:11211');
	this.variables = [];
	this.subscribedVariables = {};
	this.data = {};
	this.startPolling();
};

util.inherits(Data, EventEmitter);

extend(Data.prototype, {
	subscribe: function(name) {
		// start retrieving this named variable from memcache
		if (!this.subscribedVariables[name]) {
			this.subscribedVariables[name] = 1;
			console.log('Subscribed to ' + name);
		} else {
			this.subscribedVariables[name]++;
		}
	},
	unsubscribe: function(name) {
		if (this.subscribedVariables[name]) {
			this.subscribedVariables[name]--;
			if (this.subscribedVariables[name]<=0) {
				this.subscribedVariables[name] = null;
				delete this.subscribedVariables[name];
				console.log('Unsubscribed from ' + name);
			}
		}
	},
	startPolling: function() {
		var that = this;
		this.interval = setInterval(function() {
			var variables = Object.keys(that.subscribedVariables);
			if (variables.length <= 0) {
				return;
			}
			that.cache.getMulti(variables, function(err, data) {
				if (err) {
					console.log('Error retrieving variables from memcache : ' + err);
					return;
				}
				// turn back into JSON objects
				for (var key in data) {
					data[key] = JSON.parse(data[key]);
				}
				that.data = data;
				that.emit('data', data);
			});
		},100);
		this.variableInterval = setInterval(function() {
			that.cache.get('variables', function(err, data) {
				if (err) {
					console.log('Error retrieving variables list from memcache : ' + err);
					return;
				}
				var isChanged = data.length != that.variables.length;
				if (!isChanged) {
					for (var i=0; i < data.length; i++) {
						if (data[i]!=that.variables[i]) {
							isChanged = true;
						}
					}
				}
				if (isChanged) {
					that.variables = data;
					that.emit('variables', data);
				}
			});
		},1000);
	},
	available: function(name) {
		if (this.variables) {
			return this.variables.indexOf(name) !== -1;
		}
		return false;
	},
	get: function(name) {
		return this.data[name];
	},
	register: function(name) {
		var that = this;
		// get the variable list
		if (!this.variables || Object.prototype.toString.call( this.variables ) !== '[object Array]' ) {
			this.variables = [];
		}
		if (this.variables.indexOf(name)==-1) {
			this.variables.push(name);
		}
		console.log('Storing variable list : ' + JSON.stringify(this.variables));
		this.cache.set('variables', this.variables,0, function(err, result) {
			console.log('Added data variable : ' + name + ' : ' + result);
		});
	},
	list: function(callback) {
		this.cache.get('variables', function(err, data) {
			if (err) {
				console.log('Error retrieving variables from memcache : ' + err);
				callback(err);
				return;
			}
			callback(err, data);
		});
	}
});

module.exports = Data;