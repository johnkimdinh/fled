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
		// setup listeners for global variables
		socket.on('variables', function(variables) {
			that.updateVariables(variables);
		});
		// request list of data variables
		socket.emit('request-variables');

		socket.on('anim-data', function(data) {
			that.setAnim(data);
		});
		socket.on('anim-saved', function(data) {
			that.setAnim(data);
		});
		var that = this;
		socket.on('data', function(data) {
			// update UI
			for (var variable in data) {
				$('#variable_' + variable).find('.json-data').text(JSON.stringify(data[variable], undefined, 2));
			}
			that.data = data;
		});
		
		var animName = decodeURIComponent((new RegExp('[?|&]anim=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
		if (animName) {
			socket.emit('get-anim', animName);
		}
	},
	updateUI: function() {
		// update variable ui
		if (this.variables) {
			var templateText = $('#variableTemplate').html();
			var accordion = $('#variableAccordion');
			accordion.empty();
			var variables = this.variables;
			for (var i=0; i < variables.length; i++) {
				var variable = variables[i];
				var entry = $(templateText);
				var title = entry.find('.variable-title');
				title.attr('href', '#variable_' + variable);
				title.text(variable);
				title.data('variable', variable);
				var panel = entry.find('#variable');
				panel.attr('id', 'variable_' + variable);
				accordion.append(entry);
				title.data('required', false);
				if (this.anim) {
					if (this.anim.required[variable]) {
						entry.find('.variable-required').attr('checked', 'checked');
						title.data('required', true);
					}
				}
			}
		}
		if (this.anim) {
			// update ui
			$('#animName').val(this.anim.name);
			$('#author').val(this.anim.author);
			$('#filename').text(this.anim.filename);
			if (this.anim.code) {
				this.editor.setValue(this.anim.code);
			}
		}
	},
	subscribeVariables: function() {
		var required = this.anim.required;
		for (var variable in required) {
			if (!required.hasOwnProperty(variable)) {
				continue;
			}

			this.socket.emit('variable-subscribe', variable);
		}
	},
	updateVariables: function(variables) {
		this.variables = variables;
		this.updateUI();
	},
	setAnim: function(data) {
		this.anim = data;
		this.subscribeVariables();
		this.updateUI();
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
		$('#variableAccordion').on('change','.variable-required', function(ev) {
			var variablePanel = $(ev.target).closest('.panel');
			var variableTitle = variablePanel.find('.variable-title');
			var checked = $(ev.target).is(':checked');
			variableTitle.data('required', checked);
			var name = variableTitle.data('variable');
			if (checked) {
				that.anim.required[name] = true;
				that.socket.emit('variable-subscribe', name);
			} else {
				that.anim.required[name] = null;
				delete that.anim.required[name];
				// unsubscribe
				that.socket.emit('variable-unsubscribe', name);
			}
		});
	},
	onPreview: function() {
		if (this.animInterval) {
			clearInterval(this.animInterval);
			this.animInterval = null;
		}
		// load code, execute it
		var code = this.editor.getValue();

		var wrappedCode = "val = function() { " + code + " }";
		var anim = null;
		try {
			anim = eval(wrappedCode)();
		} catch (ex) {
			var el = $('#preview');
			el.clearQueue();
			el.css('background-color', '#FF9999');
			el.animate({'backgroundColor': '#EBEBEB'},2000);
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
		this.socket.emit('save-anim', {name: animName, filename: filename, author: author, required: this.anim.required, code: this.editor.getValue()});
	},
	init: function() {
		this.anim = {name: '', author: '', required: {}};
		
		this.initEditor();
		
		this.initSocket();

		this.initDisplay();

		this.addListeners();
	}
};
