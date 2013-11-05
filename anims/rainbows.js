var tweenedValues = {
	hue: 0
};

return {
	init: function(display,timeline) {
		var black = new Display.Color(0x00);
		for (var i=0; i < display.leds.length; i++) {
			display.leds[i] = black;
		}

      	display.tween(tweenedValues,{
          to: {hue: 1},
          duration: 5000,
          repeat: Infinity,
          yoyo: true,
          delay: 0,
          easing: TWEEN.Easing.Cubic.InOut
        });
	},
	onUpdate: function(display) {
		var c = null;

		for (var i=0; i < display.leds.length; i++) {

			c = new THREE.Color(0x0);
			h = ((tweenedValues.hue) + (i/display.leds.length))%1;
			s = 1.0;
			l = 0.5;
			c.setHSL( h,s,l );
			display.setColor(i, c);
		}
	}
};
