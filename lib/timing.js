munin.timing = function timingInfo() {
	'use strict';
	var timing;
	if (typeof window.performance === 'undefined') {
		return false;
	}
	timing = window.performance.timing;
	return {
		connection	:  timing.responseEnd - timing.connectStart
	};
};