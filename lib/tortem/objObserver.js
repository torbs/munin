define(['./polling'], function (polling) {
	'use strict';
	var objMap = new WeakMap();

	function Observer(obj) {
		var that = this,
			i, l;

		this.cb = [];
		this.obj = obj;

		if (Object.observe) {
			if (Object.prototype.toString.call(obj) === '[object Array]') {
				Array.observe(obj, function(rec) {
					var prop;
					for (i = 0, l = rec.length;i < l; i++) {
						if (rec[i].type==='splice') {
							prop = rec[i].index;
							that.flush(prop, rec[i].object);
						}
					}
				});
			} else {
				Object.observe(obj, function(rec) {
					var prop;
					for (i = 0, l = rec.length;i < l; i++) {
						if (rec[i].type==='add') {
							prop = rec[i].name;
							that.flush(prop, rec[i].object[prop]);
						}
					}
				});
			}
			
		} else if (window.Proxy) {
			this.proxy = new Proxy(obj, {
				set: function (obj, prop, value) {
					that.flush(prop, value);
				}
			});
		} else {
			var testForKey = function () {
				var keys = Object.keys(obj);
				if (keys.indexOf(prop) !== -1) {
					that.flush(prop, obj[prop]);
				}
			};
			polling(testForKey); // todo remove
		}
	}

	Observer.prototype.flush = function(prop, val) {
		var that = this;
		for (var i = 0, l = that.cb.length; i < l; i++) {
			that.cb[i](prop, val);
		}
	};

	function observe(obj, cb) {
		var observer = objMap.get(obj);
		if (!observer) {
			observer = new Observer(obj);
			objMap.set(obj, observer);
		}
		observer.cb.push(cb);
	}

	return observe;
});