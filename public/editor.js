var Editor = function(display) {
	this.display = display;
	this.init();
}
Editor.prototype = {
	init: function() {
		var editor = ace.edit("editor");
	    editor.setTheme("ace/theme/monokai");
	    editor.getSession().setMode("ace/mode/javascript");
	    this.codeEditor = editor;

	    var animName = decodeURIComponent((new RegExp('[?|&]anim=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;;
	    socket.on('anim-data', function(data) {
	    	// update ui
	    	$('#animName').val(data.name);
	    	$('#author').val(data.author);
	    	$('#filename').text(data.filename);
	    	editor.setValue(data.code);
	    });
	    socket.emit('get-anim', animName);
	    socket.on('data', function(data) {
	    	$('#data .json-data').text(JSON.stringify(data, undefined, 2));
	    });

	    $('#saveForm').on('submit', function(ev) {
	    	ev.preventDefault();
	    	var animName = $('#animName').val() || 'Untitled';
	    	var author = $('#author').val() || '';
	    	var filename = $('#filename').text();
	    	socket.emit('save-anim', {name: animName, filename: filename, author: author, code: editor.getValue()});
	    });
	}
};