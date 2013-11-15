var RandomSelector = function(anims) {
	// randomly picks animations from list
	this.anims = anims;
};

RandomSelector.prototype = {
	select: function() {
		var index = Math.round(Math.random()*(this.anims.length-1));
		return this.anims[index];
	}
};

module.exports = RandomSelector;