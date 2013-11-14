// setup web server to serve editor page
// spin up arduino code to send arduino data
// spin up socket.io to serve other applications and talk to editor for live preview
// create animator for running animation code and updating LED values

var Arduino = require('./arduino'),
	Visualizer = require('./visualizer'),
	Animator = require('./animator'),
	Display = require('./display'),
	FRAME_RATE = 30,
	intervalDelay = Math.floor(1000/FRAME_RATE),
	animator = null,
	visualizer = null,
	arduino = null;

// lets create the display object
var display = new Display();

// create a buffer to hold our RGB data for streaming to clients
var buffer = new Buffer(display.MAX_LEDS * 3);
buffer.fill(0);

// pass in buffer to animator
animator = new Animator(buffer,display);
arduino = new Arduino({ledCount:display.MAX_LEDS,animator:animator});
visualizer = new Visualizer(animator);

// setup loop for driving this thing
setInterval(function() {

	animator.update();

	arduino.send(buffer);
	visualizer.send(buffer);

},intervalDelay);

animator.play();