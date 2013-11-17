var Editor = function() {
	this.init();
};
Editor.prototype = {
	initEditor: function() {
		var editor = ace.edit("editor");
		editor.setTheme("ace/theme/monokai");
		editor.getSession().setMode("ace/mode/javascript");
		this.editor = editor;
	},
	initSocket: function() {
		var socket = io.connect();
		this.socket = socket;
		socket.on('anim-data', function(data) {
			that.setAnim(data);
		});
		socket.on('anim-saved', function(data) {
			that.setAnim(data);
		});
		var that = this;
		socket.on('data', function(data) {
			$('#data .json-data').text(JSON.stringify(data, undefined, 2));
			that.data = data;
		});
		var animName = decodeURIComponent((new RegExp('[?|&]anim=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
		if (animName) {
			socket.emit('get-anim', animName);
		}
		socket.on('variables', function(variables) {
			that.updateVariables(variables);
		});
		// request list of data variables
		socket.emit('request-variables');
	},
	updateVariables: function(variables) {
		// get template
		var templateText = $('#variableTemplate').html();
		var accordion = $('#variableAccordion');
		accordion.empty();
		for (var i=0; i < variables.length; i++) {
			var variable = variables[i];
			var entry = $(templateText);
			var title = entry.find('.variable-title');
			title.attr('href', '#variable_' + variable);
			title.text(variable);
			var panel = entry.find('#variable');
			panel.attr('id', 'variable_' + variable);
			accordion.append(entry);
		}
	},
	setAnim: function(data) {
		// update ui
		$('#animName').val(data.name);
		$('#author').val(data.author);
		$('#filename').text(data.filename);
		$('#requiredData').val(JSON.stringify(data.required));
		this.editor.setValue(data.code);
	},
	initDisplay: function() {
		var display = new Display();
		this.display = display;
		this.viewer = new Viewer();
		this.viewer.initDisplay(display.config);
	},
	addListeners: function() {
		var that = this;
		$('#saveForm').on('submit', function(ev) {
			ev.preventDefault();
			that.onSave();
		});
		$('#preview').on('click', function(ev) {
			ev.preventDefault();
			that.onPreview();
		});
	},
	checkRequired: function() {
		var required = this.parseRequiredData();
		for (var i=0; i < required.length; i++) {
			var requiredString = required[i];
			// split into paths and check on data object
			var paths = requiredString.split('.');
			var obj = this.data;
			for (var j=0; j < paths.length; j++) {
				if (typeof obj[paths[j]] === 'undefined') {
					return false;
				}
				obj = obj[paths[j]];
			}
		}
		return true;
	},
	onPreview: function() {
		if (this.animInterval) {
			clearInterval(this.animInterval);
			this.animInterval = null;
		}
		if (!this.checkRequired()) {
			var el = $('#requiredData');
			el.clearQueue();
			el.css('background-color', '#FF9999');
			el.animate({'backgroundColor': '#FFFFFF'},2000);
			return;
		}
		// load code, execute it
		var code = this.editor.getValue();

		var wrappedCode = "val = function() { " + code + " }";
		var anim = null;
		try {
			anim = eval(wrappedCode)();
		} catch (ex) {
			console.log('Error: ' + ex.stack);
			return;
		}
		anim.init(this.display);
		this.anim = anim;

		var startTime = Date.now();
		var that = this;
		// take code, execute it, update Preview window
		this.animInterval = setInterval(function() {
			var elapsed = Date.now() - startTime;
			// update tweens and display state
			that.display.update(startTime + elapsed);

			that.anim.onUpdate(that.display,that.data);

			// copy led color values into buffer
			var ledBuffer = [],
				leds = that.display.leds;

			var index = 0, led = null;
			for (var i=0; i < leds.length; ++i) {
				index = i*3;
				led = leds[i];

				led.r = Math.min(1,led.r);
				led.g = Math.min(1,led.g);
				led.b = Math.min(1,led.b);
				led.r = Math.max(0,led.r);
				led.g = Math.max(0,led.g);
				led.b = Math.max(0,led.b);
				
				ledBuffer[index] = Math.round(led.r*255);
				ledBuffer[index+1] = Math.round(led.g*255);
				ledBuffer[index+2] = Math.round(led.b*255);
			}

			that.viewer.update(ledBuffer);

		},Math.floor(1000/30));

		this.display.play();
	},
	parseRequiredData: function() {
		var data = $('#requiredData').val();
		var requiredData = [];
		if (data!=='') {
			try {
				data = data.replace(/'/g, '"');
				requiredData = JSON.parse(data);
				if ( Object.prototype.toString.call( requiredData ) !== '[object Array]') {
					throw Exception();
				}
			} catch(ex) {
				var el = $('#requiredData');
				el.clearQueue();
				el.css('background-color', '#FF9999');
				el.animate({'backgroundColor': '#FFFFFF'},2000);
				return false;
			}
		}
		return requiredData;
	},
	onSave: function() {
		var animName = $('#animName').val();
		var author = $('#author').val();
		var filename = $('#filename').text();
		var el = null;
		if (!animName) {
			el = $('#animName');
			el.clearQueue();
			el.css('background-color', '#FF9999');
			el.animate({'backgroundColor': '#FFFFFF'},2000);
			return;
		}
		if (!author) {
			el = $('#author');
			el.clearQueue();
			el.css('background-color', '#FF9999');
			el.animate({'backgroundColor': '#FFFFFF'},2000);
			return;
		}
		// attempt to parse required data parameter
		var data = this.parseRequiredData();
		if (data===false) {
			return;
		}
		this.socket.emit('save-anim', {name: animName, filename: filename, author: author, required: data, code: this.editor.getValue()});
	},
	init: function() {
		this.initEditor();
		
		this.initSocket();

		this.initDisplay();

		this.addListeners();
	}
};