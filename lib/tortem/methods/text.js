define(['../../utils/getText'],function (getText) {
	'use strict';


	function Text(facade) {
		
		var container = facade.container;
		
		this.apply = function() {
			var value = facade.getValue();

			if (container.hasChildNodes()) {
				container.firstChild.nodeValue = value;
			} else {
				container.appendChild(document.createTextNode(value));
			}
		};

		facade.addDomListener({
			characterData	: true,
			childList		: true
		}, function () {
			facade.setValue(getText(container));
		});
	}

	return Text;
	
	/*function text(context) {
		var container = context.getContainer();
		return function(value) {
			if (container.hasChildNodes()) {
				container.firstChild.nodeValue = value;
			} else {
				container.appendChild(document.createTextNode(value));
			}
			context.createDomListener(container, {
				characterData: function() {
					return getText(container);
				},
				childList: function() {
					return getText(container);
				},
				subtree: true
			});
		};
	}

	return text;*/
});