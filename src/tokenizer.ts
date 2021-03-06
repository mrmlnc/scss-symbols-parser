'use strict';

// The MIT License (MIT)

// Copyright 2013 Andrey Sitnik <andrey@sitnik.ru>

// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// ## CHANGES
//   * `//` - comment
//   * Remove `options.ignore`
//   * Simplify tokens: returns only position without details

const SINGLE_QUOTE = '\''.charCodeAt(0);
const DOUBLE_QUOTE = '"'.charCodeAt(0);
const BACKSLASH = '\\'.charCodeAt(0);
const SLASH = '/'.charCodeAt(0);
const NEWLINE = '\n'.charCodeAt(0);
const SPACE = ' '.charCodeAt(0);
const FEED = '\f'.charCodeAt(0);
const TAB = '\t'.charCodeAt(0);
const CR = '\r'.charCodeAt(0);
const OPEN_SQUARE = '['.charCodeAt(0);
const CLOSE_SQUARE = ']'.charCodeAt(0);
const OPEN_PARENTHESES = '('.charCodeAt(0);
const CLOSE_PARENTHESES = ')'.charCodeAt(0);
const OPEN_CURLY = '{'.charCodeAt(0);
const CLOSE_CURLY = '}'.charCodeAt(0);
const SEMICOLON = ';'.charCodeAt(0);
const ASTERISK = '*'.charCodeAt(0);
const COLON = ':'.charCodeAt(0);
const AT = '@'.charCodeAt(0);

const RE_AT_END = /[ \n\t\r\f\{\(\)'"\\;/\[\]#]/g;
const RE_WORD_END = /[ \n\t\r\f\(\)\{\}:;@!'"\\\]\[#]|\/(?=\*)/g;
const RE_BAD_BRACKET = /.[\\\/\("'\n]/;

export default function tokenizer(text: string) {
	const tokens = [];

	let code, next, quote, lines, last, content, escape,
		nextLine, nextOffset, escaped, escapePos, prev, n;

	const length = text.length;
	let offset = -1;
	let line = 1;
	let pos = 0;

	while (pos < length) {
		code = text.charCodeAt(pos);

		if (code === NEWLINE || code === FEED ||
			code === CR && text.charCodeAt(pos + 1) !== NEWLINE) {
			offset = pos;
			line += 1;
		}

		switch (code) {
			case NEWLINE:
			case SPACE:
			case TAB:
			case CR:
			case FEED:
				next = pos;
				do {
					next += 1;
					code = text.charCodeAt(next);
					if (code === NEWLINE) {
						offset = next;
						line += 1;
					}
				} while (code === SPACE ||
				code === NEWLINE ||
				code === TAB ||
				code === CR ||
					code === FEED);

				tokens.push(['space', text.slice(pos, next)]);
				pos = next - 1;
				break;

			case OPEN_SQUARE:
				tokens.push(['[', '[', pos]);
				break;

			case CLOSE_SQUARE:
				tokens.push([']', ']', pos]);
				break;

			case OPEN_CURLY:
				tokens.push(['{', '{', pos]);
				break;

			case CLOSE_CURLY:
				tokens.push(['}', '}', pos]);
				break;

			case COLON:
				tokens.push([':', ':', pos]);
				break;

			case SEMICOLON:
				tokens.push([';', ';', pos]);
				break;

			case OPEN_PARENTHESES:
				prev = tokens.length ? tokens[tokens.length - 1][1] : '';
				n = text.charCodeAt(pos + 1);
				if (prev === 'url' && n !== SINGLE_QUOTE && n !== DOUBLE_QUOTE &&
					n !== SPACE && n !== NEWLINE && n !== TAB &&
					n !== FEED && n !== CR) {
					next = pos;
					do {
						escaped = false;
						next = text.indexOf(')', next + 1);
						if (next === -1) {
							next = pos;
							break;
						}
						escapePos = next;
						while (text.charCodeAt(escapePos - 1) === BACKSLASH) {
							escapePos -= 1;
							escaped = !escaped;
						}
					} while (escaped);

					tokens.push(['brackets', text.slice(pos, next + 1), pos]);
					pos = next;

				} else {
					next = text.indexOf(')', pos + 1);
					content = text.slice(pos, next + 1);

					if (next === -1 || RE_BAD_BRACKET.test(content)) {
						tokens.push(['(', '(', pos]);
					} else {
						tokens.push(['brackets', content, pos]);
						pos = next;
					}
				}

				break;

			case CLOSE_PARENTHESES:
				tokens.push([')', ')', pos]);
				break;

			case SINGLE_QUOTE:
			case DOUBLE_QUOTE:
				quote = code === SINGLE_QUOTE ? '\'' : '"';
				next = pos;
				do {
					escaped = false;
					next = text.indexOf(quote, next + 1);
					if (next === -1) {
						next = pos + 1;
						break;
					}
					escapePos = next;
					while (text.charCodeAt(escapePos - 1) === BACKSLASH) {
						escapePos -= 1;
						escaped = !escaped;
					}
				} while (escaped);

				content = text.slice(pos, next + 1);
				lines = content.split('\n');
				last = lines.length - 1;

				if (last > 0) {
					nextLine = line + last;
					nextOffset = next - lines[last].length;
				} else {
					nextLine = line;
					nextOffset = offset;
				}

				tokens.push(['string', text.slice(pos, next + 1), pos]);

				offset = nextOffset;
				line = nextLine;
				pos = next;
				break;

			case AT:
				RE_AT_END.lastIndex = pos + 1;
				RE_AT_END.test(text);
				if (RE_AT_END.lastIndex === 0) {
					next = text.length - 1;
				} else {
					next = RE_AT_END.lastIndex - 2;
				}
				tokens.push(['at-word', text.slice(pos, next + 1), pos]);
				pos = next;
				break;

			case BACKSLASH:
				next = pos;
				escape = true;
				while (text.charCodeAt(next + 1) === BACKSLASH) {
					next += 1;
					escape = !escape;
				}
				code = text.charCodeAt(next + 1);
				if (escape && (code !== SLASH &&
					code !== SPACE &&
					code !== NEWLINE &&
					code !== TAB &&
					code !== CR &&
					code !== FEED)) {
					next += 1;
				}
				tokens.push(['word', text.slice(pos, next + 1), pos]);
				pos = next;
				break;

			default:
				const isLessComent = code === SLASH && text.charCodeAt(pos + 1) === SLASH;
				if (isLessComent || text.charCodeAt(pos + 1) === ASTERISK) {
					if (isLessComent) {
						next = pos;
						while (text.charCodeAt(next) !== NEWLINE && next < length) {
							next++;
						}
					} else {
						next = text.indexOf('*/', pos + 2) + 1;
					}

					if (next === 0 || next === length) {
						next = length;
					}

					content = text.slice(pos, next + 1);
					lines = content.split('\n');
					last = lines.length - 1;

					if (last > 0) {
						nextLine = line + last;
						nextOffset = next - lines[last].length;
					} else {
						nextLine = line;
						nextOffset = offset;
					}

					tokens.push(['comment', content, pos]);

					offset = nextOffset;
					line = nextLine;
					pos = next;

				} else {
					RE_WORD_END.lastIndex = pos + 1;
					RE_WORD_END.test(text);
					if (RE_WORD_END.lastIndex === 0) {
						next = text.length - 1;
					} else {
						next = RE_WORD_END.lastIndex - 2;
					}

					tokens.push(['word', text.slice(pos, next + 1), pos]);
					pos = next;
				}

				break;
		}

		pos++;
	}

	return tokens;
}
