define(function () {
	'use strict';

	var fid = 1,
		eventMap = new WeakMap();

	function _getEventsObject(key) {
		var events = eventMap.get(key);

		if (!events) {
			events = {};
			eventMap.set(key, events);
		}
		return events;
	}

	function Events() {
	}

	Events.prototype.on = function(type, path, cb, _prio) {
		// todo use selector string as supplement to element
		var events = _getEventsObject(this);

		if (typeof type !== 'string') {
			throw new Error('Invalid on-event syntax: argument 1 - "type" - must be a "string" not a "' + Object.prototype.toString.call(type) + '"');
		}
		if (typeof path !== 'string' && typeof path !== 'number' && path !== null) {
			throw new Error('Invalid on-event syntax: argument 2 - "path" - must be a "string", "number" or "null" not a "' + Object.prototype.toString.call(path) + '"');
		}
		if (typeof cb !== 'function') {
			throw new Error('Invalid on-event syntax: argument 3 - "callback" - must be a "function" not a "' + Object.prototype.toString.call(cb) + '"');
		}

		if (!cb.fid) {
			cb.fid = fid++;
		}

		if (path === null) {
			path = '_';
		}

		events[type] = events[type] || {};
		events[type][path] = events[type][path] || [];
		if (_prio) {
			events[type][path].unshift(cb);
		} else {
			events[type][path].push(cb);
		}

		return this;
	};

	Events.prototype.trigger = function(type, path, data) {
		var that = this,
			events = _getEventsObject(this),
			i,l;
		if (typeof type !== 'string') {
			throw new Error('Invalid on-event syntax: argument 1 - "type" - must be a "string" not a "' + Object.prototype.toString.call(type) + '"');
		}
		if (typeof path !== 'string' && typeof path !== 'number' && path !== null) {
			throw new Error('Invalid on-event syntax: argument 2 - "path" - must be a "string", "number" or "null" not a "' + Object.prototype.toString.call(path) + '"');
		}

		setImmediate(function () {
			if (events[type]) {
				if (path !== null && events[type][path]) {
					for (i = 0, l = events[type][path].length; i < l; i++) {
						events[type][path][i](data);
					}
				} else { // no path, only data
					for (var key in events[type]) {
						if (events[type].hasOwnProperty(key)) {
							for (i = 0, l = events[type][key].length; i < l; i++) {
								events[type][key][i](path);
							}
						}
					}
				}
			}
		});

		return this;
	};

	Events.prototype.off = function(type, path, cb) {
		var events = _getEventsObject(this);

		if (typeof type !== 'string') {
			throw new Error('Invalid off-event syntax. Type must be a string.');
		}

		function _cbFilter(func) {
			return func.fid !== cb.fid;
		}

		if (typeof path === 'undefined') {
			events[type] = {};
		} else if (typeof path === 'function') {
			cb = path;
			if (cb.fid) {
				for (var key in events[type]) {
					if (events[type].hasOwnProperty(key)) {
						events[type][key] = events[type][key].filter(_cbFilter);
					}
				}
			}
		} else {
			if (cb && cb.fid) {
				events[type][path] = events[type][path].filter(_cbFilter);
			} else if (!cb) {
				events[type][path] = [];
			}
		}

		return this;
	};

	return Events;
});