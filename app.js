// setup web server to serve editor page
// spin up arduino code to send arduino data
// spin up socket.io to serve other applications and talk to editor for live preview
// create animator for running animation code and updating LED values

var GoFLED = require('./gofled'),
	Controller = require('./controller'),
	Animator = require('./animator'),
	Animations = require('./animations'),
	Playlist = require('./playlist'),
	RandomSelector = require('./selectors/random'),
	Display = require('./display'),
	FRAME_RATE = 30,
	intervalDelay = Math.max(Math.floor(1000/FRAME_RATE) - 5,10),
	animator = null,
	anims = null,
	controller = null,
	gofled = null,
	playlist = null;

// lets create the display object
var display = new Display();

// create a buffer to hold our RGB data for streaming to clients
var buffer = [];
for (var i=0; i < display.MAX_LEDS * 3; i++) {
	buffer[i] = 255;
}
//buffer.fill(0);

// pass in buffer to animator
animator = new Animator(buffer,display);
anims = new Animations();
playlist = new Playlist(new RandomSelector(anims));
gofled = new GoFLED({ledCount:display.MAX_LEDS,animator:animator});

// setup controller to orchestrate everything
controller = new Controller({
	animator: animator,
	playlist: playlist,
	animations: anims,
	buffer: buffer
});

function nextFrame() {

	animator.update(controller.data);

	gofled.send(buffer);
	
//	setImmediate(nextFrame);
}
// setup loop for driving this thing
//setImmediate(nextFrame);

setInterval(nextFrame, intervalDelay);

animator.play();