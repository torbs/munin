define(function () {
	'use strict';
	var dataMap = new WeakMap();

	function DataStore(obj) {
		if (typeof obj !== 'object') {
			throw new Error('Data store expect an object');
		}
		
		if (Object.prototype.toString.call(obj) === '[object Array]') {
			for (var i = 0, l = obj.length; i < l; i++) {
				this[i] = obj[i];
			}
		}
		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				this[key] = obj[key];
			}
		}
	}

	function set(obj, data) {
		var dataStore = new DataStore(data || obj);
		dataMap.set(obj, dataStore);
		return dataStore;
	}

	function get(obj) {
		var dataStore = dataMap.get(obj);

		if (!dataStore) {
			dataStore = set(obj);
			dataMap.set(obj, dataStore);
		}
		
		return dataStore;
	}
	
	return {
		get: get,
		set: set
	};
});