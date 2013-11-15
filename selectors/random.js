var RandomSelector = function(anims) {
	// randomly picks animations from list
	this.anims = anims;
};

RandomSelector.prototype = {
	select: function() {
		var anims = this.anims.list();
		var index = Math.round(Math.random()*(anims.length-1));
		return this.anims.get(anims[index]);
	}
};

module.exports = RandomSelector;