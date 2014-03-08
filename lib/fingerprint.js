munin.fingerprint = function (cb) {
	var nativeForEach	= Array.prototype.forEach,
		nativeMap		= Array.prototype.map;

	function _each(obj, iterator, context) {
		if (obj === null) {
			return;
		}
		if (nativeForEach && obj.forEach === nativeForEach) {
			obj.forEach(iterator, context);
		} else if (obj.length === +obj.length) {
			for (var i = 0, l = obj.length; i < l; i++) {
				if (iterator.call(context, obj[i], i, obj) === {}) {
					return;
				}
			}
		} else {
			for (var key in obj) {
				if (obj.hasOwnProperty(key) && iterator.call(context, obj[key], key, obj) === {}) {
					return;
				}
			}
		}
	}

	function _map(obj, iterator, context) {
		var results = [];
		if (typeof obj === 'null' || typeof obj === 'undefined') {
			return results;
		}
	
		if (nativeMap && obj.map === nativeMap) {
			return obj.map(iterator, context);
		}

		_each(obj, function(value, index, list) {
			results[results.length] = iterator.call(context, value, index, list);
		});
		return results;
	}

	/**
	 * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
	 * 
	 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
	 * @see http://github.com/garycourt/murmurhash-js
	 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
	 * @see http://sites.google.com/site/murmurhash/
	 * 
	 * @param {string} key ASCII only
	 * @param {number} seed Positive integer only
	 * @return {number} 32-bit positive integer hash 
	 */

	function murmurhash3_32_gc(key, seed) {
		var remainder, bytes, h1, h1b, c1, c1b, c2, c2b, k1, i;

		remainder = key.length & 3; // key.length % 4
		bytes = key.length - remainder;
		h1 = seed;
		c1 = 0xcc9e2d51;
		c2 = 0x1b873593;
		i = 0;

		while (i < bytes) {
			k1 =((key.charCodeAt(i) & 0xff)) |
				((key.charCodeAt(++i) & 0xff) << 8) |
				((key.charCodeAt(++i) & 0xff) << 16) |
				((key.charCodeAt(++i) & 0xff) << 24);
			++i;
			
			k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
			k1 = (k1 << 15) | (k1 >>> 17);
			k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

			h1 ^= k1;
			h1 = (h1 << 13) | (h1 >>> 19);
			h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
			h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
		}

		k1 = 0;

		switch (remainder) {
			case 3:
				k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
				/* falls through */
			case 2:
				k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
				/* falls through */
			case 1:
				k1 ^= (key.charCodeAt(i) & 0xff);
			
				k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
				k1 = (k1 << 15) | (k1 >>> 17);
				k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
				h1 ^= k1;
		}

		h1 ^= key.length;

		h1 ^= h1 >>> 16;
		h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
		h1 ^= h1 >>> 13;
		h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
		h1 ^= h1 >>> 16;

		return h1 >>> 0;
	}

	var tests = {
		// https://bugzilla.mozilla.org/show_bug.cgi?id=781447
		hasLocalStorage: function () {
			var test = 'test';
			try {
				localStorage.setItem(test, test);
				localStorage.removeItem(test);
				return true;
			} catch(e) {
				return false;
			}
		},

		hasSessionStorage: function () {
			var test = 'test';
			try {
				sessionStorage.setItem(test, test);
				sessionStorage.removeItem(test);
				return true;
			} catch(e) {
				return false;
			}
		},

		isCanvasSupported: function () {
			var elem = document.createElement('canvas');
			return !!(elem.getContext && elem.getContext('2d'));
		},

		isIE: function () {
			if(navigator.appName === 'Microsoft Internet Explorer') {
				return true;
			} else if(navigator.appName === 'Netscape' && /Trident/.test(navigator.userAgent)){// IE 11
				return true;
			}
			return false;
		},

		getPluginsString: function () {
			if(tests.isIE()){
				return tests.getIEPluginsString();
			} else {
				return tests.getRegularPluginsString();
			}
		},

		getRegularPluginsString: function () {
			return _map(navigator.plugins, function (p) {
				var mimeTypes = _map(p, function(mt){
					return [mt.type, mt.suffixes].join('~');
				}).join(',');
			
				return [p.name, p.description, mimeTypes].join('::');
			}, this).join(';');
		},

		getIEPluginsString: function () {
			var names = ['ShockwaveFlash.ShockwaveFlash',//flash plugin
				'AcroPDF.PDF', // Adobe PDF reader 7+
				'PDF.PdfCtrl', // Adobe PDF reader 6 and earlier, brrr
				'QuickTime.QuickTime', // QuickTime
				// 5 versions of real players
				'rmocx.RealPlayer G2 Control',
				'rmocx.RealPlayer G2 Control.1',
				'RealPlayer.RealPlayer(tm) ActiveX Control (32-bit)',
				'RealVideo.RealVideo(tm) ActiveX Control (32-bit)',
				'RealPlayer',
				'SWCtl.SWCtl', // ShockWave player
				'WMPlayer.OCX', // Windows media player
				'AgControl.AgControl', // Silverlight
				'Skype.Detection'];
			
			if(window.ActiveXObject){
				// starting to detect plugins in IE
				return _map(names, function(name){
					try{
						new ActiveXObject(name);
						return name;
					} catch(e){
						return null;
					}
				}).join(';');
			} else {
				return ''; // behavior prior version 0.5.0, not breaking backwards compat.
			}
		},

		getCanvasFingerprint: function () {
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');
			// https://www.browserleaks.com/canvas#how-does-it-work
			var txt = 'http://valve.github.io';
			ctx.textBaseline = "top";
			ctx.font = "14px 'Arial'";
			ctx.textBaseline = "alphabetic";
			ctx.fillStyle = "#f60";
			ctx.fillRect(125,1,62,20);
			ctx.fillStyle = "#069";
			ctx.fillText(txt, 2, 15);
			ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
			ctx.fillText(txt, 4, 17);
			return canvas.toDataURL();
		},

		font: function(cb) {
			var fonts	= ['American Typewriter','Gill Sans','Hoefler Text','Marker Felt','Chalkboard','Helvetica','Times New Roman','Futura','Courier New','Jazz LET','Santa Fe LET','Savoye LET','Monaco','Skia','Snell Roundhand','Apple Chancery','Zapfino','American Typewriter Condensed','Arial Rounded MT Bold','Sketch Rockwell','Trajan','Univers CE 55 Medium','Cambria','Book antiqua','Century gothic','Century','Corbel','Franklin Gothic Medium','Andale Mono','Arial Black','Arial Narrow','Arial','Ayuthaya','Bandy','Bank Gothic','Baskerville','Big Caslon','Comic Sans','Cochin','Geneva','Georgia','Impact','Krungthep','Minion Pro','Nadeem','Papyrus','PetitaBold','Styllo','Synchro LET','Tahoma','Times','Trebuchet MS','Verdana','Mona Lisa Solid ITC TT','Palatino','Centaur','Jenson','Bembo','Adobe Garamond','Minion','Times New Roman','Mrs Eaves','Bauer Bodoni','Didot','Clarendon','Rockwell','Serifa','Franklin Gothic','News Gothic','Helvetica Neue','Univers','Fruitger','Copperplate Gothic','BlairMdITC TT','CALIBRI','HELV','COURIER','COMIC SANS MS','GARAMOND','GOTHAM', 'MYRIAD PRO','WEBDINGS','CONSOLAS','DIN','LUCIDA SANS','SYMBOL','OPTIMA','FRUTIGER','BAUHAUS 93','CHILLER','TRAJAN PRO','SCRIPT','LATHA','ARNO PRO','BOOKMAN OLD STYLE','DELICIOUS','SEGOE UI','ALGERIAN','AVENIR','LUCIDA CONSOLE','PALATINO LINOTYPE','BELL MT','ADOBE CASLON PRO','LUCIDA GRANDE','STENCIL','ARIAL','MUSEO','ARCHER','CANDARA','CURLZ MT','KARTIKA','EUROSTILE','TUNGA','MONO','SCRIPTINA','BATANG','GILL SANS MT','AGENCY FB','BROADWAY','INCONSOLATA','MONOTYPE CORSIVA','PERPETUA','JOKERMAN','FONTIN','SYSTEM', 'ZAPF DINGBATS','CONSTANTIA','ADOBE GARAMOND PRO','ELEPHANT','SILKSCREEN','GAUTAMI','PLAYBILL','GOUDY OLD STYLE','MAGNETO','VRINDA','WHITNEY','MYRIAD','CASTELLAR','INTERSTATE','MANGAL','BLACKADDER ITC','FORTE','EDWARDIAN SCRIPT ITC','NEVIS','GOTHAM BOLD','HARRINGTON','OSAKA','PRINCETOWN LET','Academy Engraved LET','Apple Color Emoji','Apple SD Gothic Neo','Arial Hebrew','Bangla Sangam MN','Bodoni 72','Bodoni 72 Oldstyle','Bodoni 72 Smallcaps','Bradley Hand','Chalkboard SE','Chalkduster','Copperplate','DB LCD Temp','Devanagari Sangam MN','Euphemia UCAS','Geeza Pro','Gujarati Sangam MN','Gurmukhi MN','Heiti SC','Heiti TC','Hiragino Kaku Gothic ProN','Hiragino Mincho ProN','Kailasa','Kannada Sangam MN','Malayalam Sangam MN','Marion','Marker Felt','Noteworthy','Oriya Sangam MN','Party LET','Sinhala Sangam MN','Tamil Sangam MN','Telugu Sangam MN','Thonburi','Times New Roman'],
				el		= document.createElement('div'),
				testEl	= document.createElement('span'),
				len		= fonts.length, i = 0,
				res		= [];

			testEl.innerHTML = 'abcd efgh ijkl mnop qrst uvwx zyæøå,.!"+-*/';
			el.style.cssText = 'position:absolute;top:0;left:-10000px; visibility:hidden, width:300px';
			el.appendChild(testEl);
			document.body.appendChild(el);

			function _absentFont(font, comparison) {
				var fw,fh,cw,ch;
				testEl.style.fontFamily = comparison;
				ch = testEl.offsetHeight;
				cw = testEl.offsetWidth;

				testEl.style.fontFamily = font;
				fh = testEl.offsetHeight;
				fw = testEl.offsetWidth;
				return (ch === fh && cw === fw);
			}

			function _isFontInstalled(font) {
				if (!(_absentFont(font, 'Serif') || _absentFont(font, 'Sans-Serif'))) {
					res.push(font);
				}
			}

			function _computeFonts() {
				var i = 0;

				while(len--) {
					_isFontInstalled(fonts[len]);
					if (i === 20) {
						setTimeout(_computeFonts, 15);
						break;
					}
					i++;
				}

				if (len===-1) {
					cb(res.join());
				}
			}
			_computeFonts();
		}
	};

	function get(cb) {
		var keys = [
			navigator.userAgent,
			navigator.language,
			new Date().getTimezoneOffset(),
			tests.hasSessionStorage(),
			tests.hasLocalStorage(),
			!!window.indexedDB,
			typeof(document.body.addBehavior),
			typeof(window.openDatabase),
			navigator.cpuClass,
			navigator.platform,
			navigator.doNotTrack, // TODO
			tests.getPluginsString(),
			tests.getCanvasFingerprint()
		];
		tests.font(function (fontstring) {
			keys.push(fontstring);
			cb(murmurhash3_32_gc(keys.join('###'), 31));
		});
	}
	return get;
}();