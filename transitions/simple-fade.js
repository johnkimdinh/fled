var SimpleFade = function(duration, options) {
	this.complete = 0;
	this.duration = duration;
	// apply options?
};

SimpleFade.prototype = {
	setup: function(dome) {
	},

	calculate: function(oldValues, newValues) {
		//var outValues = new Array(oldValues.length),
		var	halfway = (this.complete*2) % 1,
			i = 0,
			cloned = null;

		if (this.complete <= 0.5) {
			for (i=0; i < oldValues.length; i++) {
				cloned = oldValues[i].clone();
				cloned.multiplyScalar(1-halfway); // just use our complete value (0-1 for complete)
				newValues[i] = cloned;
			}
		} else {
			for (i=0; i < newValues.length; i++) {
				cloned = newValues[i].clone();
				cloned.multiplyScalar(halfway); // just use our complete value (0-1 for complete)
				newValues[i] = cloned;
			}
		}
		// ensure we return an array of led color info
		return newValues;
	}
};

module.exports = SimpleFade;