define(['../../utils/nodelistToArray'], function (nodelistToArray) {
	'use strict';


	function Test(facade) {
		
		var that		= this,
			container	= facade.container,
			inner		= container.innerHTML,
			props;

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

		function _reApply() {
			that.apply.call(that);
		}
		props = facade.getProps();
		for (var i = 0, l = props.length; i < l; i++) {
			facade.on('change', props, _reApply);
		}

		//TODO facade get involved properties / path;
	}

	return Test;
});