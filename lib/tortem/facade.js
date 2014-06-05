define(['./domListener', '../polyfills/setImmediate'], function(DomListener) {
	'use strict';

	//var listeners = new WeakMap();

	function Facade(dataStore, prop, container, path, context) {
		this.container = container;
		this.observers = [];
		this.props = [];

		this.getProps = function() {
			var ret = [];
			for (var i = 0, l = this.props.length; i < l; i++) {
				ret.push(this.props[i]);
			}
			return ret;
		};

		this.getPath = function() {
			return path;
		};

		this.getValue = function() {
			return typeof dataStore[prop] !== 'function' ? dataStore[prop] : dataStore[prop]();
		};

		this.setValue = function(val, sub) {
			var dStore = dataStore,
				currentProp = sub || prop;
			
			if (typeof dStore[currentProp] !== 'function') {
				dStore[currentProp] = val;
			} else {
				dStore[currentProp](val);
			}
			context.trigger('change', path + currentProp, val);
		};

		this.renderTo = function(container, template, root) {
			context.renderTo(container, template, root);
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
			context.on(type, path + subpath, cb, true);
		};
		this.trigger = context.trigger;
		this.off = function(type, subpath, cb) {
			context.off(type, path + subpath, cb);
		};
	}

	Facade.prototype.listen = function(obj, type, cb) {
			
	};

	Facade.prototype.observe = function(cb) {
		this.observers.push(cb);
	};

	Facade.prototype.addDomListener = function (type, cb, el) {
		var that = this;
		setImmediate(function () {
			//listeners.set(cb, new DomListener(that.container, type, cb));
			new DomListener(that.container, type, cb);
			if (el) {
				new DomListener(el, type, cb);
			}
		});
	};

	return Facade;
});