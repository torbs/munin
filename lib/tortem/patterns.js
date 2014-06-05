define(function () {
	'use strict';
	
	return {
		variableInValue: /\b([a-zA-Z_0-9-]+)(?!\'|")(?![\w-])(?!\s?:)/g,
		singleVariable: /^\b[a-zA-Z0-9_]+\b$/,
		notSlash: /([^\/])/g,
		primitives: /^true$|^false$|^\d+$|^[\'\"].*[\'\"]$/,
		object: /\{(\s?(\'|")?\w+(\'|")?\s?\:\s?[^,]*\s?,?)+\}/,
		methods: function(methods) {
			return new RegExp('(' + methods.join('|') + ')(?:\\s?\\:\\s?)(.*)', 'i');
		},
		tagMethods: function(methods) {
			return new RegExp(methods.join('|'), 'i');
		}
	};
});
		
