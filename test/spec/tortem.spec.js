define([
	'../../lib/tortem/expression',
	'../../lib/tortem/tokenizer',
	'../../lib/tortem/hostobjects',
	'../../lib/tortem/objObserver',
	'../../lib/tortem/context2',
	'../../lib/tortem/jsonpath',
	'../../lib/polyfills/arrayPolyfills',
	'../../lib/tortem/loglevel'
], function (expression, Tokenizer, Hostobjects, objObserver, Context, jsonpath, addPolyfills, log) {
	'use strict';
	var tortem;
	var template = '<div>test</div>';
window.onerror= function() {
	console.log(arguments);
}
	
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

	/*describe('parseExpression', function () {
		it('should parse an object literal', function() {
			console.log(expression.parseObjectLiteral('{key:value}'));
		});
		it('should parse an nested object literal', function() {
			console.log(expression.parseObjectLiteral('{key:{key2:value}}'));
		});
		it('should parse an concatination', function() {
			console.log(expression.parseObjectLiteral('myVar + "test"'));
		});
	});
*/

	describe('objectObserver', function () {
		it('should fire a callback when a value is pushed on an array', function (done) {
			var hObj = new Hostobjects();
			var a = new hObj.Array(1,2,3);
			
			objObserver(a, function (prop, val) {
				if (val === 'test' && prop === 3) {
					done();
				} else {
					done(new Error('prop: "' + prop + '" is not "3" or value: "'+ val + '" is not "test"' ));
				}
			});
			a.push('test');
		});

		it('should fire a callback when a value is popped off an array', function (done) {
			var hObj = new Hostobjects();
			var a = new hObj.Array(1,2);
			objObserver(a, function (prop, val) {
				if (prop === 1 && val === 2) {
					done();
				} else {
					done(new Error('prop: "' + prop + '" is not "1" or value: "'+ val + '" is not "2"' ));
				}
			});
			a.pop();
		});

		it('should fire a callback when a value is spliced off an array', function (done) {
			var hObj = new Hostobjects();
			var a = new hObj.Array(1,2,3);

			objObserver(a, function (prop, val, type) {
				if (prop === 1 && val === 2) {
					done();
				} else {
					done(new Error());
				}
			});
			a.splice(1,1);
		});

		it('should fire a callback when a value is spliced on an array', function (done) {
			var hObj = new Hostobjects();
			var a = new hObj.Array(1,2,3,4,5);
			
			objObserver(a, function (prop, val, type) {
				if (type=== 'add' && prop === 1 && val === 6) {
					done();
				}
			});
			a.splice(1,1,6);
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
		it('should reparse a parsed template if the template is replaced', function () {
			var model = {test: 'test'},
				t1 = '<div data-method="text: test"></div>',
				t2 = '<div data-method="attr: {\'data-test\':test}"></div>',
				target = document.createElement('div'),
				c2 = new Context(model);

			c2.addTemplate(t1);
			c2.renderTo(target);
			c2.addTemplate(t2);
			expect(target.getElementsByTagName('div').length).to.equal(1);
			expect(target.getElementsByTagName('div')[0].getAttribute('data-test')).to.equal('test');
		});
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
		it('should render a template written in markup', function() {
			var model = {test: 'markup'},
				el = document.createElement('div'),
				c2 = new Context(model);

			el.setAttribute('data-method', 'text: test');
			document.body.appendChild(el);
			c2.render(el);
			expect(el.innerHTML).to.equal('markup');
			document.body.removeChild(el);
		});
		it('should render to a fragment', function () {
			var model = {test: 'markup'},
				fragment = document.createElement('div'),
				template = '<div data-method="text: test"></div>',
				c2 = new Context(model);

			c2.addTemplate(template);
			c2.renderTo(fragment);

			expect(fragment.childNodes[0].innerHTML).to.equal('markup');
		});
		it('should not render to already rendered elements', function() {
			var model = {test: 'markup'},
				model2 = {test: 'markup2'},
				el = document.createElement('div'),
				c2 = new Context(model),
				c3 = new Context(model2);

			el.setAttribute('data-method', 'text: test');
			document.body.appendChild(el);

			c2.render(el);
			c3.render(el);
			expect(el.innerHTML).to.equal('markup');
			document.body.removeChild(el);
		});
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
		it('should render a template', function() {
			var a = {
					test: 'test'
				},
				b = document.createElement('div'),
				c = '<div id="contextTest" data-method="text:test"></div>',
				c2;

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			
			expect(b.getElementsByTagName('div')[0].innerHTML).to.equal('test');
		});
		it('should change the content of the element when the model changes', function (done) {
			var a = {
					test: 'test'
				},
				b = document.createElement('div'),
				c = '<div id="contextTest" data-method="text:test"></div>',
				c2;

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);

			c2.model.test = 'test2';

			c2.on('change', '/test', function () {
				expect(b.getElementsByTagName('div')[0].innerHTML).to.equal('test2');
				done();
			});
		});
		it('should update the model when the document changes', function (done) {
			var a = {
					test: 'test'
				},
				b = document.createElement('div'),
				c = '<div id="contextTest" data-method="text:test"></div>',
				c2;

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);

			c2.on('change', '/test', function () {
				expect(c2.model.test).to.equal('hei');
				done();
			});

			setTimeout(function () {
				b.getElementsByTagName('div')[0].innerHTML = 'hei';
			}, 15);
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

			c2.on('change', '/text7', function () {
				expect(b.getElementsByTagName('div')[0].innerHTML).to.equal('missing text');
				done();
			});

			c2.model.text7 = 'missing';
		});
		it('should support usage as a kontxt-text tag', function () {
			var a = {
					test: 'test'
				},
				b = document.createElement('div'),
				c = '<div id="contextTest"><kontxt-text remove="true" value="test" /></div>',
				c2;

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			
			expect(b.getElementsByTagName('div')[0].innerHTML).to.equal('test');
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
				c = '<ul data-method="foreach: list"><li data-method="text:text"></li></ul>';

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
				c = '<ul data-method="foreach: list"><li data-method="text2:text"></li></ul>';
			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			
			c2.on('add', '/list/[]', function () {
				expect(b.getElementsByTagName('li').length).to.equal(3);
				done();
			});
			window.test = true;
			c2.model.list.push({
				text2: 3
			});
			window.test = false;
		});
		it('should delete the corresponding element when an entry is removed from the array', function (done) {
			var a = {
					list: [{
						text2: 1
					},{
						text2: 2
					}]
				},
				b = document.createElement('div'),
				c = '<ul data-method="foreach: list"><li data-method="text2:text"></li></ul>';

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			c2.model.list.pop();

			c2.on('remove', '/list/1', function (data) {
				expect(b.getElementsByTagName('li').length).to.equal(1);
				done();
			});
		});
		it('should change the element when an index is changed', function (done) {
			var c2,a = {
					list: [{
						text2: 1
					},{
						text2: 2
					}]
				},
				b = document.createElement('div'),
				c = '<ul data-method="foreach: list"><li data-method="text: text2"></li></ul>';

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);

			c2.on('change', '/list/0', function() {
				expect(b.getElementsByTagName('li')[0].innerHTML).to.equal('5');
				done();
			});
			
			c2.model.list[0] = {
				text2:5
			};
		});

		it('should sort the rendered markup when the array is sorted', function (done) {
			var a = {
					list: [{
						text2: 3
					},{
						text2: 1
					},{
						text2: 2
					}]
				},
				b = document.createElement('div'),
				c = '<ul data-method="foreach: list" id="list"><li data-method="text: text2"></li></ul>',
				c2;

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			
			var d = b.querySelector('#list');

			// TODO change event when children is changed
			setTimeout(function () {
				expect(b.getElementsByTagName('li')[0].innerHTML).to.equal('1');
				done();
			}, 15);

			c2.model.list.sort(function(a,b) {
				return a.text2-b.text2;
			});
		});
	});

	describe('Methods.Test', function () {
		it('should parse children based on the result of a conditional', function () {
			var a = {
				cond: true,
				cond2: false
				},
				b = document.createElement('div'),
				c = '<div data-method="test: cond"><span></span></div><div data-method="test: cond2"><span></span></div>',
				c2;

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			expect(b.getElementsByTagName('span').length).to.equal(1);
		});
		it('should solve a conditional consisting of model properties', function () {
			var a = {
				cond: true,
				cond2: false
				},
				b = document.createElement('div'),
				c = '<div data-method="test: cond === true"><span></span></div>' +
					'<div data-method="test: cond === false"><span></span></div>' +
					'<div data-method="test: cond2 === false"><span></span></div>' +
					'<div data-method="test: cond2 !== false"><span></span></div>',
				c2;

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			expect(b.getElementsByTagName('span').length).to.equal(2);
		});
		it('should run a function passed as a conditional and parse children when the conditional is true', function () {
			var a = {
				cond: function () {return true;},
				cond2: function () {return false;}
				},
				b = document.createElement('div'),
				c = '<div data-method="test: cond() === true"><span></span></div>' +
					'<div data-method="test: cond() === false"><span></span></div>' +
					'<div data-method="test: cond2() === false"><span></span></div>' +
					'<div data-method="test: cond2() !== false"><span></span></div>',
				c2;

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			expect(b.getElementsByTagName('span').length).to.equal(2);
		});
		it('should reevaluate a conditional when an involved property changes in the model', function (done) {
			var a = {
				cond: true,
				},
				b = document.createElement('div'),
				c = '<div data-method="test: cond === true"><span></span></div>',
				c2;

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);
			c2.on('change', '/cond', function () {
				expect(b.getElementsByTagName('span').length).to.equal(0);
				done();
			});
			expect(b.getElementsByTagName('span').length).to.equal(1);
			c2.model.cond = false;
		});
		it('should reevaluate a conditional when an element changes and this triggers a model change', function (done) {
			var a = {
				cond: 'hei',
				},
				b = document.createElement('div'),
				c = '<div id="test" data-method="text: cond"></div><div data-method="test: cond === \'hei\'"><span></span></div>',
				c2;

			c2 = new Context(a);
			c2.addTemplate(c);
			c2.renderTo(b);

			c2.on('change', '/cond', function () {
				expect(b.getElementsByTagName('span').length).to.equal(0);
				done();
			});
			expect(b.getElementsByTagName('span').length).to.equal(1);
			setTimeout(function() {
				b.getElementsByTagName('div')[0].innerHTML = 'sann';
			},0);
		});
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
		it('should change the model when an attribute is updated', function(done) {
			var model = {
				'klass': 'test'
			},
			target = document.createElement('div'),
			temp = '<span data-method="attr: {\'class\': klass}"></span>',
			c2 = new Context(model);
			c2.addTemplate(temp);
			c2.renderTo(target);

			c2.on('change', '/klass', function () {
				expect(c2.model.klass).to.equal('changed');
				done();
			});
			setTimeout(function () {
				target.getElementsByTagName('span')[0].setAttribute('class', 'changed');
			},15);
		});
	});

	describe('Methods.Template', function () {
		it('should render a named template', function () {
			var model = {
					'test': 'test'
				},
				target = document.createElement('div'),
				myTemp = '<span data-method="text:test"></span>',
				temp = '<div data-method="template:\'myTemp\'"></div>',
				c2 = new Context(model);
			
			c2.addTemplate({
				myTemp: myTemp,
				main: temp
			});
			c2.renderTo(target);

			expect(target.getElementsByTagName('span').length).to.equal(1);
			expect(target.getElementsByTagName('span')[0].innerHTML).to.equal('test');
		});
		it('should render a template stored in a variable and change the template when the variable changes', function(done) {
			var model = {
					'template': 'myTemp',
					'test': 'test'
				},
				target = document.createElement('div'),
				myTemp = '<span data-method="text:test"></span>',
				myTemp2 = '<div data-method="text:test"></div>',
				temp = '<div data-method="template:template"></div>',
				c2 = new Context(model);
			
			c2.addTemplate({
				myTemp: myTemp,
				myTemp2: myTemp2,
				main: temp
			});
			c2.renderTo(target);

			expect(target.getElementsByTagName('span').length).to.equal(1);
			expect(target.getElementsByTagName('span')[0].innerHTML).to.equal('test');
			c2.on('change', '/template', function () {
				expect(target.getElementsByTagName('span').length).to.equal(0);
				expect(target.getElementsByTagName('div').length).to.equal(2);
				expect(target.getElementsByTagName('div')[1].innerHTML).to.equal('test');
				
				done();
			});

			c2.model.template = 'myTemp2';
		});
	});
});