define([
	'./model2',
	'./jsonpath',
	'../utils/nodeTest',
	'../utils/nodelistToArray',
	'./setter',
	'./facade',
	'./methods/methods',
	'./loglevel',
	'./patterns',
	'./event'
],function (createModel, jsonpath, nodeTest, nodelistToArray, Setter, Facade, methods, log, patterns, Events) {
	'use strict';

	log.setLevel('trace');

	var dataMap		= new WeakMap(),
		templateMap	= new WeakMap(),
		evts		= {},
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
		var model,
			events = new Events();

		if (arguments.length === 0) {
			throw new Error('Missing data argument for Context');
		} else if (typeof data !== 'object' && typeof data !== 'function') {
			throw new Error('Data argument must be have type object or function');
		}
		
		model = createModel(data);
		dataMap.set(model, {});
		this.model = model;
		this.on = function () {
			events.on.apply(events, arguments);
		};
		this.off = function () {
			events.off.apply(events, arguments);
		};
		this.trigger = function () {
			events.trigger.apply(events, arguments);
		};
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
		var that	= this,
			data	= this.model,
			path	= config.path,
			current = config.current,
			facade, method, setter;

		facade = new Facade(_getDataStore(current.match), config.property, config.container, path, this);
		method = new config.Method(facade);

		function _triggerChangeEvent(prop, val) {
			log.info('Trigger change event "' + config.path + prop + '"');
			that.trigger('change', config.path + prop, val);
		}

		setter = new Setter(current.match, _getDataStore(current.match));
		setter.onAdd(function (prop, val) {
			that.trigger('add', config.path + prop, val);
		});

		setter.onRemove(function (prop, val) {
			that.trigger('remove', config.path + prop, val);
		});

		if (config.involvedProps) {
			for (var i = 0, l = config.involvedProps.length; i < l; i++) {
				facade.props.push(config.involvedProps[i]);
				setter.onChange(config.involvedProps[i], _triggerChangeEvent);
				setter.add(config.involvedProps[i], method);
				//addSetter(current.match, config.involvedProps[i], method, _getDataStore(current.match))
				//	.onChange(_flushObservers);
			}
		} else {
			facade.props.push(config.property);
			setter.onChange(config.property, _triggerChangeEvent);
			setter.add(config.property, method);
			//addSetter(current.match, config.property, method, _getDataStore(current.match))
			//	.onChange(_flushObservers);
		}

		if (current.path === false) {
			method.apply();
		}
	};

	Context.prototype.parseExpression = function(model, current, path, prop) {
		var involvedProps	= [],
			expr, exprStr, dataStore;

		path = path.match(patterns.notSlash) || [];
		path = path.map(function (item) {
			return '["' + item + '"]';
		}).join('');
console.log(patterns.variableInValue);
		exprStr = prop.replace(patterns.variableInValue, function (item) {
			if (patterns.primitives.test(item)) {
				return item;
			}
			involvedProps.push(item);
			console.log(item);
			console.log(prop);
			return 'model'+ path + '[\'' + item + '\']';
		});

		// is Expression;
		console.log(exprStr, 'Expression');
		expr = new Function('model', 'return ' + exprStr + ';');

		dataStore = _getDataStore(current.match);
		dataStore[prop] = function (val) {
			if (typeof val === 'undefined') {
				return expr(model);
			}
		};
		return involvedProps;
	};

	Context.prototype.parse = function(container, setter) {
		var that			= this,
			attr			= container.getAttribute ? container.getAttribute('data-method') : null,
			involvedProps	= false,
			model			= this.model,
			path			= '/',
			children, expr, key, prop, current, i, l;

		if (typeof setter === 'string' && setter !== '') {
			path = setter;
		} else if (typeof setter === 'object') {
			path = setter.path || path;
		}

		current = jsonpath.resolve(model, path);
		
		if (current.path !== false) {
			current.match = jsonpath.create(current.match, current.path);
		}

		function _parseProps(Method, prop) {
			var expr, dataStore;
			if (!patterns.singleVariable.test(prop)) {
				involvedProps = that.parseExpression.call(that, model, current, path, prop);
			}
			that.add.call(that, {
				container: container,
				path: path,
				current: current,
				property: prop,
				Method: Method,
				involvedProps: involvedProps
			});
			return true;
		}


		if (typeof setter === 'object') {
			_parseProps(setter.method, setter.prop);
		} else if (attr !== null && attr.length > 1) {
			attr = attr.split(',');
			for (i = 0, l = attr.length; i < l;i++) {
				expr = methodPattern.exec(attr[i]);
				if (expr !== null) {
					_parseProps(methods[expr[1]], expr[2]);
				}
			}
		} else if (container.hasChildNodes()) {
			children = nodelistToArray(container.childNodes);
			for (i = 0, l = children.length; i < l; i++) {
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