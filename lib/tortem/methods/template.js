define(function () {
	'use strict';

	function Template(facade) {
		
		var that = this,
			container = facade.container;
		
		this.apply = function() {
			var templateName = facade.getValue(),
				fragment = document.createDocumentFragment();

			container.innerHTML = '';
			facade.renderTo(fragment, templateName, facade.getPath());
			container.appendChild(fragment);
		};
	}

	return Template;
});