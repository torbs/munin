define(['../patterns', '../expression'], function (patterns, expression) {
	'use strict';


	function Attr(facade) {
		
		var container = facade.container,
			mappedAttributes = {},
			attr;
		
		function _getValue(expr) {
			expr = attr[i].value;
			if (!patterns.singleVariable.test(prop)) {
				funcBody = expression.resolveExpression(expr);
				
			} else {

			}	
		}

		this.apply = function() {
			var funcBody;
			attr = facade.getValue();

//TODO find property keys connected to the values sent
			if (Object.prototype.toString.call(attr) !== '[object Array]') {
				throw new Error('Attr requires an object');
			}

			for (var i = 0, l = attr.length; i < l; i++) {
				if (attr[i].type === 'property') {
					
					container.setAttribute(attr[i].key, );
				}
			}
		};

		facade.addDomListener({
			attributes	: true,
		}, function (record) {
			for (var i = 0, l = facade.objectValue.length; i < l; i ++) {
				if (facade.objectValue[i].key === record.attributeName) {
					if (typeof mappedAttributes[facade.objectValue[i].key] === 'undefined') {
						mappedAttributes[facade.objectValue[i].key] = patterns.singleVariable.test(facade.objectValue[i].value);
					}
					if (mappedAttributes[facade.objectValue[i].key]) {
						// dont work...
						facade.setValue(container.getAttribute(facade.objectValue[i].key), facade.objectValue[i].value);
					}
				}
			}
		});
	}

	return Attr;
});