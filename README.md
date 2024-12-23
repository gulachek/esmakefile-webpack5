# `esmakefile-webpack5`

This package is intended to be a lightweight wrapper to
make it easier to add a webpack target to an `esmakefile`
build system.

## Usage

Simply pass a standard `webpack.Configuration` object to
the `addWebpack` function. This will add a `webpack` target
to your `Makefile`.

```js
import { cli, Path } from 'esmakefile';
import { addWebpack } from 'esmakefile-webpack5';

cli((make) => {
	const index = Path.src('src/index.ts');

	// from https://webpack.js.org/guides/typescript/
	addWebpack(make, {
		entry: make.abs(index),
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: 'ts-loader',
					exclude: /node_modules/,
				},
			],
		},
		resolve: {
			extensions: ['.tsx', '.ts', '.js'],
		},
		output: {
			filename: 'bundle.js',
			path: make.buildRoot,
		},
		mode: 'development',
	});
});
```
