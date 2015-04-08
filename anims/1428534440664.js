{"name":"Latoocarfian Chaos","filename":"1428534440664.js","author":"Ben","code":"//http://www.artsnova.com/latoocarfian-chaotic-function-tutorial.html\r\nvar tweenedValues = {\r\n\tpercent: 0\r\n};\r\n\r\nvar a,b,c,d;\r\nvar Xold, Yold;\r\nvar xnew, ynew;\r\nvar oldX, oldY;\r\nvar mx,my;\r\n\r\nfunction getIndex(display, x,y) {\r\n    return y*display.cols + x;\r\n}\r\nfunction clamp(display, x,y) {\r\n    x = Math.min(display.cols-1, x);\r\n    x = Math.max(0, x);\r\n    y = Math.min(display.rows-1, y);\r\n    y = Math.max(0, y);\r\n    return [x,y];\r\n}\r\nfunction line(display, x0, y0, x1, y1, c){\r\n    var dx = Math.abs(x1-x0);\r\n    var dy = Math.abs(y1-y0);\r\n    var sx = (x0 < x1) ? 1 : -1;\r\n    var sy = (y0 < y1) ? 1 : -1;\r\n    var err = dx-dy;\r\n\r\n    while(true){\r\n        var XY = clamp(display,x0,y0);\r\n        var i = getIndex(display,XY[0],XY[1]);\r\n        display.leds[i].set(c);\r\n        if ((x0==x1) && (y0==y1)) break;\r\n        var e2 = 2*err;\r\n        if (e2 >-dy){ err -= dy; x0  += sx; }\r\n        if (e2 < dx){ err += dx; y0  += sy; }\r\n    }\r\n}\r\n\r\nreturn {\r\n\tinit: function(display,timeline) {\r\n\t\tthis.display = display;\r\n\t\t//debugger;\r\n\t    for (var i=0; i < display.leds.length; i++) {\r\n\t        display.leds[i] = new Color(0x00);\r\n\t    }\r\n        a = (Math.random()*6.0)-3.0; \r\n        b = (Math.random()*6.0)-3.0; \r\n        c = Math.random() + 0.5;\r\n        d = (Math.random() * 2.0) - 0.5;\r\n        Xold= 0.1;   \r\n        Yold = 0.1;\r\n        oldX = 0;\r\n        oldY = 0;\r\n        \r\n        mx = display.cols / 2;\r\n        my = display.rows / 2;\r\n        xnew = Math.sin(Yold*b) + c*Math.sin(Xold*b);\r\n        ynew = Math.sin(Xold*a) + d*Math.sin(Yold*a);\r\n\r\n      \tvar t = display.tween(tweenedValues,{\r\n          to: {percent: 1},\r\n          from: {percent: 0},\r\n          duration: 1000,\r\n          repeat: Infinity,\r\n          yoyo: false,\r\n          delay: 0,\r\n          easing: TWEEN.Easing.Cubic.InOut\r\n        });\r\n        t.onRepeat(function() {\r\n              // set a new target\r\n    \t     Xold = xnew;\r\n    \t     Yold = ynew;\r\n             xnew = Math.sin(Yold*b) + c*Math.sin(Xold*b);\r\n\t         ynew = Math.sin(Xold*a) + d*Math.sin(Yold*a);\r\n          });\r\n\t},\r\n\t\r\n\tonUpdate: function(display, data) {\r\n\t    // fade the old values\r\n\t    for (var i=0; i < display.leds.length; i++) {\r\n\t        display.leds[i].multiplyScalar(0.99);\r\n\t    }\r\n\t    \r\n\t    // interpolate over position\r\n\t    var tmpX = Xold + ((xnew - Xold) * tweenedValues.percent);\r\n\t    var tmpY = Yold + ((ynew - Yold) * tweenedValues.percent);\r\n\t    \r\n\t    var x = mx + Math.floor(tmpX * mx);\r\n\t    var y = my + Math.floor(tmpY * my);\r\n\t    \r\n\t    var XY = clamp(display, x,y);\r\n\t    // set the new ones\r\n\t    var index = XY[1]*display.cols + XY[0];\r\n\t    display.leds[index] = new Color(0xFFFFFF);\r\n\t    //line(display, oldX, oldY, XY[0], XY[1], new Color(0xFFFFFF));\r\n\t    \r\n\t    /*Xold = xnew;\r\n\t    Yold = ynew;\r\n\t    oldX = XY[0];\r\n\t    oldY = XY[1];*/\r\n\t}\r\n};","publish":false,"script":{}}