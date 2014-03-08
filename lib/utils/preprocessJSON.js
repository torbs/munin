define(function () {
	'use strict';
	var pattern = /("(\\.|[^"])*"|'(\\.|[^'])*')|(\w+)\s*:/g;
	function preprocessJSON(str) {
		return str.replace(pattern,
			function(all, string, strDouble, strSingle, jsonLabel) {
				if (jsonLabel) {
					return '"' + jsonLabel + '": ';
				}
				return all;
			});
	}

	return preprocessJSON;
});