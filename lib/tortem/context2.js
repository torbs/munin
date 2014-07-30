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
	'./event',
	'./dataStore',
	'./expression'
],function (Model, jsonpath, nodeTest, nodelistToArray, Setter, Facade, methods, log, patterns, Events, dataStore, expression) {
	'use strict';

	//log.setLevel('trace');

	var templateMap	= new WeakMap(),
		containerMap= new WeakMap(),
		evts		= {},
		methodPattern = patterns.methods(Object.keys(methods)),
		tagPattern = patterns.tagMethods(Object.keys(methods));

	function _extendObj(target, source) {
		for (var key in source) {
			if (Object.prototype.hasOwnProperty.call(source, key)) {
				target[key] = source[key];
			}
		}
	}

	function _resetContainer(name, cb) {
		/*jshint validthis:true */
		var that = this,
			containers = containerMap.get(this);

		if (containers && containers[name]) {
			var temp = containers[name];
			delete containers[name];

			temp.forEach(function (current, i) {
				var fragment;

				if (current.rendered  === false) {
					fragment = templates[name].cloneNode(true);
					// Container is a template
					current.target.parentNode.insertBefore(fragment, current.target);
					current.target.parentNode.removeChild(current.target);
					current.target = fragment;
					that.renderTo(fragment, name);
				} else {
					while (current.rendered[0]) {
						current.target.removeChild(current.rendered.pop());
					}
				}

				cb.call(that, current.target, name);
			});
		}
	}

	function Context(data) {
		var model,
			events = new Events();
			
		if (arguments.length === 0) {
			throw new Error('Missing data argument for Context');
		} else if (typeof data !== 'object' && typeof data !== 'function') {
			throw new Error('Data argument must be have type object or function');
		}
		
		model = new Model(data);
		
		this.model = model.data;
		this._model = model;
		
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
		var templates	= _templates || templateMap.get(this),
			replace		= false,
			that		= this,
			tempEl;

		_name = _name || 'main';

		if (!templates) {
			templates = {};
			templateMap.set(this, templates);
		}

		replace = !!templates[_name];

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

		if (replace) {
			_resetContainer.call(this, _name, that.renderTo);
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
			current = this._model.find(config.path),
			dStore	= this._model.getDataStore(config.path),
			addQueue= [],
			facade, method, setter;

		function _triggerChangeEvent(data) {
			log.info('Trigger change event "' + config.path + data.prop + '"');
			that.trigger('change', config.path + data.prop, data.val);
		}

		setter = new Setter(current.obj, dStore);
		setter.on('add', null,  function (data) {
			that.trigger('add', config.path + data.prop, data.val);
		});

		setter.on('remove', null, function(data) {
			that.trigger('remove', config.path + data.prop, data.val);
		});

		facade = new Facade(dStore, config.property, config.container, path, this);
		facade.props = config.involvedProps ? config.involvedProps : [config.property];//facade.props.concat( config.involvedProps ? config.involvedProps : [config.property]);
		facade.objectValue = config.objectValue ? config.objectValue : [];
		
		method = new config.Method(facade);

		if (config.involvedProps) {
			for (var i = 0, l = config.involvedProps.length; i < l; i++) {
				setter.on('change', config.involvedProps[i], _triggerChangeEvent);
				setter.add(config.involvedProps[i], method);
			}
		} else {
			//setter.onChange(config.property, _triggerChangeEvent);
			setter.on('change', config.property, _triggerChangeEvent);
			setter.add(config.property, method);
		}

		if (current.created === false) {
			method.apply();
		}
	};

	Context.prototype.parse = function(container, setter) {
		var that			= this,
			attr			= container.getAttribute ? container.getAttribute('data-method') : null,
			model			= this.model,
			path			= '/',
			children, expr, key, prop, i, l, tempEl, remove;

		if (container._isRendered) {
			return; // Dont rerender a template
		}

		if (typeof setter === 'string' && setter !== '') {
			path = setter;
		} else if (typeof setter === 'object') {
			path = setter.path || path;
		}

		function _parseProps(Method, prop, remove) {
			//var dStore;

			if (typeof Method !== 'function') {
				return false;
			}

			if  (typeof prop === 'string') {
				prop = prop.trim();
			}
			
			if (!patterns.singleVariable.test(prop)) {
				expression.parse(model, path, prop, function(result) {
					if (that._model.setExpressionValue) {
						that._model.setExpressionValue(path, prop, result);
					} else {
						model[prop] = function() {
							return result.value(model);
						};
					}
					// todo working on removing below
					//dStore = dataStore.get(current.match);
					//dStore[prop] = function (val) {
					//	if (typeof val === 'undefined') {
					//		console.log(result);
					//		return result.value(model);
					//	}
					//};
					that.add.call(that, {
						container: container,
						path: path,
						property: prop,
						Method: Method,
						objectValue: result.objectValue,
						involvedProps: result.properties
					});
				});
			} else {
				that.add.call(that, {
					container: container,
					path: path,
					property: prop,
					Method: Method
				});
			}
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
		} else if(container.tagName && tagPattern.exec(container.tagName)) {
			attr = container.getAttribute('value');
			remove = container.getAttribute('remove');
			_parseProps(methods[container.tagName.replace(/\w+\-/, '').toLowerCase()], attr);
			if (!!remove) {
				tempEl = nodelistToArray(container.childNodes);
				for (i = 0, l = tempEl.length; i < l; i++) {
					container.parentNode.insertBefore(tempEl[i], container.nextSibling);
				}
				container.parentNode.removeChild(container);
			}
		} else if (container.hasChildNodes()) {
			children = nodelistToArray(container.childNodes);
			for (i = 0, l = children.length; i < l; i++) {
				this.parse.call(this, children[i], path);
			}
		}
	};

	Context.prototype.renderTo = function(container, templateName, _root) {
		if (!nodeTest.isNode(container)) {
			throw new Error('Expected node as first argument');
		}

		var template	= templateMap.get(this),
			parent		= container.parentNode,
			containers	= containerMap.get(this),
			renderedTemplate, nextSibling, fragment, el;

		_root = _root || '/';
		templateName = templateName || 'main';

		// Container is attached to the dom
		if (parent !== null && parent.nodeType !== 11) {

			el = container;
			while (el !== document.documentElement) {
				if (el._isRendered) {
					return;
				}
				el = el.parentNode;
			}
			nextSibling = container.nextSibling;
			fragment	= document.createDocumentFragment();
			fragment.appendChild(container);
		}

		// Store reference to containers. Used to reparse the target when replacement of templates
		if (!containers) {
			containers = {};
			containerMap.set(this, containers);
		}
		containers[templateName] = containers[templateName] || [];

		if (template && templateName !== true) {
			renderedTemplate = template[templateName].cloneNode(true);
		} else {
			renderedTemplate = container;
			this.addTemplate.call(this, container.cloneNode(true), templateName);
		}
		
		if (container.nodeType !== 1 && container.nodeType !== 11) {
			return;
		}

		this.parse.call(this, renderedTemplate, _root);

		if (container !== renderedTemplate) {
			containers[templateName].push({
				target: container,
				rendered : nodeTest.isElement(renderedTemplate) ? [renderedTemplate] : nodelistToArray(renderedTemplate.childNodes)
			});
			container.appendChild(renderedTemplate);
		} else {
			// Mark container as a rendered template
			container._isContainer = true;
			containers[templateName].push({
				target: container,
				rendered : false
			});
		}
		container._isRendered = true;

		if (parent !== null) {
			parent.insertBefore(container, nextSibling);
		}
	};

	Context.prototype.render = function(container) {
		this.renderTo.call(this, container, true);
	};

	Context.prototype.toString = function () {
		return 'Context';
	};

	return Context;
});