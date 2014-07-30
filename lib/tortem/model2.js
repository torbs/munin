define([
	'./hostobjects',
	'./dataStore',
	'./jsonpath',
	'./event',
	'../utils/nodeTest'
], function (Hostobjects, dataStore, jsonpath, Event, nodeTest) {
	'use strict';

	//TODO use Object.observe if supported

	var hasDefineProperty = (function() {
			var test = {};
			
			try {
				Object.defineProperty(test, '_tortem', {
					writable: true
				});
				return true;
			} catch (e) {
				return false;
			}
		}()),
		hObj = new Hostobjects();

	function _isArray(obj) {
		var test = obj;
		return (Object.prototype.toString.call(test) === '[object Array]');
	}

	function _createModel(data, _current) {
		var dStore,
			ret = _current || false; // todo does nothing

		if (typeof data !== 'object') {
			return data;
		}

		if (_isArray(data)) {
			ret = hasDefineProperty ? new hObj['Array']() : hObj.document.createElement('tArray');
			dStore = hasDefineProperty ? new hObj['Array']() : hObj.document.createElement('tArray');
			for (var i = 0, l = data.length; i < l; i++) {
				ret[i] = _createModel(data[i]);
			}
		} else {
			ret = hasDefineProperty ? {} : hObj.document.createElement('tObject');
			dStore = hasDefineProperty ? {} : hObj.document.createElement('tObject');
			for (var key in data) {
				if (data.hasOwnProperty(key)) {
					ret[key] = _createModel(data[key]);
				}
			}
		}

		return ret;
	}

	function Model(data) {
		this.data = _createModel(data);
		if (typeof data !== 'undefined') {
			dataStore.set(this.data, _createModel(data));
		}
	}

	Model.prototype = Object.create(Event.prototype);

	Model.prototype.add = function(data, path) {
		if (path) {
			_createModel(data, this.find.call(this, path).obj);
		} else {
			this.data = _createModel(data);
		}
	};

	Model.prototype.find = function(path) {
		var current;
		current = jsonpath.resolve(this.data, path);
		if (current.path !== false) {
			current.match = jsonpath.create(current.match, current.path);
		}
		return {
			obj: current.match,
			created: !!current.path
		};
	};

	Model.prototype.setExpressionValue = function(path, expr, result) {
		var that = this,
			dStore = dataStore.get(this.find.call(this, path).obj);

		dStore[expr] = function(val) {
			if (typeof val === 'undefined') {
				return (typeof result.value !== 'undefined' ? result.value(that.data) : result.objectValue);
			}
		};
	};

	Model.prototype.getDataStore = function(path) {
		return dataStore.get(this.find.call(this, path).obj);
	};

	Model.prototype.getExpression = function(expr) {

	};

	Model.prototype.addSetter = function(obj, prop, method, options) {

	};

	return Model;
});