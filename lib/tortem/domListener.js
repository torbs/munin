define(['./mutationObserver'], function () {
	'use strict';

	if (typeof MutationObserver === 'undefined') {
		throw new Error('Browser is not supported');
	}

	function DomListener(element, observerType, cb) {
		var type, mObserver;

		if (!element && !observerType && !cb) {
			throw new Error('Missing arguments for createDomListener. Need "container", "type" and "callback"');
		}
		if (typeof observerType === 'string') {
			type = {};
			type[observerType] = true;
		} else {
			type = observerType;
		}

		if (MutationObserver) {
			mObserver = new MutationObserver(function (mutations) {
				mutations.forEach(function (record) {
					if (record.type in type) {
						cb(record.type);
					}
				});
			});

			mObserver.observe(element, {
				attributes		: 'attributes' in type,
				subtree			: 'subtree' in type,
				childList		: 'childList' in type,
				characterData	: 'characterData' in type
			});
		}
	}

	return DomListener;
});