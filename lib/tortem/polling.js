define(function () {
	'use strict';

	var remove = [];

	function polling(func) {
		if (typeof polling.timer === 'undefined' || typeof polling.queue === 'undefined') {
			polling.queue = [];
			polling.id = 0;
			polling.remove = function(func) {
				remove.push(function () {
					if (func._pollingIid) {
						polling.queue = polling.queue.filter(function (item) {
							return item._pollingIid !== func._pollingIid;
						});
						if (polling.queue.length === 0) {
							clearTimeout(polling.timer);
							delete polling.timer;
						}
					}
				});
			};
		}
		if (typeof func !== 'undefined') {
			polling.id++;
			func._pollingIid = polling.id;
			polling.queue.push(func);
		} else {
			for (var i = 0, l = polling.queue.length; i < l; i++) {
				polling.queue[i]();
			}
		}
		while (remove[0]) {
			remove.pop()();
		}
		polling.timer = setTimeout(polling, 250);
	}
	return polling;
});