define(['./domListener', '../polyfills/setImmediate'], function(DomListener) {
	'use strict';

	var listeners = new WeakMap();

	function Facade(dataStore, prop, container, path, context) {
		this.container = container;
		this.observers = [];
		this.props = [];

		this.getPath = function() {
			var ret = [];
			for (var i = 0, l = this.props.length; i < l; i++) {
				ret.push(path + this.props[i] + '/');
			}
			return ret;
		};

		this.getValue = function() {
			return typeof dataStore[prop] !== 'function' ? dataStore[prop] : dataStore[prop]();
		};

		this.setValue = function(val) {
			if (typeof dataStore !== 'function') {
				dataStore[prop] = val;
			} else {
				dataStore[prop](val);
			}
			context.trigger('change', path + prop, val);
		};

		this.parse = function(container, setter) {
			if (typeof setter !== 'object') {
				setter = path  + (typeof setter !== 'undefined' ? setter + '/' : '');
			} else {
				setter.path = path + prop + '/';
			}

			context.parse(container, setter);
		};

		this.on = function (type, subpath, cb) {
			context.on(type, path + prop + '/' + subpath, cb, true);
		};
		this.trigger = context.trigger;
		this.off = function(type, subpath, cb) {
			context.off(type, path + prop + '/' + subpath, cb);
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