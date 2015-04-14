{"name":"Conways Game Of Life Bloom","filename":"1428972248486.js","author":"Ben","code":"// example code, renders a basic rainbow\r\nvar tweenedValues = {\r\n\ttime: 0\r\n};\r\n\r\nfunction GameOfLife () {\r\n \r\n\tthis.init = function (width,height) {\r\n\t    this.width = width;\r\n\t    this.height = height;\r\n\t\tthis.board = new Array(height);\r\n\t\tfor (var x = 0; x < height; x++) {\r\n\t\t\tthis.board[x] = new Array(width);\r\n\t\t\tfor (var y = 0; y < width; y++) {\r\n\t\t\t\tthis.board[x][y] = Math.round(Math.random()) ? 50 : 0;\r\n\t\t\t}\r\n\t\t}\r\n\t}\r\n \r\n\tthis.nextGen = function() {\r\n\t\tthis.boardNext = new Array(this.board.length);\r\n\t\tfor (var i = 0; i < this.board.length; i++) {\r\n\t\t\tthis.boardNext[i] = new Array(this.board[i].length);\r\n\t\t}\r\n\t\tvar numberAlive = 0, numberChanged = 0;\r\n\t\tfor (var x = 0; x < this.board.length; x++) {\r\n\t\t\tfor (var y = 0; y < this.board[x].length; y++) {\r\n\t\t\t\tvar n = 0;\r\n\t\t\t\tfor (var dx = -1; dx <= 1; dx++) {\r\n\t\t\t\t\tfor (var dy = -1; dy <= 1; dy++) {\r\n\t\t\t\t\t\tif ( dx == 0 && dy == 0){}\r\n\t\t\t\t\t\telse if (typeof this.board[x+dx] !== 'undefined'\r\n\t\t\t\t\t\t\t\t&& typeof this.board[x+dx][y+dy] !== 'undefined'\r\n\t\t\t\t\t\t\t\t&& this.board[x+dx][y+dy]) {\r\n\t\t\t\t\t\t\tn++;\r\n\t\t\t\t\t\t}\r\n\t\t\t\t\t}\t\r\n\t\t\t\t}\r\n\t\t\t\tvar c = this.board[x][y];\r\n\t\t\t\tswitch (n) {\r\n\t\t\t\t\tcase 0:\r\n\t\t\t\t\tcase 1:\r\n\t\t\t\t\t\tc = 0;\r\n\t\t\t\t\t\tbreak;\r\n\t\t\t\t\tcase 2:\r\n\t\t\t\t\t    if (c > 0) {\r\n\t\t\t\t\t        c--;\r\n\t\t\t\t\t    }\r\n\t\t\t\t\t\tbreak; \r\n\t\t\t\t\tcase 3:\r\n\t\t\t\t\t\tc = 50;\r\n\t\t\t\t\t\tbreak;\r\n\t\t\t\t\tdefault:\r\n\t\t\t\t\t\tc = 0;\r\n\t\t\t\t}\r\n\t\t\t\tif (c > 0) {\r\n\t\t\t\t    numberAlive++;\r\n\t\t\t\t}\r\n\t\t\t\t/*if (!((c > 0 && this.board[x][y] > 0) ||\r\n\t\t\t\t    (c == 0 && this.board[x][y] == 0))) {*/\r\n\t\t\t\tif (c!=this.board[x][y]) {\r\n\t\t\t\t    numberChanged++;\r\n\t\t\t\t}\r\n\t\t\t\tthis.boardNext[x][y] = c;\r\n\t\t\t}\r\n\t\t}\r\n\t\tthis.board = this.boardNext.slice();\r\n\t\t// if no cells alive, refresh the board\r\n\t\tif (numberAlive == 0 || numberChanged == 0) {\r\n\t\t    if (!this.resetTimeout) {\r\n    \t\t    this.resetTimeout = setTimeout(function() {\r\n    \t\t        this.init(this.width,this.height);    \r\n    \t\t        this.resetTimeout = null;\r\n    \t\t    }.bind(this),3000);\r\n\t\t    }\r\n\t\t}\r\n\t}\r\n \r\n\tthis.draw = function(display) {\r\n\t\tfor (var x = 0; x < this.board.length; x++) {\r\n\t\t\tfor (var y = 0; y < this.board[x].length; y++) {\r\n\t\t\t    var index = (x*this.width) + y;\r\n\t\t\t    var c = new Color(0x00);\r\n\t\t\t    if (this.board[x][y]) {\r\n\t\t\t        c.setHSL((this.board[x][y]/50),1.0,0.5);\r\n\t\t\t    display.setColor(index, c);\r\n\t\t\t    }\r\n\t\t\t}\r\n\t\t}\r\n\t}\r\n\t\r\n\tthis.start = function(delay,display) {\r\n\t    \r\n      \tvar t = display.tween(tweenedValues,{\r\n          to: {time: 1},\r\n          duration: delay,\r\n          repeat: Infinity,\r\n          yoyo: false,\r\n          delay: 0\r\n          //easing: TWEEN.Easing.Cubic.InOut\r\n        });\r\n        t.onRepeat(this.nextGen.bind(this));\r\n\t}\r\n};\r\n\r\nreturn {\r\n\tinit: function(display,timeline) {\r\n\t    debugger;\r\n\t\tthis.display = display;\r\n        this.game = new GameOfLife();\r\n        this.game.init(52,34);\r\n        this.game.start(100,display);\r\n\t},\r\n\tonUpdate: function(display, data) {\r\n\t    \r\n        for (var i=0; i < display.leds.length; ++i) {\r\n            display.leds[i].multiplyScalar(0.98);\r\n        }\r\n\t    this.game.draw(display);\r\n\t}\r\n};","publish":true,"script":{}}