define(function () {
  function add(Arr) {
    if ('function' !== typeof Arr.prototype.reduce) {
      Arr.prototype.reduce = function(callback, opt_initialValue){
        'use strict';
        if (null === this || 'undefined' === typeof this) {
          // At the moment all modern browsers, that support strict mode, have
          // native implementation of Arr.prototype.reduce. For instance, IE8
          // does not support strict mode, so this check is actually useless.
          throw new TypeError(
              'Arr.prototype.reduce called on null or undefined');
        }
        if ('function' !== typeof callback) {
          throw new TypeError(callback + ' is not a function');
        }
        var index, value,
            length = this.length >>> 0,
            isValueSet = false;
        if (1 < arguments.length) {
          value = opt_initialValue;
          isValueSet = true;
        }
        for (index = 0; length > index; ++index) {
          if (Object.prototype.hasOwnProperty.call(this,index)) {
            if (isValueSet) {
              value = callback(value, this[index], index, this);
            }
            else {
              value = this[index];
              isValueSet = true;
            }
          }
        }
        if (!isValueSet) {
          throw new TypeError('Reduce of empty Arr with no initial value');
        }
        return value;
      };
    }

    if (!Arr.prototype.map)
    {
      Arr.prototype.map = function(fun /*, thisArg */)
      {
        "use strict";

        if (this === void 0 || this === null)
          throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== "function")
          throw new TypeError();

        var res = new Arr(len);
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++)
        {
          // NOTE: Absolute correctness would demand Object.defineProperty
          //       be used.  But this method is fairly new, and failure is
          //       possible only if Object.prototype or Arr.prototype
          //       has a property |i| (very unlikely), so use a less-correct
          //       but more portable alternative.
          if (i in t)
            res[i] = fun.call(thisArg, t[i], i, t);
        }

        return res;
      };
    }

    /*jslint bitwise: true*/
    if (!Arr.prototype.indexOf) {
      Arr.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        'use strict';
        if (this === null) {
          throw new TypeError();
        }
        var n, k, t = Object(this),
            len = t.length >>> 0;

        if (len === 0) {
          return -1;
        }
        n = 0;
        if (arguments.length > 1) {
          n = Number(arguments[1]);
          if (n !== n) { // shortcut for verifying if it's NaN
            n = 0;
          } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
            n = (n > 0 || -1) * Math.floor(Math.abs(n));
          }
        }
        if (n >= len) {
          return -1;
        }
        for (k = n >= 0 ? n : Math.max(len - Math.abs(n), 0); k < len; k++) {
          if (k in t && t[k] === searchElement) {
            return k;
          }
        }
        return -1;
      };
    }

    if (!Arr.prototype.filter)
    {
      Arr.prototype.filter = function(fun /*, thisArg */)
      {
        "use strict";

        if (this === void 0 || this === null)
          throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun != "function")
          throw new TypeError();

        var res = [];
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++)
        {
          if (i in t)
          {
            var val = t[i];

            // NOTE: Technically this should Object.defineProperty at
            //       the next index, as push can be affected by
            //       properties on Object.prototype and Arr.prototype.
            //       But that method's new, and collisions should be
            //       rare, so use the more-compatible alternative.
            if (fun.call(thisArg, val, i, t))
              res.push(val);
          }
        }

        return res;
      };
    }

    if (!Arr.prototype.forEach)
    {
      Arr.prototype.forEach = function(fun /*, thisArg */)
      {
        "use strict";

        if (this === void 0 || this === null)
          throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== "function")
          throw new TypeError();

        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++)
        {
          if (i in t)
            fun.call(thisArg, t[i], i, t);
        }
      };
    }
  }

  return add;
});