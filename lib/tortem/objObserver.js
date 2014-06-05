define(['../utils/nodeTest'], function (nodeTest) {
	'use strict';
	var objMap = new WeakMap();

	function Observer(obj) {
		var that = this,
			i, l, j, m, type, props, tostr;

		this.cb = [];
		this.obj = obj;

		function _observeArray(rec) {
			var indx;
			for (i = 0, l = rec.length;i < l; i++) {
				if (rec[i].type==='splice') {
					if (rec[i].removed.length > 0)  {
						// array remove
						type = 'remove';
						props = rec[i].removed;
						indx = rec[i].index;
						m = rec[i].removed.length;

						for (j = 0; j < m; j++) {
							that.flush(j+indx, props[j], type);
						}
					}

					if (rec[i].addedCount > 0) {
						type = 'add';
						props = rec[i].object;
						indx = 0;
						m = rec[i].index + rec[i].addedCount;
						for (j = rec[i].index; j < m; j++) {
							that.flush(j+indx, props[j], type);
						}
					}
				}
			}
		}

		tostr = Object.prototype.toString.call(obj);
		if (tostr === '[object Array]' || (nodeTest.isElement(obj) && obj.nodeName === 'tArray')) {
			if (Array.observe) {
				Array.observe(obj, _observeArray);
			} else {
				obj._observers = obj._observers || [];
				obj._observers.push(_observeArray);
				
			}
		}

		if (tostr !== '[object Array]' || (nodeTest.isElement(obj) && obj.nodeName === 'tObject')) {
			if (Object.observe) {
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
		}
		/*	
		} else if (window.Proxy) {
			this.proxy = new Proxy(obj, {
				get: function () {
					console.log('get');
				},
				set: function (obj, prop, value) {
					console.log('set');
				}
			});
		} else {
			var testForKey = function () {
				var keys = Object.keys(obj);
				if (keys.indexOf(prop) !== -1) {
					that.flush(prop, obj[prop]);
				}
			};
			polling(testForKey); 
		}
		*/
	}

	Observer.prototype.flush = function(prop, val, type) {
		var that = this;
		
		for (var i = 0, l = that.cb.length; i < l; i++) {
			that.cb[i](prop, val, type);
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