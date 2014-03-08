define(function() {
	'use strict';
	//Returns true if it is a DOM node
	function isNode(o){
		return (
			typeof Node === 'object' ? o instanceof Node :
			o && typeof o === 'object' && typeof o.nodeType === 'number' && typeof o.nodeName === 'string'
		);
	}

	//Returns true if it is a DOM element    
	function isElement(o){
		return (
			typeof HTMLElement === 'object' ? o instanceof HTMLElement : //DOM2
			o && typeof o === 'object' && o !== null && o.nodeType === 1 && typeof o.nodeName === 'string'
		);
	}

	return {
		isElement: isElement,
		isNode: isNode
	};
});