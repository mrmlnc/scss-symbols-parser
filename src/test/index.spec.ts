'use strict';

import * as assert from 'assert';
import * as fs from 'fs';

import { parseSymbols } from '../index';

describe('Parser', () => {

	it('Variables', () => {
		const data = fs.readFileSync('./fixtures/variables.scss').toString();

		const { variables, mixins, functions, imports } = parseSymbols(data);

		const expected = [
			{ name: '$a', value: '1', offset: 8 },
			{ name: '$b', value: '$a', offset: 15 },
			{ name: '$c', value: 'text', offset: 23 },
			{ name: '$d', value: '"text"', offset: 33 },
			{ name: '$e', value: '"$test:1;"', offset: 45 },
			{
				name: '$f',
				value: '"{ content" "\\{ content \\}" "\\{ content }" "\\" content \\}" "\\\\" "@{c}"',
				offset: 61
			},
			{ name: '$g', value: 'rgba(255, 0, 0, 0.5)', offset: 137 },
			{ name: '$h', value: '1, 2', offset: 163 },
			{ name: '$i', value: '1 2 3', offset: 173 },
			{ name: '$j', value: '$a !important', offset: 188 },
			{ name: '$k', value: '\\\\', offset: 207 },
			{ name: '$l', value: '\\\\\\test', offset: 215 },
			{ name: '$n', value: 'end', offset: 250 },
			{ name: '$q', value: '1', offset: 319 },
			{
				name: '$map',
				value: '(key1: value1, key2: value2, key3: value3)',
				offset: 363
			}
		];

		assert.deepEqual(variables, expected);
		assert.deepEqual(mixins, []);
		assert.deepEqual(functions, []);
		assert.deepEqual(imports, []);
	});

	it('Mixins', () => {
		const data = fs.readFileSync('./fixtures/mixins.scss').toString();

		const { variables, mixins, functions, imports } = parseSymbols(data);

		const expected = [
			{ name: 'b', parameters: [], offset: 22 },
			{
				name: 'c',
				parameters: [
					{ name: '$a', value: null, offset: 55 },
					{ name: '$b', value: null, offset: 59 },
					{ name: '$c', value: 'rgba(0,0,0,0)', offset: 62 }
				],
				offset: 46
			},
			{ name: 'd', parameters: [], offset: 94 },
			{
				name: 'e',
				parameters: [
					{ name: '$a', value: '"{()}"', offset: 128 }
				],
				offset: 119
			},
			{
				name: 'f',
				parameters: [],
				offset: 213
			}
		];

		assert.deepEqual(variables, []);
		assert.deepEqual(mixins, expected);
		assert.deepEqual(functions, []);
		assert.deepEqual(imports, []);
	});

	it('Functions', () => {
		const data = fs.readFileSync('./fixtures/functions.scss').toString();

		const { variables, mixins, functions, imports }= parseSymbols(data);

		const expected = [
			{
				name: 'grid-width',
				parameters: [
					{ name: '$n', value: null, offset: 21 }
				],
				offset: 0
			}
		];

		assert.deepEqual(variables, []);
		assert.deepEqual(mixins, []);
		assert.deepEqual(functions, expected);
		assert.deepEqual(imports, []);
	});

	it('Imports', () => {
		const data = fs.readFileSync('./fixtures/imports.scss').toString();

		const { variables, mixins, functions, imports }= parseSymbols(data);

		const expected = [
			{ filepath: 'foo.scss', dynamic: false, css: false },
			{ filepath: 'foo', dynamic: false, css: false },
			{ filepath: 'foo.css', dynamic: false, css: true },
			{ filepath: 'foo', dynamic: false, css: false },
			{ filepath: '//fonts.googleapis.com/css?family=Aguafina+Script', dynamic: true, css: false },
			{ filepath: 'https://fonts.googleapis.com/css?family=Aguafina+Script', dynamic: true, css: false },
			{ filepath: '//fonts.googleapis.com/css?family=Aguafina+Script', dynamic: true, css: false },
			{ filepath: 'rounded-corners', dynamic: false, css: false },
			{ filepath: 'text-shadow', dynamic: false, css: false },
			{ filepath: '#{test}.scss', dynamic: true, css: false }
		];

		assert.deepEqual(variables, []);
		assert.deepEqual(mixins, []);
		assert.deepEqual(functions, []);
		assert.deepEqual(imports, expected);
	});

});
