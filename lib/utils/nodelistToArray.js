define(function () {
	'use strict';
	function nodelistToArray(nl) {
		var arr = [];
		for(var i = nl.length; i--; arr.unshift(nl[i]));
		return arr;
	}

	return nodelistToArray;
});