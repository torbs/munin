define(['./loglevel', './objObserver', './mutationObserver'], function (log, objObserver) {
	'use strict';

	var setterMap = new WeakMap(),
		observers = new WeakMap();
	
	//log.setLevel('trace');

	function _applySetters(setters) {
		for (var i = 0, l = setters.length; i < l; i++) {
			//todo remove if container not present;
			setters[i].apply();
		}
	}

	function _defineProperty(obj, prop, setters, dataStore) {
		log.info('Creating setter for ['+ prop +']');
		dataStore[prop] = dataStore[prop] || obj[prop]; // if value has been set for instance with an expression use the existing value

		function _get() {
			return dataStore[prop];
		}

		function _set(val) {
			if (dataStore[prop] !== val) {
				log.info('Setting [' + prop + '] to [' + val + '] and run actions');
				dataStore[prop] = val;
				_applySetters(setters);
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

	function _clone(obj) {
		var ret;
		if (Object.prototype.toString.call(obj) === '[object Array]') {
			ret = [];
			for (var i = 0, l = obj.length; i < l; i++) {
				ret[i] = _clone(obj[i]);
			}
		} else if (typeof obj === 'object') {
			ret = {};
			for (var key in obj) {
				ret[key] = _clone(obj[key]);
			}
		} else {
			ret = obj;
		}
		return ret;
	}

	function addSetter(obj, prop, method, dataStore) {
		var setters = setterMap.get(obj),
			promise = [];
		
		function _then(cb) {
			promise.push(cb);
		}

		if (!setters) {
			setters = {};
			setterMap.set(obj, setters);
		}

		if (typeof setters[prop] === 'undefined') {
			setters[prop] = [];
			dataStore[prop] = _clone(obj[prop]);
			_defineProperty(obj, prop, setters[prop], dataStore);
			
			if (Object.prototype.toString.call(obj[prop]) === '[object Array]') {
				objObserver(obj[prop], function (idx, val) {
					dataStore[prop][idx] = _clone(val);
					_applySetters(setters);
					for (var i = 0, l = promise.length; i < l; i++) {
						promise[i]({property: idx, value: val});
					}
				});

			}
		}
		log.info('Adding setter action to [' + prop + ']');
		setters[prop].push(method);

		return {
			then: _then
		};
	}
	
	return addSetter;
});