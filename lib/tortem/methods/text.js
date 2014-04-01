define(['../../utils/getText'],function (getText) {
	'use strict';


	function Text(facade) {
		
		var that = this,
			container = facade.container;
		
		this.apply = function() {
			var value = facade.getValue();

			this.isNum = typeof value === 'number';

			if (container.hasChildNodes()) {
				container.firstChild.nodeValue = value;
			} else {
				container.appendChild(document.createTextNode(value));
			}
		};

		facade.addDomListener({
			characterData	: true,
			childList		: true,
			subtree			: true
		}, function () {
			var value = getText(container);
			if (that.isNum) {
				value = 1 * value;
			}
			facade.setValue(value);
		});
	}

	return Text;
});