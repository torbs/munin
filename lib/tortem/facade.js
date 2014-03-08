define(['./domListener'], function(DomListener) {
	'use strict';

	var listeners = new WeakMap();

	function Facade(dataStore, prop, container) {
		this.container = container;
	
		this.getValue = function() {
			return typeof dataStore[prop] !== 'function' ? dataStore[prop] : dataStore[prop]();
		};

		this.setValue = function(val) {
			if (typeof dataStore !== 'function') {
				dataStore[prop] = val;
			} else {
				dataStore[prop](val);
			}
		};
	}

	Facade.prototype.addDomListener = function (type, cb) {
		listeners.set(cb, new DomListener(this.container, type, cb));
	};

	return Facade;
});