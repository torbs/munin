define(function () {
	'use strict';

	function _isValid(xmlDoc) {
		return (
			(xmlDoc.parseError && xmlDoc.parseError.errorCode !== 0) ||
			(xmlDoc.documentElement && xmlDoc.documentElement.nodeName !== 'parsererror' &&
				xmlDoc.documentElement.getElementsByTagName('parsererror').length === 0)
		);
	}

	var parseFromString = function () {
		if (window.DOMParser) {
			return function(str) {
				var parser=new DOMParser(),
				xmlDoc = parser.parseFromString(str,'text/xml');

				return _isValid(xmlDoc) ? xmlDoc : null;
			};
		} else { // Internet Explorer < 9
			return function(str) {
				var xmlDoc=new ActiveXObject('Microsoft.XMLDOM');

				xmlDoc.async=false;
				xmlDoc.loadXML(str);
				return _isValid(xmlDoc) ? xmlDoc : null;
			};
		}
	}();
	
	return {
		parseFromString     : parseFromString
	};
});