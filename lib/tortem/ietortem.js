define(function () {
	'use strict';

	function _extend(ret, obj) {
		var temp;
		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				console.log(key);
				console.log(Object.prototype.toString.call(obj[key]));
				if (Object.prototype.toString.call(obj[key]) === '[object Array]') {
					console.log('array')
					temp = document.createElement('tArray');
					ret[key] = temp;
					ret.appendChild(temp);
					_extend(temp, obj[key]);
				} else if (typeof obj[key] === 'object') {
					temp = document.createElement('tObject');
					ret[key] = temp;
					ret.appendChild(temp);
					_extend(temp, obj[key]);
				} else {
					ret[key] = obj[key];
				}
			}
		}
	}

	function createObject(obj) {
		var ret = document.createElement('tObject');
		_extend(ret, obj);
		return ret;
	}

	return createObject;
});