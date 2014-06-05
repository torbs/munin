define([
	'./text',
	'./attr',
	'./forEach',
	'./test',
	'./template'
],function (Text, Attr, ForEach, Test, Template) {
	'use strict';
	
	return {
		text	: Text,
		attr	: Attr,
		foreach	: ForEach,
		test	: Test,
		template: Template
	};
});