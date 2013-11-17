var request = require('request');

var values = [];

// fill with some data

for (var i=0; i < 256; i++) {
	values.push({
		key: 'Index' + i,
		value: 0
	});
}

var data = {
	name: 'testing',
	data: values
};

setInterval(function() {
	// randomize values
	for (var i=0; i < values.length; i++) {
		values[i].value = Math.random();
	}
	request.post('http://192.168.5.36:80/bar?cmd=set&key=test1&exptime=1000',{
	//request.post('http://localhost:8081/data',{
		json: data
	}, function(err,res) {
		if (err) {
			console.log('Error sending data : ' + err);
			return;
		}
	});
},500);

var values2 = [];

// fill with some data

for (var i=0; i < 256; i++) {
	values2.push({
		key: 'Index' + i,
		value: 0
	});
}

var data2 = {
	name: 'testing2',
	data: values2
};

setInterval(function() {
	// randomize values
	for (var i=0; i < values2.length; i++) {
		values2[i].value = Math.random();
	}
	request.post('http://192.168.5.36:80/bar?cmd=set&key=test2&exptime=1000',{
		json: data2
	}, function(err,res) {
		if (err) {
			console.log('Error sending data : ' + err);
			return;
		}
	});
},200);
var values3 = [];
for (var i=0; i < 256; i++) {
	values3.push({
		key: 'Index' + i,
		value: 0
	});
}

var data3 = {
	name: 'testing3',
	data: values3
};

setInterval(function() {
	// randomize values
	for (var i=0; i < values3.length; i++) {
		values3[i].value = Math.random();
	}
	request.post('http://192.168.5.36:80/bar?cmd=set&key=test3&exptime=1000',{
		json: data3
	}, function(err,res) {
		if (err) {
			console.log('Error sending data : ' + err);
			return;
		}
	});
},100);