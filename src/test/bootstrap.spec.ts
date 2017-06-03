'use strict';

import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

import { parseSymbols } from '../index';

describe('Bootstrap', () => {

	const dir = './node_modules/bootstrap-sass/assets/stylesheets/bootstrap';

	it('Files without symbols', () => {
		let status = true;
		const files = [];

		fs.readdirSync(dir).filter((filename) => {
			return !/mixins|forms|type|variables|theme/.test(filename);
		}).forEach((filename) => {
			const data = fs.readFileSync(path.join(dir, filename)).toString();
			const symbols = parseSymbols(data);
			if (symbols.imports.length !== 0 || symbols.mixins.length !== 0 || symbols.variables.length !== 0) {
				status = false;
				files.push(filename);
			}
		});

		assert.ok(status, files.join());
	});

	it('Files with symbols', () => {
		const expected = {
			'_forms.scss': {
				variables: 0,
				mixins: 1,
				imports: 0
			},
			'_type.scss': {
				variables: 0,
				mixins: 1,
				imports: 0
			},
			'_mixins.scss': {
				variables: 0,
				mixins: 0,
				imports: 30
			},
			'_variables.scss': {
				variables: 388,
				mixins: 0,
				imports: 0
			},
			'_theme.scss': {
				variables: 0,
				mixins: 4,
				imports: 2
			}
		};

		const current = {};
		const files = [
			'_forms.scss',
			'_type.scss',
			'_mixins.scss',
			'_variables.scss',
			'_theme.scss'
		];

		files.forEach((filename) => {
			const data = fs.readFileSync(path.join(dir, filename)).toString();
			const symbols = parseSymbols(data);

			current[filename] = {
				variables: symbols.variables.length,
				mixins: symbols.mixins.length,
				imports: symbols.imports.length
			};
		});

		assert.deepEqual(expected, current);
	});

	it('Mixins', () => {
		let symbolsCount = 0;

		fs.readdirSync(path.join(dir, 'mixins')).forEach((filename) => {
			const data = fs.readFileSync(path.join(dir, 'mixins', filename)).toString();
			const symbols = parseSymbols(data);

			symbolsCount += symbols.imports.length + symbols.mixins.length + symbols.variables.length;
		});

		assert.equal(symbolsCount, 99);
	});

});
