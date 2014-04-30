define(function () {
	'use strict';
	var skippedWords = 'true|false|window|document|function';

	return {
		//variableInValue: /(?!('|")\b\w+\b('|"))\b(\w+)(?:\(\))?\b(?!(\'|\")?\s?\:)/g,
		variableInValue: new RegExp('\\b(?!(' + skippedWords + '))(\\w+)(?!\'|")\\b(?!\\:)', 'g'),
		singleVariable: /^\b[a-zA-Z0-9_]+\b$/,
		notSlash: /([^\/])/g,
		primitives: /^true$|^false$|^\d+$|^[\'\"].*[\'\"]$/,
		object: /\{(\s?(\'|")?\w+(\'|")?\s?\:\s?[^,]*\s?,?)+\}/,
		methods: function(methods) {
			return new RegExp('(' + methods.join('|') + ')(?:\\s?\\:\\s?)(.*)');
		}
	};
});