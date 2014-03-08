define(function () {
	'use strict';
	return (function() {
		var test = {};
		
		try {
			Object.defineProperty(test, '_tortem', {
				writable: true
			});
			return true;
		} catch (e) {
			return false;
		}
	}());
});