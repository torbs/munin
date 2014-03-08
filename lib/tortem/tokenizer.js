define(function() {
	'use strict';

	// used to escape strings to use within regexp
	var REGEXP_ESCAPE	= /([.?*+^$[\]\\(){}|-])/g,
		T_EOF			= -1,
		T_ERR			= -2,
		IGNORE_START	= -3,
		TOKEN_START		= 0;

	function _addExpression(args, ignore) {
		/*jshint validthis:true*/
		if (args.length === 0) return;

		var tokenId, expression;

		if (args.length === 1) {
			expression = args[0];
			tokenId = (ignore ? IGNORE_START : TOKEN_START);
		} else {
			tokenId = args[0];
			expression = args[1];
			
			/*jshint validthis:true*/
			tokenId = (
				this.hasOwnProperty(tokenId) ?
				this[tokenId] : this[tokenId] = (
					ignore ? --this.lastIgnoredId : ++this.lastMatchId
				)
			);
		}

		expression = _resolveExpression(expression);
		this.tokenExprs.push('(' + expression + ')');
		this.tokenIds.push(tokenId);
	}

	function _resolveExpression(expression) {
		// check if expression is RegExp literal
		if (expression instanceof RegExp) {
			// turn RegExp to string
			expression = expression.toString();
			// get rid of leading and trailing slashes
			expression = expression.slice(1, -1);
		} else {
			// replace regular expression characters with "\"
			expression = expression.replace(REGEXP_ESCAPE, '\\$1');
		}
		return expression;
	}

	function _consume(sequence, move) {
		/*jshint validthis:true*/
		var result		= [],
			sequencePos	= 0,
			bufferPos	= 0,
			token, comparison, sequenceFrag;

		if (!sequence.length) for (;;) {
			token = _getTokenFromBuffer.call(this, bufferPos);

			if (token.type <= IGNORE_START) {
				bufferPos++;
				continue;
			} else if (move) {
				this.tokenBuffer.splice(0, bufferPos + 1);
			}
			return token;
		} else {
			for (;;) {

				sequenceFrag = sequence[sequencePos];
				token = _getTokenFromBuffer.call(this, bufferPos);
				comparison = _compare(token, sequenceFrag);

				if (comparison === 0) {
					return;
				}

				if (comparison === -1) {
					bufferPos++;
				} else if (sequencePos < sequence.length - 1) {
					result.push(token);
					sequencePos++;
					bufferPos++;
				} else if (comparison === 1) {
					result.push(token);

					if (move) {
						this.tokenBuffer.splice(0, bufferPos + 1);
					}

					if (result.length === 1) {
						return result[0];
					} else {
						return result;
					}
				}
			}
		}
	}

	function _compare(token, selector) {
		var key;
		if (selector instanceof Array) {
			for (var c = 0; c < selector.length; c++) {
				var cResult = _compare(token, selector[c]);
				if (cResult !== 1) {
					continue;
				}
				return cResult;
			}
		}

		key = (typeof selector === 'number' ? 'type' : 'value');
		
		if (key === 'value' && token.type === T_ERR) {
			return 0;
		}

		if (token[key] === selector) {
			return 1;
		} else if (token.type <= IGNORE_START) {
			return -1;
		} else {
			return 0;
		}
	}

	// retrieve token at specific position in the buffer
	// expand buffer in case if offset > buffer size
	function _getTokenFromBuffer(offset) {
		/*jshint validthis:true*/
		var toRead = offset - this.tokenBuffer.length + 1;
		while (toRead-- > 0) {
			_readTokenToBuffer.call(this);
		}
		return this.tokenBuffer[offset];
	}
	
	// match next token and put it into the tokenBuffer
	function _readTokenToBuffer() {
		/*jshint validthis:true*/
		// init local variables
		var startPos, matchPos, matchStr, match, length;
		for (;;) {
			if (this.tokenRegExp.lastIndex !== this.inputLength) {
				startPos = this.tokenRegExp.lastIndex;
				if ( ( match = this.tokenRegExp.exec(this.inputString) ) !== null) {
					matchStr = match[0];
					matchPos = match.index;

					// check if we have T_ERR token
					if ( ( length = matchPos - startPos) > 0 ) {
						this.tokenBuffer.push({
							type: T_ERR,
							pos: startPos,
							value: this.inputString.substr(startPos, length)
						});
					}

					length = match.length;

					// find matched group index
					while (match[length--] === undefined);

					// obtain token info
					match = this.tokenIds[length];

					// match next token in case if this one is ignored
					if (match === IGNORE_START) {continue;}

					// return matched token
					return this.tokenBuffer.push({
						type: match,
						pos: matchPos,
						value: matchStr
					});

				} else { // return T_ERR token in case if we couldn't match anything
					return (
						this.tokenRegExp.lastIndex = this.inputLength,
						this.tokenBuffer.push({
							type: T_ERR,
							pos: startPos,
							value: this.inputString.slice(startPos)
						})
					);
				}
			} else { // return T_EOF if we reached end of file
				return this.tokenBuffer.push({
					type: T_EOF,
					pos: this.inputLength
				});
			}
		}
	}

	function Tokenizer() {

		// input string and it's length
		this.lastMatchId	= TOKEN_START;
		this.lastIgnoredId	= IGNORE_START;
		this.inputString	= '';
		this.inputLength	= 0;
		this.tokenBuffer	= [];
		this.tokenExprs		= [];
		this.tokenRegExp	= null;
		this.tokenIds		= [];
		this.tokenExprs		= [];
	}

	Tokenizer.prototype.tokenize = function(input) {
		this.inputString = input;
		this.inputLength = input.length;
		this.tokenBuffer = [];
		this.tokenRegExp = this.tokenExprs.join('|');
		this.tokenRegExp = new RegExp(this.tokenRegExp, 'g');
		this.tokenRegExp.lastIndex = 0;
	};

	Tokenizer.prototype.T_EOF = T_EOF;

	Tokenizer.prototype.T_ERR = T_ERR;

	Tokenizer.prototype.match = function () {
		_addExpression.call(this, arguments, false);
	};

	Tokenizer.prototype.ignore = function () {
		_addExpression.call(this, arguments, true);
	};

	Tokenizer.prototype.next = function() {
		var selector = Array.prototype.slice.call(arguments);
		return _consume.call(this, selector, true);
	};

	Tokenizer.prototype.test = function() {
		var selector = Array.prototype.slice.call(arguments);
		return !!_consume.call(this, selector, false);
	};

	return Tokenizer;

});