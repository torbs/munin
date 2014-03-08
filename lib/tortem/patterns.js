define(function () {
	'use strict';
	return {
		variableInValue: /\b(\w+)(?:\(\))?\b(?!(\'|\")?\s?\:)/g,
		singleVariable: /^\b[a-zA-Z0-9_]+\b$/,
		notSlash: /([^\/])/g,
		primitives: /^true$|^false$|^\d+$|^[\'\"].*[\'\"]$/,
		object: /\{(\s?(\'|")?\w+(\'|")?\s?\:\s?[^,]*\s?,?)+\}/,
		methods: function(methods) {
			return new RegExp('(' + methods.join('|') + ')(?:\\s?\\:\\s?)([^,]*),?', 'g');
		}
	};
});