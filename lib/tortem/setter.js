define(['./loglevel', './objObserver', './mutationObserver'], function (log, objObserver) {
	'use strict';

	var setterMap = new WeakMap(),
		observers = new WeakMap();
	
	log.setLevel('trace');

	function _applySetters(setters) {
		for (var i = 0, l = setters.length; i < l; i++) {
			//todo remove if container not present;
			console.log(setters[i]);
			setters[i].apply();
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

	function Setter(obj, dataStore) {
		this.obj = obj;
		this.dataStore = dataStore;
		this.changeListeners = {};
		this.addListeners = [];
		this.removeListeners = [];
		this.setters = {};
	}

	Setter.prototype.onChange = function(prop, cb) {
		this.changeListeners[prop] = this.changeListeners[prop] || [];
		this.changeListeners[prop].push(cb);
	};

	Setter.prototype.onAdd = function(cb) {
		this.addListeners.push(cb);
	};

	Setter.prototype.onRemove = function(cb) {
		this.removeListeners.push(cb);
	};

	Setter.prototype._flushChange = function(prop, val) {
		log.info('Change event for prop: "' + prop + '" with value:', val);
		for (var i = 0, l = this.changeListeners[prop].length; i < l; i++) {
			this.changeListeners[prop][i](prop, val);
		}
	};

	Setter.prototype._flushAdd = function(prop, val) {
		for (var i = 0, l = this.addListeners.length; i < l; i++) {
			this.addListeners[i](prop, val);
		}
	};

	Setter.prototype._flushRemove = function(prop, val) {
		for (var i = 0, l = this.removeListeners.length; i < l; i++) {
			this.removeListeners[i](prop, val);
		}
	};

	Setter.prototype._define = function(prop) {
		var that = this,
			setters = this.setters[prop];

		log.info('Creating setter for ['+ prop +']', this.obj);
		this.dataStore[prop] = this.dataStore[prop] || this.obj[prop]; // if value has been set for instance with an expression use the existing value

		function _get() {
			return that.dataStore[prop];
		}

		function _set(val) {
			if (that.dataStore[prop] !== val) {
				log.info('Setting [' + prop + '] to [' + val + '] and run actions');
				that.dataStore[prop] = val;
				_applySetters(setters);
				that._flushChange(prop, val);
			}
		}
		
		if (Object.defineProperty) { //todo better element test
			Object.defineProperty(this.obj, prop, {
				set: _set,
				get: _get
			});
		} else if (data.__defineGetter__) {
			this.obj.__defineGetter__(prop, _get);
			this.obj.__defineSetter__(prop, _set);
		} else {
			throw new Error('Your browser is not supported');
			//todo? ie7 onpropertychange
		}
	};

	Setter.prototype.add = function(prop, method) {
		var that = this;
		if (typeof this.setters[prop] === 'undefined') {
			this.setters[prop] = [];
			this.dataStore[prop] = _clone(this.obj[prop]);
			//_defineProperty(obj, prop, setters[prop], dataStore);
			this._define.call(this, prop);

			if (Object.prototype.toString.call(this.obj[prop]) === '[object Array]') {
				objObserver(this.obj[prop], function (idx, val, type) {
					if (type === 'add') {
						that.dataStore[prop][idx] = _clone(val);
						_applySetters(that.setters[prop]);
						that._flushAdd.call(that, prop + '/[]', val);
					} else if (type === 'remove') {
						delete that.dataStore[prop][idx];
						_applySetters(that.setters[prop]);
						that._flushRemove.call(that, prop + '/' + idx, val);
					} else if (type === 'change') {
						that.dataStore[prop][idx] = _clone(val);
						_applySetters(that.setters[prop]);
						that._flushChange.call(that, prop + '/' + idx, val);
					}
					
				});

			}
		}

		log.info('Adding setter action to [' + prop + ']');
		this.setters[prop].push(method);
	};
	
	return Setter;
});