define(['../../utils/nodelistToArray', '../../utils/getText'],function (nodelistToArray, getText) {
	'use strict';

	var templates = {

	};

	function forEach(context) {
		var container	= context.getContainer();

		function applyForeach(value) {
			var	children, cl,
				ci, child, prop, model, markup, fragment;

			if (templates[container._tortemId]) {
				children = templates[container._tortemId];
			} else {
				children = nodelistToArray(container.childNodes);
				templates[container._tortemId] = children;
			}

			cl = children.length;

			prop = context.getProperty();
			context.setDataToProperty(prop);

			container.innerHTML = '';
			for (var i = 0, l = value.length; i < l; i++) {
				for (ci = 0; ci < cl; ci++) {
					child = children[ci].cloneNode(true);
					context.setProperty(i);
					context.setContainer(child);
					context.parse();
					container.appendChild(child);
				}
			}

			context.setProperty(prop);
			context.setDataToParent();
			context.setContainer(container);
			context.createDomListener(container, 'childList', function() {
				
			});
		}
		return applyForeach;
	}

	return forEach;
});