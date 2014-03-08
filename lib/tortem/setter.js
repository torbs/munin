define(['./loglevel'], function (log) {
	'use strict';

	var setterMap = new WeakMap();
	
	log.setLevel('trace');

	function addSetter(obj, prop, method, dataStore) {
		var setters = setterMap.get(obj);

		if (!setters) {
			setters = {};
			setterMap.set(obj);
		}

		if (typeof setters[prop] === 'undefined') {
			setters[prop] = [];
			_defineProperty(obj, prop, setters[prop], dataStore);
		}
		log.info('Adding setter action to [' + prop + ']');
		setters[prop].push(method);
	}

	function _defineProperty(obj, prop, setters, dataStore) {
		log.info('Creating setter for ['+ prop +']');
		dataStore[prop] = dataStore[prop] || obj[prop]; // if value has been set for instance with an expression use the existing value
		
		function _applySetters() {
			for (var i = 0, l = setters.length; i < l; i++) {
				//todo remove if container not present;
				setters[i].apply();
			}
		}

		function _get() {
			return dataStore[prop];
		}

		function _set(val) {
			if (dataStore[prop] !== val) {
				log.info('Setting [' + prop + '] to [' + val + '] and run actions');
				dataStore[prop] = val;
				_applySetters();
			}
		}
		
		if (Object.defineProperty) { //todo better element test
			Object.defineProperty(obj, prop, {
				set: _set,
				get: _get
			});
		} else if (data.__defineGetter__) {
			obj.__defineGetter__(prop, _get);
			obj.__defineSetter__(prop, _set);
		} else {
			throw new Error('Your browser is not supported');
			//todo? ie7 onpropertychange
		}
	}
	
	return addSetter;
});