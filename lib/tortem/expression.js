define(['./dataStore', './patterns',], function (dataStore, patterns) {
	/*
	Some of the following code is copied/influenced by knockout.js 

	The MIT License (MIT) - http://www.opensource.org/licenses/mit-license.php

	Copyright (c) Steven Sanderson, the Knockout.js team, and other contributors
	http://knockoutjs.com/

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
	*/

	var javaScriptReservedWords = ['true', 'false', 'null', 'undefined'];

	// Matches something that can be assigned to--either an isolated identifier or something ending with a property accessor
	// This is designed to be simple and avoid false negatives, but could produce false positives (e.g., a+b.c).
	// This also will not properly handle nested brackets (e.g., obj1[obj2['prop']]; see #911).
	var javaScriptAssignmentTarget = /^(?:[$_a-z][$\w]*|(.+)(\.\s*[$_a-z][$\w]*|\[.+\]))$/i;

	function getWriteableValue(expression) {
		if (ko.utils.arrayIndexOf(javaScriptReservedWords, expression) >= 0) {
			return false;
		}
		
		var match = expression.match(javaScriptAssignmentTarget);
		
		return match === null ? false : match[1] ? ('Object(' + match[1] + ')' + match[2]) : expression;
	}

	// The following regular expressions will be used to split an object-literal string into tokens

		// These two match strings, either with double quotes or single quotes
	var stringDouble = '"(?:[^"\\\\]|\\\\.)*"',
		stringSingle = "'(?:[^'\\\\]|\\\\.)*'",
		// Matches a regular expression (text enclosed by slashes), but will also match sets of divisions
		// as a regular expression (this is handled by the parsing loop below).
		stringRegexp = '/(?:[^/\\\\]|\\\\.)*/w*',
		// These characters have special meaning to the parser and must not appear in the middle of a
		// token, except as part of a string.
		specials = ',"\'{}()/:[\\]',
		// Match text (at least two characters) that does not contain any of the above special characters,
		// although some of the special characters are allowed to start it (all but the colon and comma).
		// The text can contain spaces, but leading or trailing spaces are skipped.
		everyThingElse = '[^\\s:,/][^' + specials + ']*[^\\s' + specials + ']',
		// Match any non-space character not matched already. This will match colons and commas, since they're
		// not matched by "everyThingElse", but will also match any other single character that wasn't already
		// matched (for example: in "a: 1, b: 2", each of the non-space characters will be matched by oneNotSpace).
		oneNotSpace = '[^\\s]',

		// Create the actual regular expression by or-ing the above strings. The order is important.
		bindingToken = RegExp(stringDouble + '|' + stringSingle + '|' + stringRegexp + '|' + everyThingElse + '|' + oneNotSpace, 'g'),

		// Match end of previous token to determine whether a slash is a division or regex.
		divisionLookBehind = /[\])"'A-Za-z0-9_$]+$/,
		keywordRegexLookBehind = {'in':1,'return':1,'typeof':1};

	function parseObjectLiteral(str) {
		// Trim braces '{' surrounding the whole object literal
		if (str.charCodeAt(0) === 123) {
			str = str.slice(1, -1);
		}

		// Split into tokens
		var result	= [],
			toks	= str.match(bindingToken),
			depth	= 0,
			key, values;

		if (toks) {
			// Append a comma so that we don't need a separate code block to deal with the last item
			toks.push(',');

			for (var i = 0, tok; (tok = toks[i]); ++i) {
				var c = tok.charCodeAt(0);
				// A comma signals the end of a key/value pair if depth is zero
				if (c === 44) { // ","
					if (depth <= 0) {
						if (key) {
							result.push(values ? {key: key, value: values.join('')} : {'unknown': key});
						}
						key = values = depth = 0;
						continue;
					}
				// Simply skip the colon that separates the name and value
				} else if (c === 58) { // ":"
					if (!values) {
						continue;
					}
				// A set of slashes is initially matched as a regular expression, but could be division
				} else if (c === 47 && i && tok.length > 1) {  // "/"
					// Look at the end of the previous token to determine if the slash is actually division
					var match = toks[i-1].match(divisionLookBehind);
					if (match && !keywordRegexLookBehind[match[0]]) {
						// The slash is actually a division punctuator; re-parse the remainder of the string (not including the slash)
						str = str.substr(str.indexOf(tok) + 1);
						toks = str.match(bindingToken);
						toks.push(',');
						i = -1;
						// Continue with just the slash
						tok = '/';
					}
				// Increment depth for parentheses, braces, and brackets so that interior commas are ignored
				} else if (c === 40 || c === 123 || c === 91) { // '(', '{', '['
					++depth;
				} else if (c === 41 || c === 125 || c === 93) { // ')', '}', ']'
					--depth;
				// The key must be a single token; if it's a string, trim the quotes
				} else if (!key && !values) {
					key = (c === 34 || c === 39) /* '"', "'" */ ? tok.slice(1, -1) : tok;
					continue;
				}
				if (values) {
					values.push(tok);
				} else {
					values = [tok];
				}
			}
		}
		return result;
	}
	/* end knockout copy */

	function parse(model, path, prop, cb) {
		var involvedProps	= [],
			objectValue		= [],
			expr, exprStr, dStore;

		path = path.match(patterns.notSlash) || [];
		model = path.reduce(function (prev, curr) {
			return prev[curr];
		}, model); // traverse down object

		// TODO map model keys to attributes
		// is object
		if (prop.charCodeAt(0) === 123) {
			objectValue = parseObjectLiteral(prop);
		}

		// TODO iteration
		exprStr = prop.replace(patterns.variableInValue, function (item) {
			if (patterns.primitives.test(item) || ['true','false','window','document','function'].indexOf(item) !== -1) {
				return item;
			}
			involvedProps.push(item);
			return 'model[\'' + item + '\']';
		});

		cb({
			properties: involvedProps,
			objectValue: objectValue,
			value: new Function('model', 'return ' + exprStr + ';')
		});
	}

	return {
		parseObjectLiteral: parseObjectLiteral,
		parse: parse
	};
});