define([
	'./hostobjects',
	'./dataStore',
	'./event',
	'../utils/nodeTest'
], function (Hostobjects, dataStore, Event, nodeTest) {
	'use strict';

	//TODO use Object.observe if supported

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
		var test = obj;
		return (Object.prototype.toString.call(test) === '[object Array]');
	}

	function createModel(data) {
		var ret;

		if (typeof data !== 'object') {
			return data;
		}

		if (_isArray(data)) {
			ret = hasDefineProperty ? new hObj['Array']() : hObj.document.createElement('tArray');
			for (var i = 0, l = data.length; i < l; i++) {
				ret[i] = createModel(data[i]);
			}
		} else {
			ret = hasDefineProperty ? {} : hObj.document.createElement('tObject');
			for (var key in data) {
				if (data.hasOwnProperty(key)) {
					ret[key] = createModel(data[key]);
				}
			}
		}
		dataStore.set(ret, data);
		
		return ret;
	}

	function Model(data) {
		var ret = createModel(data);
		for (var key in ret) {
			if (ret.hasOwnProperty(key)) {
				this[key] = ret[key];
			}
		}
	}

	Model.prototype = Object.create(Event.prototype);

	Model.prototype.addSetter = function(obj, prop, method, options) {

	};

	return Model;
});