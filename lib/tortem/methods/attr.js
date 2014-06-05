define(['../patterns'], function (patterns) {
	'use strict';


	function Attr(facade) {
		
		var container = facade.container,
			mappedAttributes = {},
			attr;
		
		this.apply = function() {
			attr = facade.getValue();

//TODO find property keys connected to the values sent

			if (typeof attr !== 'object') {
				throw new Error('Attr requires an object');
			}
			for (var key in attr) {
				if (Object.prototype.hasOwnProperty.call(attr, key) && attr[key] !== undefined) {
					container.setAttribute(key, attr[key]);
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
						facade.setValue(container.getAttribute(facade.objectValue[i].key), facade.objectValue[i].value);
					}
				}
			}
		});
	}

	return Attr;
});