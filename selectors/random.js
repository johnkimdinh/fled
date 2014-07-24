var RandomSelector = function(anims) {
	// randomly picks animations from list
	this.anims = anims;
};

RandomSelector.prototype = {
	select: function(retries) {
		if (retries===undefined) {
			retries = 0;
		}
		var anims = this.anims.list();
		var index = Math.round(Math.random()*(anims.length-1));
		var anim = this.anims.get(anims[index]);
		if (anim.publish) {
			return anim;
		} else if (retries > 10) {
			return anim; // show it anyway
		}
		// try again....
		return this.select(++retries);
	}
};

module.exports = RandomSelector;