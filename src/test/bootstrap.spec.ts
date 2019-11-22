'use strict';

import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

import { parseSymbols } from '../index';

const BOOTSTRAP_DIRECTORY = './node_modules/bootstrap/scss';

describe('Bootstrap', () => {
	it('Files with symbols', () => {
		const expected = {
			'mixins/_border-radius.scss': {
				imports: 0,
				mixins: 9,
				variables: 0
			},
			'mixins/_hover.scss': {
				imports: 0,
				mixins: 4,
				variables: 0
			},
			'_mixins.scss': {
				imports: 32,
				mixins: 0,
				variables: 0
			},
			'_variables.scss': {
				imports: 0,
				mixins: 0,
				variables: 659
			}
		};

		const current = {};
		const files = [
			'mixins/_border-radius.scss',
			'mixins/_hover.scss',
			'_mixins.scss',
			'_variables.scss'
		];

		files.forEach((filename) => {
			const data = fs.readFileSync(path.join(BOOTSTRAP_DIRECTORY, filename)).toString();
			const symbols = parseSymbols(data);

			current[filename] = {
				variables: symbols.variables.length,
				mixins: symbols.mixins.length,
				imports: symbols.imports.length
			};
		});

		assert.deepEqual(current, expected);
	});

	it('Mixins', () => {
		let symbolsCount = 0;

		fs.readdirSync(path.join(BOOTSTRAP_DIRECTORY, 'mixins')).forEach((filename) => {
			const data = fs.readFileSync(path.join(BOOTSTRAP_DIRECTORY, 'mixins', filename)).toString();
			const symbols = parseSymbols(data);

			symbolsCount += symbols.mixins.length;
		});

		assert.equal(symbolsCount, 69);
	});

});
