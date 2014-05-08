define(['../../utils/nodelistToArray', '../../utils/getText'],function (nodelistToArray, getText) {
	'use strict';

	var templates = new WeakMap();

	function _createItem(container, idx) {
		function Item(facade) {
			this.apply = function () {
				facade.parse(container, idx);
			};

			facade.addDomListener({
				characterData	: true,
				childList		: true,
				subtree			: true
			}, function () {
				if (!container) {
					console.log('is removed');
				}
			});
		}
		return Item;
	}

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

		function _applyParse(el, i) {
			facade.parse(el, {
				method: _createItem(el, i),
				prop: i
			});
		}

		this.apply = function() {
			var value	= facade.getValue(),
				fragment= document.createDocumentFragment(),
				child;
			// todo: create setter for indices, Must have an reference to an element
			for (var i = 0, l = value.length; i < l; i++) {
				for (var j = 0, m = template.length; j < m; j++) {
					child = template[j].cloneNode(true);
					fragment.appendChild(child);
					_applyParse(child, i);
				}
				
			}
			container.innerHTML = '';
			container.appendChild(fragment);
		};
	}
	return ForEach;
});