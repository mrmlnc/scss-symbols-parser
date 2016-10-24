'use strict';

import tokenizer from './tokenizer';

export interface IVariable {
	name: string;
	value: string;
	offset: number;
}

export interface IImport {
	filepath: string;
	dynamic: boolean;
	css: boolean;
}

export interface IMixin {
	name: string;
	parameters: IVariable[];
	offset: number;
}

export interface IFunction extends IMixin {
	// :)
}

function makeMixinParameters(text: string, offset): IVariable[] {
	const variables: IVariable[] = [];
	if (!text || text === '()') {
		return variables;
	}

	// Remove parenthesis
	text = text.slice(1, text.length - 1);
	const params = text.split(/([,;]\s*)(?=\$)/);

	// Skip `(`
	offset += 1;

	for (let i = 0; i < params.length; i = i + 2) {
		const token = params[i];
		const stat = token.match(/([\n\t\r\s]*)(\$[\w-]+)(?:\s*:\s*(.*))?/);

		offset += stat[1].length || 0;

		variables.push({
			name: stat[2],
			value: stat[3] ? stat[3].trim() : null,
			offset
		});

		offset += token.trim().length + (params[i + 1] ? params[i + 1].length : 0);
	}

	return variables;
}

export function parseSymbols(text: string) {
	const tokens = tokenizer(text);

	let variables: IVariable[] = [];
	let mixins: IMixin[] = [];
	let functions: IFunction[] = [];
	let imports: IImport[] = [];

	let token;
	let pos = 0;

	let offset = 0;

	const length = tokens.length;

	while (pos < length) {
		token = tokens[pos];

		if (token[0] === 'at-word' && token[1] === '@import') { // Import's
			pos++;

			let str = '';
			while (pos < length) {
				token = tokens[pos];
				if (token[0] === ';') {
					break;
				}
				str += token[1];
				pos++;
			}

			str.split(/,\s*/).forEach((x) => {
				const stat = x.match(/['"](.*)['"]/);
				if (!stat) {
					return;
				}

				imports.push({
					filepath: stat[1],
					dynamic: /[#{}\*]/.test(stat[1]),
					css: /\.css$/.test(stat[1])
				});
			});
		} else if (token[0] === 'at-word') { // Mixins or Functions
			if (token[1] !== '@mixin' && token[1] !== '@function') {
				pos++;
				while (pos < length) {
					token = tokens[pos];
					if (token[0] === '{') {
						break;
					} else if (token[0] === ')' && tokens[pos + 1] && tokens[pos + 1] === ';') {
						pos++;
						break;
					}
					pos++;
				}
				continue;
			}

			const entity = token[1] === '@mixin' ? mixins : functions;

			offset = token[2];
			pos++;

			let name = '';
			while (pos < length) {
				token = tokens[pos];
				if (token[0] === 'brackets' || token[0] === '(' || token[0] === '{') {
					break;
				}
				name += token[1];
				pos++;
			}

			let paramsOffset = offset;
			let params = '';
			if (token[0] === 'brackets') {
				paramsOffset = token[2];
				params = token[1];
			} else if (token[0] === '(') {
				paramsOffset = token[2];
				pos++;
				while (pos < length) {
					token = tokens[pos];
					if (token[0] === ')') {
						break;
					}

					params += token[1];
					pos++;
				}

				params = `(${params})`;
			}

			while (token[0] === '{' && pos < length) {
				token = tokens[pos];
				pos++;
			}

			if (name) {
				entity.push({
					name: name.trim(),
					parameters: makeMixinParameters(params, paramsOffset),
					offset
				});
			} else {
				pos--;
			}
		} else if (token[0] === 'word' && token[1].startsWith('$')) { // Variables
			offset = token[2];
			pos++;

			const name = token[1].substr(1);

			let value = '';
			while (pos < length && tokens[pos][0] !== ';') {
				token = tokens[pos];

				if (token[0] === 'word' || token[0] === 'at-word' || token[0] === 'string' || token[0] === 'space' || token[0] === 'brackets') {
					value += token[1];
				}
				pos++;
			}

			variables.push({
				name,
				value: value.trim(),
				offset
			});
		} else if (token[0] === '{') { // Ruleset
			let ruleset = 1;

			pos++;
			while (pos < length) {
				token = tokens[pos];
				if (ruleset === 0) {
					break;
				} else if (token[0] === '{') {
					ruleset++;
				} else if (token[0] === '}') {
					ruleset--;
				}
				pos++;
			}
		}

		pos++;
	}

	return {
		variables,
		mixins,
		functions,
		imports
	};
}