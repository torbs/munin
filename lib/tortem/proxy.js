define(function () {
	'use strict';
	function Observer(obj, prop, cb) {
		var proxy, i, l;

		if (Object.observe) {
			if (Object.prototype.toString.call(obj) === '[object Array]') {
				Array.observe(obj, function(rec) {
					for (i = 0, l = rec.length;i < l; i++) {
						if (rec[i].type === 'add') {
							cb(rec[i].object[prop]);
						}
					}
				});
			} else {
				Object.observe(obj, function(rec) {
					for (i = 0, l = rec.length;i < l; i++) {
						if (rec[i].type === 'add') {
							dataStore[prop] = _clone(rec[i].object[prop]);
							_applySetters(setters);
						}
					}
				});
			}
			
		} else if (window.Proxy) {
			proxy = observers.get(obj);
			if (!proxy) {
				proxy = new Proxy(obj, {
					set: function (obj, prop, value) {
						dataStore[prop] = _clone(value);
						_applySetters(setters);
					}
				});
			}
		} else {
			var testForKey = function () {
				var keys = Object.keys(obj);
				if (keys.indexOf(prop) !== -1) {
					dataStore[prop] = obj[prop];
					_applySetters(setters);
				}
			};
			polling(testForKey); // todo remove
		}
	}
	}
});