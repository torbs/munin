/*jshint sub: true */
define([
	'../polyfills/arrayPolyfills'
],function (addPolyfills, polling) {
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
			iframe.style.display = 'none'; //For Opera
			parent.insertBefore(iframe, parent.firstChild);

			cache.push(iframe); // For IE
			return window.frames[name];
		};
	}());

	function HostObjects() {
		var iWin = _createIframeWindow(),
			iDoc = iWin.document,
			eProp = Object.keys(iDoc.createElement('test')),
			pMethod;

		iDoc.write('<script><\/script>'); // add script tag to enable script access of natives

		addPolyfills(iWin.Array);

		function _convertElementToArray(el) {
			var ret = [],
				i = 0;
			while (el[i]) {
				ret.push(el[i]);
				delete el[i];
				i++;
			}
			return ret;
		}

		function _createElementArrayPrototypeMethod(method) {
			return function() {
				if (arguments.length !== 0 && this.nodeName.toLowerCase() === 'tarray') {
					var ret = _convertElementToArray(this);
					Array.prototype[method].apply(ret, arguments);
					for (var i = 0, l = ret.length; i < l; i++) {
						this[i] = ret[i];
					}
					return this;
				}
				return this;
			};
		}

		for (var split = 'join.pop.push.reverse.shift.slice.sort.splice.unshift.map.reduce.forEach.filter.indexOf'.split('.'), length = split.length; length; length--) {
			pMethod = split[length];
			iWin.Element.prototype[pMethod] = _createElementArrayPrototypeMethod(pMethod);
		}
		iWin.Element.prototype.length = 0;

		iWin.Element.prototype.hasOwnProperty = function(key) {
			return Object.prototype.hasOwnProperty.call(this, key);
		};

		var oldCreateElement = iDoc.createElement;
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
						l = i--;
						return i;
					}
				});
			}

			for (i = 0, l = eProp.length; i < l; i++) {
				delete ret[eProp[i]];
			}

			return ret;
		};

		iWin.Array.prototype.toString = function() {
			return 'tortemArray';
		};

		iWin.Object.prototype.toString = function() {
			return 'tortemObject';
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
		this['Element']	= iWin.Element;
		this['document'] = iDoc;
		this['HTMLElement']	= iWin.HTMLElement;
	}

	return HostObjects;
});