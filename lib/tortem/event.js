define(function () {
	'use strict';

	var fid = 1;
	function Events() {
		this.events = {};
	}

	Events.prototype.on = function(type, path, cb, _prio) {
		// todo use selector string as supplement to element
		if (typeof type !== 'string' || typeof path !== 'string' || typeof cb !== 'function') {
			throw new Error('Invalid on-event syntax');
		}

		if (!cb.fid) {
			cb.fid = fid++;
		}

		this.events[type] = this.events[type] || {};
		this.events[type][path] = this.events[type][path] || [];
		if (_prio) {
			this.events[type][path].unshift(cb);
		} else {
			this.events[type][path].push(cb);
		}

		return this;
	};

	Events.prototype.trigger = function(type, path, data) {
		var that = this,
			i,l;
		if (typeof type !== 'string' || typeof path !== 'string') {
			throw new Error('Invalid trigger-event syntax');
		}
		setImmediate(function () {
			if (that.events[type]) {
				if (typeof path === 'string' && that.events[type][path]) {
					for (i = 0, l = that.events[type][path].length; i < l; i++) {
						that.events[type][path][i](data);
					}
				} else if (typeof path !== 'string') { // no path, only data
					for (var key in that.events[type]) {
						if (that.events[type].hasOwnProperty(key)) {
							for (i = 0, l = that.events[type][key].length; i < l; i++) {
								that.events[type][key][i](path);
							}
						}
					}
				}
			}
		});

		return this;
	};

	Events.prototype.off = function(type, path, cb) {
		if (typeof type !== 'string') {
			throw new Error('Invalid off-event syntax. Type must be a string.');
		}

		function _cbFilter(func) {
			return func.fid !== cb.fid;
		}

		if (typeof path === 'undefined') {
			this.events[type] = {};
		} else if (typeof path === 'function') {
			cb = path;
			if (cb.fid) {
				for (var key in this.events[type]) {
					if (this.events[type].hasOwnProperty(key)) {
						this.events[type][key] = this.events[type][key].filter(_cbFilter);
					}
				}
			}
		} else {
			if (cb && cb.fid) {
				this.events[type][path] = this.events[type][path].filter(_cbFilter);
			} else if (!cb) {
				this.events[type][path] = [];
			}
		}

		return this;
	};

	return Events;
});