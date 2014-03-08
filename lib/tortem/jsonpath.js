define(function () {
	'use strict';

	function resolve(target, path) {
		var index,
			pathParts = path.match(/([^\/])/g) || [];

		while ( (index = pathParts.shift()) !== undefined) {
			if (typeof target[index] !== 'undefined') {
				target = target[index];
			} else {
				pathParts.unshift(index);
				return {
					match	: target,
					path	: pathParts.join('/')
				};
			}
		}
		return {
			match	: target,
			path	: false
		};
	}

	function create(target, path) {
		var index,
			ret	= target,
			pathParts = path.split('/');

		while ( (index = pathParts.shift()) !== undefined) {
			if (!target[index]) {
				if (pathParts.length === 0) {
					target[index] = null;
				} else if (isNaN(parseInt(pathParts[0], 10))) {
					target[index] = {};
				} else {
					target[index] = [];
				}
			}
			target = target[index];
		}

		return ret;
	}

	return {
		resolve	: resolve,
		create	: create
	};
});