var tweenedValues = {
	hue: 0,
	position: 0
};

return {
	init: function(display,timeline) {
		var black = new Display.Color(0x00);
		this.display = display;
		for (var i=0; i < display.leds.length; i++) {
			display.leds[i] = black;
		}

      	display.tween(tweenedValues,{
          to: {hue: 360},
          duration: 5000,
          repeat: Infinity,
          yoyo: true,
          delay: 0,
          easing: TWEEN.Easing.Cubic.InOut
        });
      	display.tween(tweenedValues,{
          to: {position: 1},
          duration: 30000,
          repeat: Infinity,
          yoyo: true,
          delay: 0
        });
	},
	onUpdate: function(display) {
		var c = null;

		for (var i=0; i < display.leds.length; i++) {
			var x = i%display.cols,
				y = Math.floor(i/display.cols);
			c = Color();
			var h = ((tweenedValues.hue) + (y/display.rows)*360)%360,
				s = 100,
				l = 50;
			c.hsl( h,s,l );
			display.setColor(i, c);
		}
	}
};
