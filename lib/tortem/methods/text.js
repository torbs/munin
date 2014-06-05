define(['../../utils/getText'],function (getText) {
	'use strict';


	function Text(facade) {
		
		var that = this,
			container = facade.container,
			txtNode;
		
		this.apply = function() {
			var value = facade.getValue();
			
			this.isNum = typeof value === 'number';

			if (container.parentNode !== null && container.nodeType === 3) {
				container.nodeValue = value;
			} else if (container.hasChildNodes() && container.firstChild.nodeType === 3) {
				container.firstChild.nodeValue = value;
			} else {
				txtNode = document.createTextNode(value);
				container.appendChild(txtNode);
				container = txtNode;
				facade.addDomListener({
					characterData	: true
				}, function () {
					var value = container.nodeValue;
					if (that.isNum) {
						value = 1 * value;
					}
					facade.setValue(value);
				}, container);
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