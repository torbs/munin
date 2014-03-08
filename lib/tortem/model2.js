define([
	'./hostobjects'
], function (Hostobjects) {
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

	function _createFakeObject() {
		var ret = hObj.document.createElement('cObject');
		return ret;
	}

	function createModel(data) {
		var ret;

		if (typeof data !== 'object') {
			return data;
		}
		if (_isArray(data)) {

			ret = hasDefineProperty ? new hObj.Array() : hObj.document.createElement('tArray');
			for (var i = 0, l = data.length; i < l; i++) {
				ret[i] = createModel(data[i]);
			}
		} else {
			ret = hasDefineProperty ? data : _createFakeObject();
			for (var key in data) {
				if (data.hasOwnProperty(key)) {
					ret[key] = createModel(data[key]);
				}
			}
		}
		
		return ret;
	}

	return createModel;
});