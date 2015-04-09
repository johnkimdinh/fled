
var tweenedValues = {
    hue: 0
};

var a = {x:0,y:0}, b = {x:0,y:0},
    aTarget = null, bTarget = null,
    aTween = null, bTween = null;

function getIndex(x,y, display) {
    return x + (y*display.cols);
}

function plot(x, y, c, display, color) {
    var index = getIndex(x,y,display);
    if (index > display.leds.length || index < 0) {
        return;
    }
    //plot the pixel at (x, y) with brightness c (where 0 ≤ c ≤ 1)
    var hsl = color.getHSL();
    hsl.l = c*0.5;
    var col = new Color();
    col.setHSL(hsl.h, hsl.s, hsl.l);
    
    display.setColor(index, col, 'add');
}
     
 
function ipart(x) {
     return ~~x;
}
 
function round(x) {
     return ipart(x + 0.5);
}
 
function fpart(x) {
     return x%1;
}
 
function rfpart(x) {
     return 1 - fpart(x);
}

function line(x0,y0, x1, y1, color, display) {
    var steep = Math.abs(y1 - y0) > Math.abs(x1 - x0),
        tmp;
    if (steep) {
        tmp = x0;
        x0 = y0;
        y0 = tmp;
        tmp = x1;
        x1 = y1;
        y1 = tmp;
    }
    if (x0 > x1) {
        tmp = x0;
        x0 = x1;
        x1 = tmp;
        tmp = y0;
        y0 = y1;
        y1 = tmp;
    }
    var dx = x1 - x0,
        dy = y1 - y0;
        
    var gradient = dy/dx;
    
    var xend = Math.round(x0),
        yend = y0 + gradient * (xend - x0),
        xgap = rfpart(x0 + 0.5),
        xpxl1 = xend,   //this will be used in the main loop
        ypxl1 = ipart(yend);
        
     if (steep) {
         plot(ypxl1,   xpxl1, rfpart(yend) * xgap, display, color);
         plot(ypxl1+1, xpxl1,  fpart(yend) * xgap, display, color);
     } else {
         plot(xpxl1, ypxl1  , rfpart(yend) * xgap, display, color);
         plot(xpxl1, ypxl1+1,  fpart(yend) * xgap, display, color);
     }
     
     var intery = yend + gradient; // first y-intersection for the main loop
 
     // handle second endpoint
     xend = Math.round(x1);
     yend = y1 + gradient * (xend - x1);
     xgap = fpart(x1 + 0.5);
     var xpxl2 = xend, //this will be used in the main loop
        ypxl2 = ipart(yend);
        
     if (steep) {
         plot(ypxl2  , xpxl2, rfpart(yend) * xgap, display, color);
         plot(ypxl2+1, xpxl2,  fpart(yend) * xgap, display, color);
     } else {
         plot(xpxl2, ypxl2,  rfpart(yend) * xgap, display, color);
         plot(xpxl2, ypxl2+1, fpart(yend) * xgap, display, color);
     }
 
     // main loop
 
     for (var x = xpxl1 + 1; x <= xpxl2 - 1; x++) {
         if (steep) {
             plot(ipart(intery)  , x, rfpart(intery), display, color);
             plot(ipart(intery)+1, x,  fpart(intery), display, color);
         } else {
             plot(x, ipart (intery),  rfpart(intery), display, color);
             plot(x, ipart (intery)+1, fpart(intery), display, color);
         }
         intery = intery + gradient;
     }
}

function randomPoint(point) {
    if (!point) {
        point = {x:0, y:0};
    }
    point.x = Math.random()*11;
    point.y = Math.random()*7;
    return point;
}

return {
    updateTween: function(aOrB, reversed) {
        // select random a and b targets
        var target = aOrB == 'a' ? aTarget : bTarget;
        var tween = aOrB == 'a' ? aTween : bTween;
        var src = aOrB == 'a' ? a : b;
        
        tween.from({
            x: target.x,
            y: target.y
        });
        randomPoint(target);
        var duration = 2000+300;
        /*tween.from({
            x: src.x,
            y: src.y
        });*/
        tween.to({
            x: target.x,
            y: target.y
        }, duration);
        
        tween.start();
    },
    startTween: function() {
        
        // select random a and b targets
        aTarget = randomPoint(aTarget);
        bTarget = randomPoint(bTarget);
        
        var duration = 2000+300;
        aTween = new TWEEN.Tween(a)
            .to({
                x: aTarget.x,
                y: aTarget.y
            }, duration);
        aTween.repeat(Infinity);
        aTween.easing(TWEEN.Easing.Cubic.InOut);
        bTween = new TWEEN.Tween(b)
            .to({
                x: bTarget.x,
                y: bTarget.y
            }, duration);
        bTween.repeat(Infinity);
        bTween.easing(TWEEN.Easing.Cubic.InOut);
        
        aTween.onRepeat(this.updateTween.bind(this,'a'));
        bTween.onRepeat(this.updateTween.bind(this,'b'));
        
        this.display.tweens.push(aTween);
        this.display.tweens.push(bTween);
    },
    init: function(display,timeline) {
        this.display = display;
    //debugger;
        display.tween(tweenedValues,{
          to: {hue: 1},
          duration: 5000,
          repeat: Infinity,
          yoyo: true,
          delay: 0,
          easing: TWEEN.Easing.Cubic.InOut
        });
        
        // calculate random a and b points
        randomPoint(a);
        randomPoint(b);
        
        display.clear();
        
        this.startTween();
    },
    onUpdate: function(display, data) {
        var c = null;

        //display.clear();
        
        for (var i=0; i < display.leds.length; ++i) {
            display.leds[i].multiplyScalar(0.94);
        }
        
        var h = ((tweenedValues.hue))%1,
            s = 1,
            l = 0.5;
        var c = new Color();
        c.setHSL(h,s,l);
        // draw the line
        line(a.x,a.y,b.x,b.y, c, display);
        
    }
};