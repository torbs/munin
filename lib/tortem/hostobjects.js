/*jshint sub: true */
define([
	'../utils/nodeTest',
	'../polyfills/arrayPolyfills'
],function (nodeTest, addPolyfills) {
	'use strict';

	var doc		= document,
		parent	= doc.body || doc.documentElement;

	var _createIframeWindow = (function () {
		var cache = [];
		return function () {
			var name = 'sandbox' + (+new Date()),
				iframe = doc.createElement('iframe');

			iframe.name = name;
			iframe.id = name;	// needed by ie7 - when using window.frames[name]
			iframe.src='about:blank';
			iframe.style.display = 'none'; //For Opera
			parent.insertBefore(iframe, parent.firstChild);
			
			cache.push(iframe); // For IE
			setImmediate(function () {
				parent.removeChild(iframe);
			});
			return window.frames[name];
		};
	}());

	var arrayMethods = {
		'push': function(val) {
				// todo change val to hostobject

				var that = this,
					ret = Array.prototype.push.apply(this, arguments);
				if (this._observers) {
					for (var i = 0, l = this._observers.length; i < l; i++) {
						this._observers[i]([{
							addedCount: 1,
							index: that.length-1,
							object: that,
							removed: [],
							type: "splice"
						}]);
					}
				}
				return ret;
			},
		'pop': function() {
				var that = this,
					ret = Array.prototype.pop.apply(this, arguments);

				if (this._observers) {
					for (var i = 0, l = this._observers.length; i < l; i++) {
						this._observers[i]([{
							addedCount: 0,
							index: that.length,
							object: that,
							removed: [ret],
							type: "splice"
						}]);
					}
				}
				return ret;
			},
		'splice': function() {
				var that = this,
					ret = Array.prototype.splice.apply(this, arguments);
				
				if (this._observers) {
					for (var i = 0, l = this._observers.length; i < l; i++) {
						this._observers[i]([{
							addedCount: arguments.length > 2 ? arguments.length - 2 : 0,
							index: arguments[0],
							object: that,
							removed: ret,
							type: "splice"
						}]);
					}
				}
				return ret;
			}
	};

	function HostObjects() {
		var iWin = _createIframeWindow(),
			iDoc = iWin.document,
			eProp = Object.keys(iDoc.createElement('test')),
			pMethod,
			HElement;

		iDoc.write('<script><\/script>'); // add script tag to enable script access of natives

		addPolyfills(iWin.Array);

		if (!Array.observe) {
			iWin.Array.prototype.push = arrayMethods.push;

			iWin.Array.prototype.pop = arrayMethods.pop;

			iWin.Array.prototype.splice = arrayMethods.splice;
		}

		function _convertElementToArray(el) {
			var ret = [],
				i = 0;

			while (el[i]) {
				ret.push(el[i]);
				//delete el[i];
				i++;
			}
			return ret;
		}

		function _createElementArrayPrototypeMethod(method) {
			return function() {
				var retValue;
				
				if (this.nodeName.toLowerCase() === 'tarray') {
					var ret = _convertElementToArray(this);
					if (arrayMethods[method]) {
						if (this._observers) {
							ret._observers = this._observers;
						}
						retValue = arrayMethods[method].apply(ret, arguments);
					} else {
						retValue = iWin.Array.prototype[method].apply(ret, arguments);
					}

					for (var i = 0, l = ret.length; i < l; i++) {
						this[i] = ret[i];
					}

					while (this[i]) {
						delete this[i];
						i++;
					}

					return retValue;
				}
			};
		}

		HElement = iWin.HTMLGenericElement || iWin.Element;
		
		for (var split = 'join.pop.push.reverse.shift.slice.sort.splice.unshift.map.reduce.forEach.filter.indexOf'.split('.'), length = split.length; length; length--) {
			pMethod = split[length];
			HElement.prototype[pMethod] = _createElementArrayPrototypeMethod(pMethod);
		}

		HElement.prototype.length = 0;

		HElement.prototype.hasOwnProperty = function(key) {
			if (eProp.indexOf(key) !== -1) {
				return false;
			}
			return Object.prototype.hasOwnProperty.call(this, key);
		};

		function cleanObject(obj) {
			for (i = 0, l = eProp.length; i < l; i++) {
				delete obj[eProp[i]];
			}
			return obj;
		}

		var oldCreateElement = iDoc.createElement,
			ieCache = [];
		iDoc.createElement = function(type) {
			var l = 0,
				ret = oldCreateElement.call(iDoc, type);
			
			if (type === 'tArray') {
				Object.defineProperty(ret, 'length', {
					set: function(val) {
						l = val;
					},
					get: function() {
						var i = 0;
						while (ret[i++]) {}
						l = i-1;
						return l;
					}
				});
			}

			cleanObject(ret);
			return ret;
		};

		this['Array']	= iWin.Array;
		this['Boolean']	= iWin.Boolean;
		this['Date']	= iWin.Date;
		this['Function']= iWin.Function;
		this['Object']	= iWin.Object;
		this['Number']	= iWin.Number;
		this['RegExp']	= iWin.RegExp;
		this['String']	= iWin.String;
		this['Node']	= iWin.Node;
		this['Element']	= HElement;
		this['document'] = iDoc;
		this['HTMLElement']	= iWin.HTMLElement;
		this.cleanObject = cleanObject;
	}

	return HostObjects;
});