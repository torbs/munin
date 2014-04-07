define(['./domListener', '../polyfills/setImmediate'], function(DomListener) {
	'use strict';

	var listeners = new WeakMap();

	function Facade(dataStore, prop, container, path, context) {
		this.container = container;
		this.observers = [];

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

		this.parse = function(container, setter) {
			if (typeof setter !== 'object') {
				setter = prop + '/' + (typeof setter !== 'undefined' ? setter + '/' : '');	
			}
			context.parse(container, setter);
		};
	}

	Facade.prototype.listen = function(obj, type, cb) {
			
	};

	Facade.prototype.observe = function(cb) {
		this.observers.push(cb);
	};

	Facade.prototype.addDomListener = function (type, cb) {
		var that = this;
		setImmediate(function () {
			listeners.set(cb, new DomListener(that.container, type, cb));
		});
	};

	return Facade;
});