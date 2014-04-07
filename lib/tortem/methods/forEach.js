define(['../../utils/nodelistToArray', '../../utils/getText'],function (nodelistToArray, getText) {
	'use strict';

	var templates = new WeakMap();

	function _createItem(fragment, template, idx) {
		var l = template.length;
			
		function Item(facade) {
			var child;
			console.log('here -----');
			this.apply = function () {
				for (var i = 0; i < l; i++) {
					child = template[i].cloneNode(true);
					facade.parse(child, idx);
					fragment.appendChild(child);
				}
			};

			facade.addDomListener({
				characterData	: true,
				childList		: true,
				subtree			: true
			}, function () {
				if (!child) {
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

		facade.observe(function (prop, val) {
			that.apply();
		});

		this.apply = function() {
			var value	= facade.getValue(),
				fragment= document.createDocumentFragment(),
				i, l, ci, child;



			// todo: create setter for indices
			for (i = 0, l = value.length; i < l; i++) {
				facade.parse(fragment, {
					method: _createItem(fragment, template, i),
					prop: i
				});
			}
			container.innerHTML = '';
			container.appendChild(fragment);
		};
	}
	return ForEach;
});