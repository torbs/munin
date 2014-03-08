define([
	'../utils/nodelistToArray',
	'../utils/hasDefineProperty',
	'../utils/nodeTest',
	'./methods/text',
	'./methods/forEach',
	'./polling',
	'./model',
	'./mutationObserver'
], function (nodelistToArray, hasDefineProperty, nodeTest, text, forEach, polling, createModel) {
	'use strict';

	var  methods = {
			text: text,
			forEach: forEach
		},
		methodKeys = Object.keys(methods),
		pattern = new RegExp('(' + methodKeys.join('|') + '):?([^,]*),?', 'g');

// /([^:]+):?([^,]*),?/g
	function Context(data) {
		this._data = data;
		this._currentLevel = data;
		this._currentProperty = false;
		this._parentLevel = [];
		this._container = false;
		this._currentSetters = {};
		this._parentSetters = [];
		this._setterMethods = {};

		this._cid = 0;
		this._sid = 0;
	}

	Context.prototype.setDataToProperty = function (key) {
		if (typeof this._currentLevel[key] === 'undefined') {
			return false;
		}

		this._parentLevel.push(this._currentLevel);
		this._currentLevel = this._currentLevel[key];

		this._parentSetters.push(this._currentSetters);
		this._currentSetters[key] = this._currentSetters[key] || {};
		this._currentSetters = this._currentSetters[key];
	};
	
	Context.prototype.setDataToParent = function() {
		if (this._parentLevel.length !== 0) {
			this._currentLevel = this._parentLevel.pop();
			this._currentSetters = this._parentSetters.pop();
		}
	};
	
	Context.prototype.getModel = function() {
		return this._currentLevel;
	};
	
	Context.prototype.hasProperty = function(prop) {
		return typeof this._currentLevel[prop] !== 'undefined';
	};

	Context.prototype.parseTortemAttributes = function() {
		var container	= this._container,
			attr		= container.getAttribute ? container.getAttribute('data-tortem') : null,
			method, children, expr, key, prop;

		if (attr !== null) {
			while ((expr = pattern.exec(attr)) !== null) {
				key = expr[1];
				prop = expr[2] !== '$data' ? expr[2] : this._currentProperty;

				if (methods[key]) {
					// todo expressions
					this._currentProperty = prop;
					method = methods[key](this);
					
					this.add.call(this, {
						property: prop,
						method: method
					});
				}
			}
			
		} else if (container.hasChildNodes()) {
			children = nodelistToArray(container.childNodes);
			for (var i = 0, l = children.length; i < l; i++) {
				this._container = children[i];
				this.parseTortemAttributes.call(this);
			}
			this._container = container;
		}
	};
	
	Context.prototype.parse = function() {
		var container = this._container;

		if (container.nodeType !== 1 && container.nodeType !== 11) {
			return;
		}

		var parent = container.parentNode,
			nextSibling, fragment;

		if (parent !== null) {
			nextSibling = container.nextSibling;
			fragment	= document.createDocumentFragment();
			fragment.appendChild(container);
		}

		this.parseTortemAttributes.call(this);

		if (parent !== null) {
			parent.insertBefore(container, nextSibling);
		}
	};
	
	Context.prototype.setContainer = function(container) {
		this._container = container;
	};
	
	Context.prototype.getContainer = function() {
		return this._container;
	};

	Context.prototype.defineProperty = function(prop) {
		var that	= this,
			setters = this._currentSetters,
			data	= this._currentLevel,
			sid;
		
		if (typeof setters[prop] !== 'undefined') {
			return false;
		}

		function _applySetters() {
			for (var key in setters[prop]._containers) {
				if (setters[prop]._containers.hasOwnProperty(key)) {
					sid = setters[prop]._containers[key];
					if (that._setterMethods[key][sid]) {
						that._setterMethods[key][sid]();
					} else {
						delete setters[prop]._containers[key];
					}
				}
			}
		}

		setters[prop] = {
			_containers: {},
			_elements: new WeakMap(),
			_value: data[prop],
			_getFn: function () {
				return setters[prop]._value;
			},
			_setFn: function(val) {
				if (setters[prop]._value !== val) {
					setters[prop]._value = val;
					_applySetters();
				}
			}
		};
		
		if (Object.defineProperty) { //todo better element test
			Object.defineProperty(data, prop, {
				set: setters[prop]._setFn,
				get: setters[prop]._getFn
			});
		} else if (data.__defineGetter__) {
			this._currentLevel.__defineGetter__(prop, setters[prop]._getFN);
			this._currentLevel.__defineSetter__(prop, setters[prop]._setFN);
		} else {
			throw new Error('Your browser is not supported');
			//todo? ie7 onpropertychange
		}
	};

	Context.prototype.addSetter = function(prop, method) {
		this._sid++;

		var container = this._container,
			currentSetter = this._currentSetters,
			curId = container._tortemId,
			curSid = this._sid;

		this.defineProperty.call(this, prop);

		if (!curId) {
			this._cid++;
			curId = this._cid;
			container._tortemId = curId;
		}

		currentSetter[prop]._elements.set(container, curSid);
		currentSetter[prop]._containers[curId] = curSid;

		this._setterMethods[curId] = this._setterMethods[curId] || {};
		this._setterMethods[curId][curSid] = function () {
			method(currentSetter[prop]._value);
		};
	};

	Context.prototype.getProperty = function() {
		return this._currentProperty;
	};

	Context.prototype.setProperty = function(prop) {
		this._currentProperty = prop;
	};

	Context.prototype.createDomListener = function(container, observerType, cb) {
		var currentSetter	= this._currentSetters,
			prop			= this._currentProperty,
			mObserver, type, value;

		if (!container && !observerType && !cb) {
			throw new Error('Missing arguments for createDomListener. Need "container", "type" and "callback"');
		}
		if (typeof observerType === 'string') {
			type = {};
			type[observerType] = cb;
		} else {
			type = observerType;
		}

		if (MutationObserver) {
			mObserver = new MutationObserver(function (mutations) {
				mutations.forEach(function (record) {
					if (record.type in type) {
						value = type[record.type]();
						if (typeof value !== 'undefined') {
							currentSetter[prop]._value = value;
						}
					}
				});
			});

			mObserver.observe(container, {
				attributes		: 'attributes' in type,
				subtree			: 'subtree' in type,
				childList		: 'childList' in type,
				characterData	: 'characterData' in type
			});
		}
	};

	Context.prototype.add = function (config) {
		var that = this,
			model = this.getModel(),
			properties = ['_container', '_currentSetters', '_currentLevel', '_currentProperty'],
			original = {},
			temp = {},
			i, l;

		if (this.hasProperty(config.property)) {
			this.addSetter.call(this, config.property, config.method);
			config.method(model[config.property]);
		} else {
			// Store values because they can have changed when the callback is triggered
			for (i = 0, l = properties.length; i < l; i++) {
				temp[properties[i]] = this[properties[i]];
			}

			var testForKey = function () {
				var keys = Object.keys(model);

				if (keys.indexOf(config.property)) {
					
					// Store original properties and insert properties from when the method was called
					for (i = 0, l = properties.length; i < l; i++) {
						original[properties[i]] = that[properties[i]];
						that[properties[i]] = temp[properties[i]];
					}

					that.addSetter.call(that, config.property, config.method);
					config.method(model[config.property]);
					polling.remove(testForKey);

					// Restore properties
					for (i = 0, l = properties.length; i < l; i++) {
						that[properties[i]] = original[properties[i]];
					}
				}
			};
			polling(testForKey);
		}
		
	};

	return Context;
});