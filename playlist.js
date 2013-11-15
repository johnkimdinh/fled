/* 
	Ordered list of animations to be played
	Animations are selected from an index of all animations, some are loaded from disk, others are created dynamically as sockets connect to 2.
	The playlist is just an array, when the playlist has less than 5 items on it we queue up an animation from the current generator.
	Generators select from list according to internal rules, we setup as many of these as we like.
	Application has a currently selected generator at all times used to populate the list.
	Users can manually add animations to queue by selecting them from the list.
	Users can reorder animations in the queue.
*/
var EventEmitter = require('events').EventEmitter,
	util = require('util'),
	extend = require('extend');

var Playlist = function(picker) {
	EventEmitter.call(this);

	this.picker = picker;
	this.init();
};

util.inherits(Playlist, EventEmitter);

extend(Playlist.prototype, {
	init: function() {
		this.list = [];
		this.populate();
	},

	getList: function() {
		return this.list;
	},

	// adds an item to the end of the list
	enqueue: function(animation, quiet) {
		this.list.push(animation);
		this.emit('enqueue', {item: animation, playlist: this});
		if (!quiet) {
			this.emit('change', this);
		}
	},

	move: function(from, to, quiet) {
		// repositions the animation at the specified index to the new index
		if (this.list.length <= from ||
			this.list.length <= to) {
			this.emit('error', {message: 'Invalid list position', from: from, to: to});
			return;
		}
		var animation = this.list[from];
		this.list.splice(to, 0, this.list.splice(from, 1)[0]);
		this.emit('move', {item: animation, playlist: this, from: from, to: to});
		if (!quiet) {
			this.emit('change', this);
		}
	},

	// pops an item from the top of the list, removing it
	pop: function() {
		var top = this.list[0];
		this.list = this.list.slice(1);
		this.emit('pop', {item: top, playlist: this});
		this.populate(true); // do it quietly (no change events)
		this.emit('change', this);
		return top;
	},
	// populate users the current picker to fill the playlist with some animations
	populate: function(quiet) {
		while (this.list.length < 1) {
			this.enqueue(this.picker.select(),quiet);
		}
	},
	setPicker: function(picker) {
		this.picker;
	}
});


module.exports = Playlist;