define(['../../utils/nodelistToArray', '../../utils/getText'],function (nodelistToArray, getText) {
	'use strict';

	var templates = new WeakMap();

	function ForEach(facade) {
		var that = this,
			container = facade.container,
			template = templates.get(container),
			initialRender = false,
			cl;

		if (!template) {
			template = nodelistToArray(container.childNodes);
			templates.set(container, template);
		}

		cl = template.length;

		facade.observe(function (prop, val) {
			console.log('apply')
			that.apply();
		});

		this.apply = function() {
			var value	= facade.getValue(),
				fragment= document.createDocumentFragment(),
				i, l, ci, child;

			for (i = 0, l = value.length; i < l; i++) {
				console.log(value[i]);
				for (ci = 0; ci < cl; ci++) {
					child = template[ci].cloneNode(true);
					facade.parse(child, i);
					fragment.appendChild(child);
				}
			}
			container.innerHTML = '';
			container.appendChild(fragment);
		};
	}
	return ForEach;
});