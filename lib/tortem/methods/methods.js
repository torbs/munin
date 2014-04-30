define([
	'./text',
	'./attr',
	'./forEach',
	'./test',
],function (Text, Attr, ForEach, Test) {
	'use strict';

	return {
		text	: Text,
		attr	: Attr,
		forEach	: ForEach,
		test	: Test
	};
});