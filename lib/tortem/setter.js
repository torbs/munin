define([
	'./loglevel',
	'../utils/nodeTest',
	'./event',
	'./objObserver',
	'./hostobjects',
	'./model2',
	'./mutationObserver'
], function (log, nodeTest, Event, objObserver, Hostobjects, Model) {
	'use strict';

	var hObj = new Hostobjects();
	
	//log.setLevel('trace');

	function _applySetters(setters) {
		for (var i = 0, l = setters.length; i < l; i++) {
			//todo remove if container not present;
			setters[i].apply();
		}
	}

	function Setter(obj, dataStore) {
		this.obj = obj;
		this.dataStore = dataStore;
		this.changeListeners = {};
		this.addListeners = [];
		this.removeListeners = [];
		this.setters = {};
	}

	Setter.prototype = Object.create(Event.prototype);

	Setter.prototype.onAdd = function(cb) {
		this.addListeners.push(cb);
	};

	Setter.prototype._flushAdd = function(prop, val) {
		for (var i = 0, l = this.addListeners.length; i < l; i++) {
			this.addListeners[i](prop, val);
		}
	};

	Setter.prototype._define = function(prop) {
		var that = this,
			setters = this.setters[prop];

		log.info('Creating setter for ['+ prop +']', this.obj);
		if (typeof this.dataStore[prop] === 'undefined') {
			this.dataStore[prop] = this.obj[prop];
		}

		function _get() {
			return that.dataStore[prop];
		}

		function _set(val) {
			if (that.dataStore[prop] !== val) {
				log.info('Setting [' + prop + '] to [' + val + '] and run actions');

				// For ie8. If dataStore[prop] is an element we have ie8 
				// and should convert val to an element if has another type
				if (nodeTest.isElement(that.dataStore[prop]) && !nodeTest.isElement(val)) {
					val = createModel(val);
				}

				that.dataStore[prop] = val;
				_applySetters(setters);
				that.trigger('change', prop, {prop: prop, val:val});
			}
		}
		
		if (Object.defineProperty) { //todo better element test
			Object.defineProperty(this.obj, prop, {
				set: _set,
				get: _get,
				configurable:true
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

			this._define.call(this, prop);
			
			if (( Object.prototype.toString.call(this.obj[prop]) === '[object Array]') ||
				( nodeTest.isElement(this.obj[prop]) && this.obj[prop].nodeName === 'tArray')) {
				
				that.dataStore[prop] = that.dataStore[prop] || [];
						
				objObserver(this.obj[prop], function (idx, val, type) {
					if (type === 'add') {
						that.dataStore[prop][idx] = new Model(val); // todo not create model z n
						_applySetters(that.setters[prop]);
						that.trigger('add', prop + '/[]', val);
					} else if (type === 'remove') {
						delete that.dataStore[prop][idx];
						_applySetters(that.setters[prop]);
						that.trigger('remove', prop + '/' + idx, val);
					}
				});

			}
		}

		log.info('Adding setter action to [' + prop + ']');
		this.setters[prop].push(method);
	};
	
	return Setter;
});