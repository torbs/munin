define([
	'./text',
	'./attr',
	'./forEach'
],function (Text, Attr, ForEach) {
	'use strict';

	return {
		text	: Text,
		attr	: Attr,
		forEach	: ForEach
	};
});