define([
	'./hostobjects',
	'./polling'
], function (Hostobjects, polling) {
	'use strict';
	var hasDefineProperty = (function() {
			var test = {};
			
			try {
				Object.defineProperty(test, '_tortem', {
					writable: true
				});
				return true;
			} catch (e) {
				return false;
			}
		}()),
		hObj = new Hostobjects();

	function _isArray(obj) {
		return (Object.prototype.toString.call(obj) === '[object Array]');
	}

	function createModel(data) {
		var ret, oldKeys, testForKey;

		if (typeof data !== 'object') {
			return data;
		}
		if (_isArray(data)) {

			ret = hasDefineProperty ? new hObj.Array() : hObj.document.createElement('tArray');
			for (var i = 0, l = data.length; i < l; i++) {
				ret[i] = createModel(data[i]);
			}
		} else {
			ret = hasDefineProperty ? data : document.createElement('tObject');
			for (var key in data) {
				if (data.hasOwnProperty(key)) {
					ret[key] = createModel(data[key]);
				}
			}
		}

		oldKeys = Object.keys(ret);
		testForKey = function () {
			var changed = false,
				keys = Object.keys(ret);

			for (var i = 0, l = keys.length; i < l; i++) {
				if (oldKeys.indexOf(keys[i]) === -1) {
					ret[keys[i]] = createModel(ret[keys[i]]);
					changed = true;
				}
			}
			if (changed) {
				oldKeys = Object.keys(ret);
			}
		};
		polling(testForKey);
		
		return ret;
	}

	return createModel;
});