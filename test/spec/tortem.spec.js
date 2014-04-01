define([
	'../../lib/tortem/tokenizer',
	'../../lib/tortem/objObserver',
	'../../lib/tortem/context2',
	'../../lib/tortem/jsonpath',
	'../../lib/polyfills/arrayPolyfills',
	'../../lib/tortem/model',
	'../../lib/tortem',
	'../../lib/tortem/ietortem',
	'../../lib/tortem/loglevel'
], function (Tokenizer, objObserver, Context, jsonpath, addPolyfills, model, Tortem, IETortem, log) {
	'use strict';
	var tortem;

	var template = '<div>test</div>';

	log.setLevel('trace');

	addPolyfills(Array);
	function _toString(obj) {
		return Object.prototype.toString.call(obj);
	}

	//Returns true if it is a DOM node
	function _isNode(o){
		return (
			typeof Node === 'object' ? o instanceof Node :
			o && typeof o === 'object' && typeof o.nodeType === 'number' && typeof o.nodeName === 'string'
		);
	}

	//Returns true if it is a DOM element    
	function _isElement(o){
		return (
			typeof HTMLElement === 'object' ? o instanceof HTMLElement : //DOM2
			o && typeof o === 'object' && o !== null && o.nodeType === 1 && typeof o.nodeName === 'string'
		);
	}

	var jsonpathTestObject = {
		a: {
			b: {
				c: [
					'a/b/c/0',
					{
						d: 'a/b/c/1/d'
					}
				]
			}
		}
	};
	Tokenizer = null;
/*
	describe('Tokenizer', function () {
		var tokenizer = new Tokenizer();

		tokenizer.match('FOR', /for\b/);
		tokenizer.match('NUMBER', /[0-9]+/);
		tokenizer.match('ID', /[a-zA-Z]+/);
		tokenizer.match('.');
		tokenizer.match(',');
		tokenizer.match(';');
		tokenizer.ignore(/[\x09\x0A\x0D\x20]+/);

		tokenizer.tokenize('.for 123 foobar for .,;');

		it ('should match "dot"', function() {
			var token = tokenizer.next('.');
			expect(!!token).to.equal(true);
			expect(token.value).to.equal('.');
		});
		it('should match "for"', function () {
			var token = tokenizer.next(tokenizer.FOR);
			expect(!!token).to.equal(true);
			expect(token.value).to.equal('for');
		});
		it('should not match ID', function () {
			var token = tokenizer.next(tokenizer.ID);
			expect(!!token).to.equal(false);
		});
		it('should match NUMBER', function () {
			var token = tokenizer.next(tokenizer.NUMBER);
			expect(!!token).to.equal(true);
			expect(token.value).to.equal('123');
		});
		it('should match next as ID', function () {
			var token = tokenizer.next(tokenizer.ID);
			expect(!!token).to.equal(true);
			expect(token.value).to.equal('foobar');
		});
	});
*/

	describe('objectObserver', function () {
		it('should fire a callback when a value is pushed on an array', function (done) {
			var a = [];
			objObserver(a, function (prop, val) {
				if (val === 'test' && prop === 0) {
					done();
				} else {
					done(new Error());
				}
			});
			a.push('test');
		});

		it('should fire a callback when a value is popped off an array', function (done) {
			var a = [1,2];
			objObserver(a, function (prop, val) {
				if (prop === 1) {
					done();
				} else {
					done(new Error());
				}
			});
			a.pop();
		});

		it('should fire a callback when a property is added to an object', function (done) {
			var a = {};
			objObserver(a, function (prop, value) {
				if (prop === 'test' && value === true) {
					done();
				} else {
					done(new Error());
				}
			});
			a.test = true;
		});
	});

	describe('JSONPath', function () {
		it('should resolve a string path to an object path', function () {
			expect(jsonpath.resolve(jsonpathTestObject, 'a/b/c/0').match).to.equal('a/b/c/0');
			expect(jsonpath.resolve(jsonpathTestObject, 'a/b/c/1/d').match).to.equal('a/b/c/1/d');
		});
		it('should resolve a partial path', function () {
			var test = jsonpath.resolve(jsonpathTestObject, 'a/b/c/1/d/e/1');
			expect(test.match).to.equal('a/b/c/1/d');
			expect(test.path).to.equal('e/1');
		});
		it('should create missing path', function () {
			var test = jsonpath.resolve(jsonpathTestObject, 'a/b/c/1/e/1');

			expect(test.match).to.equal(jsonpathTestObject.a.b.c[1]);
			expect(test.path).to.equal('e/1');
			
			jsonpath.create(jsonpathTestObject, 'a/b/c/1/e/1');
			
			expect(jsonpath.resolve(jsonpathTestObject, 'a/b/c/1/e/1').match === null).to.equal( true );
		});
	});
	var c2;
	describe('Context', function() {
		it('should throw an error if passed none or a wrong type of argument', function() {
			expect(function () {c2 = new Context();}).to.throwException('Missing data argument for Context');
			expect(function () {c2 = new Context(true);}).to.throwException('Data argument must be have type object or function');
		});

		it('should take an object as argument', function () {
			expect(function () {c2 = new Context({test: 'test'});}).not.to.throwException('Data argument must be have type object or function');
		});

		it('should have the same properties as the object passed in as the argument', function() {
			expect(c2.model.test).to.equal('test');
		});
	});

	describe('Context.prototype.addTemplate', function () {
		it('should accept a template string, document or object', function () {
			expect(c2.addTemplate('<div data-method="text:test"></div>').toString()).to.equal('Context');
			expect(c2.addTemplate(document.createElement('div')).toString()).to.equal('Context');
			expect(c2.addTemplate({main: document.createElement('div')}).toString()).to.equal('Context');
		});
		it('should reparse a parsed template if the template is replaced');
	});

	describe('Context.prototype.getTemplates', function () {
		it('should return templates object', function () {
			expect(typeof c2.getTemplates().main).not.to.equal('undefined');
		});
	});

	describe('Context.prototype.renderTo', function () {
		it('should throw an error if it is used with wrong an argument', function () {
			expect(function () {c2.renderTo();}).to.throwException('Expected node as first argument');
		});
		it('should render a template written in markup');
		it('should render to a fragment');
		it('should not render to already rendered elements');
	});

	describe('Methods', function () {
		it('should not fail if passed a unrecognised method', function () {
			expect(function () {
				var el = document.createElement('div');
				c2 = new Context({a:1});
				c2.addTemplate('<div data-method="xyz:a"></div>');
				c2.renderTo(el);
			}).not.to.throwException();
		});
	});

	describe('Methods.Text', function () {
		var a = {
					test: 'test'
				},
				b = document.createElement('div'),
				c = '<div id="contextTest" data-method="text:test"></div>';

		it('should render a template', function(done) {
			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			
			setTimeout(function () {
				expect(b.getElementsByTagName('div')[0].innerHTML).to.equal('test');
				done();
			}, 200);
		});
		it('should change the content of the element when the model changes', function (done) {
			c2.model.test = 'test2';
			setTimeout(function () {
				expect(b.getElementsByTagName('div')[0].innerHTML).to.equal('test2');
				done();
			}, 200);
		});
		it('should update the model when the document changes', function (done) {
			b.getElementsByTagName('div')[0].innerHTML = 'hei';
			setTimeout(function () {
				expect(c2.model.test).to.equal('hei');
				done();
			}, 300);
		});
		it('should display the result of an expression', function () {
			var a = {
					text1: "some",
					text2: "text"
				},
				b = document.createElement('div'),
				c = '<div data-method="text: text1 + \' \' + text2"></div>';

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			expect(b.getElementsByTagName('div')[0].innerHTML).to.equal('some text');
		});
		it('should update the document when one of the parts of the expression is changed', function () {
			var a = {
					text3: "some",
					text4: "text"
				},
				b = document.createElement('div'),
				c = '<div data-method="text: text3 + \' \' + text4"></div>';

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			c2.model.text3 = 'other';
			expect(b.getElementsByTagName('div')[0].innerHTML).to.equal('other text');
		});
		it('should display "undefined" values when there are missing properties in the expression', function () {
			var a = {
					text6: "text"
				},
				b = document.createElement('div'),
				c = '<div data-method="text: text5 + \' \' + text6"></div>';

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			expect(b.getElementsByTagName('div')[0].innerHTML).to.equal('undefined text');
		});
		it('should render the expression when the missing property is added to the model', function (done) {
			var a = {
					text8: "text"
				},
				b = document.createElement('div'),
				c = '<div data-method="text: text7 + \' \' + text8"></div>';

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			c2.model.text7 = 'missing';
			setTimeout(function () {
				expect(b.getElementsByTagName('div')[0].innerHTML).to.equal('missing text');
				done();
			}, 250);
		});
	});

	describe('Methods.ForEach', function () {
		it('should loop through an array and print a list', function () {
			var a = {
					list: [{
						text: 1
					},{
						text: 2
					}]
				},
				b = document.createElement('div'),
				c = '<ul data-method="forEach: list"><li data-method="text:text"></li></ul>';

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			expect(b.getElementsByTagName('li').length).to.equal(2);
		});
		it('should render a new item, when a value is pushed into the array', function (done) {
			var a = {
					list: [{
						text2: 1
					},{
						text2: 2
					}]
				},
				b = document.createElement('div'),
				c = '<ul data-method="forEach: list"><li data-method="text2:text"></li></ul>';

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			c2.model.list.push({
				text2: 3
			});

			setTimeout(function () {
				expect(b.getElementsByTagName('li').length).to.equal(3);
				done();
			}, 500);
		});
		it('should delete the corresponding element when an entry is removed from the array');
		it('should run nested bindings');
		it('should sort the rendered markup when the array is sorted');
	});

	describe('Methods.If', function () {
		it('should parse children based on the result of a conditional');
		it('should solve a conditional consisting of model properties');
		it('should run a function passed as a conditional and parse children when the conditional is true');
	});

	describe('Methods.Attr', function () {
		it('should add an attribute', function () {
			var a = {
					href: '#'
				},
				b = document.createElement('div'),
				c = '<a data-method="attr: {href: href}"></a>';

			var c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			expect(b.getElementsByTagName('a')[0].getAttribute('href')).to.equal('#');
		});
		it('should change the attribute when the model is updated', function () {
			var a = {
					href: '#'
				},
				b = document.createElement('div'),
				c = '<a data-method="attr: {href: href}"></a>';

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			c2.model.href = '#test';
			expect(b.getElementsByTagName('a')[0].getAttribute('href')).to.equal('#test');
		});
		it('should not add an attribute when the corresponding model property is missing', function () {
			var a = {},
				b = document.createElement('div'),
				c = '<p data-method="attr: {\'class\': klass}"></p>';

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			var test = b.getElementsByTagName('p')[0].getAttribute('class');
			expect(test).to.equal(null);
		});
		it('should add the attribute when the property is added to the model', function () {
			var a = {},
				b = document.createElement('div'),
				c = '<p data-method="attr: {\'class\': klass}"></p>';

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			c2.model.klass = 'test';
			var test = b.getElementsByTagName('p')[0].getAttribute('class');
			expect(test).to.equal('test');
		});
		it('should parse an expression as the value of an attribute', function () {
			var a = {
					'klass': 'test'
				},
				b = document.createElement('div'),
				c = '<p data-method="attr: {\'class\': klass + 1}"></p>';

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			var test = b.getElementsByTagName('p')[0].getAttribute('class');
			expect(test).to.equal('test1');
		});
	});

	describe('Methods.Template', function () {
		it('should render a named template');
		it('should update the document when the model is changed');
		it('should update the model when the document is changed');
		it('should not render the template if the property is missing');
		it('should render the template when the property is added to the model');
	});

	describe('Template element', function () {
		it('should not be added to the rendered markup');
		it('should parse bindings');
		it('should update the document when the model is changed');
		it('should update the model when the document is changed');
	});
	/*
	describe('model', function () {
		it('should create a setter that will be run on each new element in an array', function () {
			var m = model([1,2,3]);
			m.push(4);
			expect(m[3]).to.equal(4);
		});
	});

	describe('tortem', function () {
		var methods = ['apply','addElement','removeElements','addTemplate','removeTemplate'];
		it('should be a constructor', function () {
			expect(typeof Tortem).to.equal('function');
		});
		it('should create an object', function () {
			tortem = new Tortem();
			expect(typeof tortem).to.equal('object');
		});
		function _methodTest(method) {
			it('should have an '+method+' method', function () {
				expect(typeof tortem[method]).to.equal('function');
			});
			
		}
		for (var i = 0, l = methods.length; i<l; i++) {
			_methodTest(methods[i]);
		}
		
	});
	
	describe('tortem.addElement', function () {
		it('should take an DOM node as only argument', function () {
			expect(function () {
				tortem.addElement(document.createElement('div'), true);
			}).to.throwException('"addElement" requires and accepts only one argument');
		});
		it('should chain', function () {
			expect(tortem.addElement(document.createElement('div')).toString()).to.equal('Tortem');
		});
		it('should take an array of elements as argument', function () {
			expect(tortem.addElement([document.createElement('div'), document.createElement('div')]).getElements().length).to.equal(3);
		});
	});

	describe('tortem.getElements', function () {
		it('should return elements', function () {
			expect(tortem.getElements().length).not.to.equal(0);
			expect(tortem.getElements()[0].nodeType).to.equal(1);
		});
	});

	describe('tortem.removeElements', function () {
		it('should remove an element specified in argument', function () {
			var el = document.createElement('div');
			tortem.addElement(el);
			expect(tortem.getElements().length).to.equal(4);
			expect(tortem.removeElements(el)).to.equal(el);
			expect(tortem.getElements().length).to.equal(3);
		});
		it('should remove all elements when used without arguments', function () {
			tortem.removeElements();
			expect(tortem.getElements()).to.equal(null);
		});
	});

	describe('tortem.addTemplate', function () {
		it('should take a string as argument', function () {
			tortem.addTemplate('<div></div>');
			expect(_isNode(tortem._template.main)).to.equal(true);
		});
		it('should take a node as argument', function () {
			tortem.addTemplate(document.createElement('div'));
			expect(_isElement(tortem._template.main)).to.equal(true);
		});
		it('should add a partial template', function() {
			tortem.addTemplate({
				part1: '<div></div>'
			});
			expect(_isNode(tortem._template.part1)).to.equal(true);
		});
		it('should chain', function () {
			expect(tortem.addTemplate('<div></div>').toString()).to.equal('Tortem');
		});

	});

	describe('tortem.apply', function () {
		it('should take an optional container element', function () {
			expect(function() {
				tortem.apply(document.createElement('div'));
			}).not.to.throwException('Invalid argument. Expected an element');
			expect(function () {
				tortem.apply(true);
			}).to.throwException('Invalid argument. Expected an element');
		});
		it('should chain', function () {
			expect(tortem.apply(document.createElement('div')).toString()).to.equal('Tortem');
		});
		it('should append the template to the container and parse it', function () {
			var output = document.getElementById('output'),
				obj = {
					a: 'test'
				};

			tortem = new Tortem(obj);
			tortem.addTemplate('<div id="removeThis" data-tortem="text:a"></div><div id="notThis" data-tortem="text:a"></div>');
			tortem.apply(output);

			expect(output.getElementsByTagName('div').length).to.equal(2);
			expect(output.getElementsByTagName('div')[1].innerHTML).to.equal('test');
			
			var el = document.getElementById('removeThis');
			el = el.parentNode.removeChild(el);
			tortem.model.a = 'test2';
			expect(output.getElementsByTagName('div')[0].innerHTML).to.equal('test2');
		});

		it('should update the object when the DOM is updated', function (done) {
			document.getElementById('notThis').innerHTML = 'hei';
			setTimeout(function () {
				expect(tortem.model.a).to.equal('hei');
				done();
			}, 1000);
		});

		it('should listen for a new property and display the result', function (done) {
			tortem.addTemplate('<div id="newProp" data-tortem="text:b"></div>');
			tortem.apply(output);
			tortem.model.b = 'new property';
			setTimeout(function () {
				expect(document.getElementById('newProp').innerHTML).to.equal('new property');
				done();
			}, 500);
		});
		
		it('should iterate through an array', function (done) {
			tortem.model.c = [1,2,3];
			tortem.addTemplate('<ul id="testList" data-tortem="forEach:c"><li data-tortem="text:$data"></li></ul>');
			setTimeout(function () {
				tortem.apply(output);
				expect(document.getElementById('testList').childNodes.length).to.equal(3);
				done();
			}, 500);
		});

		it('should add a new element when we push a value on the array', function (done) {
			tortem.model.c.push(4);
			setTimeout(function () {
				expect(document.getElementById('testList').childNodes.length).to.equal(4);
				done();
			},1050);
		});
		
	});*/
});