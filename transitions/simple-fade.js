var SimpleFade = function(duration, options) {
	this.complete = 0;
	this.duration = duration;
	// apply options?
};

SimpleFade.prototype = {
	setup: function(dome) {
	},

	calculate: function(oldValues, newValues) {
		var outValues = new Array(oldValues.length),
			halfway = (this.complete*2) % 1,
			i = 0,
			cloned = null;

		if (this.complete <= 0.5) {
			for (i=0; i < oldValues.length; i++) {
				cloned = oldValues[i].clone();
				var rgb = cloned.rgb();
				rgb.r *= 1-halfway;
				rgb.g *= 1-halfway;
				rgb.b *= 1-halfway;
				cloned.rgb(rgb); // just use our complete value (0-1 for complete)
				outValues[i] = cloned;
			}
		} else {
			for (i=0; i < newValues.length; i++) {
				cloned = newValues[i].clone();
				var rgb = cloned.rgb();
				rgb.r *= halfway;
				rgb.g *= halfway;
				rgb.b *= halfway;
				cloned.rgb(rgb); // just use our complete value (0-1 for complete)
				outValues[i] = cloned;
			}
		}
		// ensure we return an array of led color info
		return outValues;
	}
};

module.exports = SimpleFade;