define([
	'./model2',
	'./jsonpath',
	'../utils/nodeTest',
	'../utils/nodelistToArray',
	'./setter',
	'./facade',
	'./methods/methods',
	'./loglevel',
	'./patterns'
],function (createModel, jsonpath, nodeTest, nodelistToArray, addSetter, Facade, methods, log, patterns) {
	'use strict';

	var dataMap		= new WeakMap(),
		templateMap	= new WeakMap(),
		methodPattern = patterns.methods(Object.keys(methods));

	function _extendObj(target, source) {
		for (var key in source) {
			if (Object.prototype.hasOwnProperty.call(source, key)) {
				target[key] = source[key];
			}
		}
	}

	function _getDataStore(obj) {
		var dataStore = dataMap.get(obj);

		if (!dataStore) {
			dataStore = {};
			dataMap.set(obj, dataStore);
		}

		return dataStore;
	}

	function Context(data) {
		var model;

		if (arguments.length === 0) {
			throw new Error('Missing data argument for Context');
		} else if (typeof data !== 'object' && typeof data !== 'function') {
			throw new Error('Data argument must be have type object or function');
		}
		
		model = createModel(data);
		dataMap.set(model, {});
		this.model = model;
	}

	Context.prototype.addTemplate = function(template, _name, _templates) {
		var templates = _templates || templateMap.get(this),
			tempEl;

		_name = _name || 'main';

		if (!templates) {
			templates = {};
			templateMap.set(this, templates);
		}

		if (typeof template === 'string') {
			templates[_name] = document.createDocumentFragment();
			tempEl = document.createElement('div');
			try {
				tempEl.innerHTML = template;
				while (tempEl.hasChildNodes()) {
					templates[_name].appendChild(tempEl.firstChild);
				}
			} catch(e) {
				throw new Error('Failed parsing template');
			}
		} else if (nodeTest.isNode(template)) {
			templates[_name] = template;
		} else if (typeof template === 'object') {
			for (var key in template) {
				if (template.hasOwnProperty(key)) {
					this.addTemplate.call(this, template[key], key, templates);
				}
			}
		}

		return this;
	};

	Context.prototype.getTemplates = function () {
		return templateMap.get(this);
	};

	Context.prototype.add = function(config) {
		var data	= this.model,
			path	= config.path || '/',
			current = jsonpath.resolve(data, path),
			facade, method;

		if (current.path !== false) {
			current.match = jsonpath.create(current.match, current.path);
		}

		facade = new Facade(_getDataStore(current.match), config.property, config.container);
		method = new config.Method(facade);

		if (config.involvedProps) {
			for (var i = 0, l = config.involvedProps.length; i < l; i++) {
				addSetter(current.match, config.involvedProps[i], method, _getDataStore(current.match));
			}
		} else {
			addSetter(current.match, config.property, method, _getDataStore(current.match));
		}

		if (current.path === false) {
			method.apply();
		}
	};

	Context.prototype.parseExpression = function(path, prop) {
		var involvedProps	= [],
			data			= this.model,
			current			= jsonpath.resolve(data, path),
			expr, exprStr, dataStore;
		
		if (current.path !== false) {
			current.match = jsonpath.create(current.match, current.path);
		}

		path = path.match(patterns.notSlash) || [];
		path = path.map(function (item) {
			return '["' + item + '"]';
		}).join('');

		exprStr = prop.replace(patterns.variableInValue, function (item) {
			if (patterns.primitives.test(item)) {
				return item;
			}
			involvedProps.push(item);
			return 'data'+ path + '[\'' + item + '\']';
		});

		// is Expression;
		expr = new Function('data', 'return ' + exprStr + ';');

		dataStore = _getDataStore(current.match);
		dataStore[prop] = function (val) {
			if (typeof val === 'undefined') {
				return expr(data);
			}
		};
		return involvedProps;
	};

	Context.prototype.parse = function(container, path) {
		var that			= this,
			attr			= container.getAttribute ? container.getAttribute('data-method') : null,
			involvedProps	= false,
			children, expr, key, prop;

		function _parseProps(methodName, prop) {
			var Method, expr, current, dataStore;
			
			Method = methods[methodName];

			if (!patterns.singleVariable.test(prop)) {
				involvedProps = that.parseExpression.call(that, path, prop);
			}
			that.add.call(that, {
				container: container,
				path: path,
				property: prop,
				Method: Method,
				involvedProps: involvedProps
			});
			return true;
		}

		if (attr !== null && attr.length > 1) {
			while ((expr = methodPattern.exec(attr)) !== null) {
				_parseProps(expr[1], expr[2]);
			}
		} else if (container.hasChildNodes()) {
			children = nodelistToArray(container.childNodes);
			for (var i = 0, l = children.length; i < l; i++) {
				this.parse.call(this, children[i], path);
			}
		}
	};

	Context.prototype.renderTo = function(container) {
		if (!nodeTest.isNode(container)) {
			throw new Error('Expected node as first argument');
		}

		var template	= templateMap.get(this),
			parent		= container.parentNode,
			nextSibling, fragment;

		if (template) {
			template = template.main.cloneNode(true);
		} else {
			template = container;
		}

		if (parent !== null) {
			nextSibling = container.nextSibling;
			fragment	= document.createDocumentFragment();
			fragment.appendChild(container);
		}
		
		if (container.nodeType !== 1 && container.nodeType !== 11) {
			return;
		}

		this.parse.call(this, template, '/');

		if (container !== template) {
			container.appendChild(template);
		}

		if (parent !== null) {
			parent.insertBefore(container, nextSibling);
		}
	};

	Context.prototype.toString = function () {
		return 'Context';
	};

	return Context;
});