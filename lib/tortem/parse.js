define(function () {
	'use strict';
	var containerMap = new WeakMap();

	function Parser(container) {
		if (containerMap.get(container)) {
			throw new Error('Cannot apply two object to the same element');
		}
	}
	return Parser;
});