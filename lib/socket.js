/* global munin*/
munin.loadSocket = function loadSocket(cb) {
	'use strict';
	var script	= document.createElement('script'),
		first	= document.getElementsByTagName('script')[0];

	script.src = 'http://localhost:8888/socket.io/socket.io.js';
	
	script.onreadystatechange = function () {
		if (this.readyState === 'complete' || this.readyState === 'loaded') {
			script.onreadystatechange = null;
			cb(true);
		}
	};

	script.onerror = cb(false);

	script.onload = function () {
		cb(true);
	};

	first.parentNode.insertBefore(script, first);
};