define(function () {
	'use strict';

	function resolve(target, path) {
		var index,
			pathParts = path.match(/([^\/]+)/g) || [],
			i = 0;


		while ( (index = pathParts.shift()) !== undefined) {
			i++;
			if (i === 10) break;
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

function resolve2(target, path) {
	console.log('here');
		var index,
			pathParts = path.match(/([^\/]+)/g) || [],
			i = 0;
			console.log('here')
			console.log(path)
console.log(pathParts);
		while ( (index = pathParts.shift()) !== undefined || i < 10) {
			i++;
			console.log(i);
			console.log(index);
			console.log('json')
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
		resolve2:resolve2,
		resolve	: resolve,
		create	: create
	};
});