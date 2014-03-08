define(function () {
	'use strict';


	function Attr(facade) {
		
		var container = facade.container;
		
		this.apply = function() {
			var value = facade.getValue();
			for (var key in value) {
				if (Object.prototype.hasOwnProperty.call(value, key) && value[key] !== undefined) {
					container.setAttribute(key, value[key]);
				}
			}
		};

		facade.addDomListener({
			attributes	: true
		}, function () {
			//facade.setValue(getText(container));
		});
	}

	return Attr;
});