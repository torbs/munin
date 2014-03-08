define([
	'./polyfills/arrayPolyfills',
	'./tortem/context',
	'./tortem/model',
	'./tortem/parse',
	'./utils/hasDefineProperty',
	'./utils/nodeTest'
],function (addPolyfills, Context, model, parse, hasDefineProperty, nodeTest) {
	'use strict';

	addPolyfills(Array);

	function _returnArray(arr) {
		switch (arr.length) {
			case 0:
				return null;
			case 1:
				return arr[0];
			default:
				return arr.slice(0);
		}
	}

	function Tortem(obj) {
		this._elements	= [];
		this._template	= {};
		this.model		= model(obj || {});
		this._context	= new Context(this.model);
	}

	Tortem.prototype.apply = function (container) {
		// todo support array/nodeList
		//todo support templates in document
		if (typeof container === 'undefined' || nodeTest.isNode(container) === false) {
			throw new Error('Invalid argument. Expected an element');
		}
		
		var template = this._template.main.cloneNode(true);
		this._context.setContainer(template);
		this._context.parse();
		
		container.appendChild(template);
		
		return this;
	};

	Tortem.prototype.addTemplate = function(template, _partial) {
		var name = _partial || 'main',
			target = this._template,
			tempEl;

		if (typeof template === 'string') {
			target[name] = document.createDocumentFragment();
			tempEl = document.createElement('div');
			try {
				tempEl.innerHTML = template;
				while (tempEl.hasChildNodes()) {
					target[name].appendChild(tempEl.firstChild);
				}
			} catch(e) {
				throw new Error('Failed parsing template');
			}
		} else if (nodeTest.isNode(template)) {
			target[name] = template;
		} else if (typeof template === 'object') {
			for (var key in template) {
				if (template.hasOwnProperty(key)) {
					this.addTemplate.call(this, template[key], key);
				}
			}
		}
		return this;
	};

	Tortem.prototype.removeTemplate = function(path) {
		var ret;

		ret = this._templates.main;
		delete this._templates.main;
	};

	Tortem.prototype.addElement = function (element) {
		if (arguments.length !== 1) {
			throw new Error('"addElement" requires and accepts only one argument');
		}

		if (nodeTest.isNode(element)) {
			this._elements.push(element);
		} else {
			this._elements = this._elements.concat(element);
		}
		return this;
	};

	Tortem.prototype.getElements = function() {
		return _returnArray(this._elements);
	};

	Tortem.prototype.removeElements = function(el) {
		var that	= this,
			ret		= [];

		if (typeof el === 'undefined') {
			this._elements.splice(0, this._elements.length);
			return null;
		}

		function _filter(el) {
			that._elements = that._elements.filter(function (item) {
				if (el === item) {
					ret.push(el);
					return false;
				}
				return true;
			});
		}

		if (!nodeTest.isNode(el)) {
			for (var i = 0, l = el.length; i < l; i++) {
				_filter(el[i]);
			}
		} else {
			_filter(el);
		}
		
		return _returnArray(ret);
	};

	Tortem.prototype.toString = function () {
		return 'Tortem';
	};
	return Tortem;
});