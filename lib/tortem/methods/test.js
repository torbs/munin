define(['../../utils/nodelistToArray'], function (nodelistToArray) {
	'use strict';


	function Test(facade) {
		
		var that		= this,
			container	= facade.container,
			inner		= container.innerHTML;

		this.apply = function() {
			var children;
			if (facade.getValue()) {
				container.innerHTML = inner;
				children = nodelistToArray(container.childNodes);
				for (var i = 0, l = children.length; i < l; i++) {
					facade.parse(children[i]);
				}
			} else {
				container.innerHTML = '';
			}
		};

		//TODO facade get involved properties / path;
	}

	return Test;
});