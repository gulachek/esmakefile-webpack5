/**
 * Copyright (c) 2024 by Nicholas Gulachek
 *
 * Permission to use, copy, modify, and/or distribute this
 * software for any purpose with or without fee is hereby
 * granted, provided that the above copyright notice and
 * this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED “AS IS” AND ISC DISCLAIMS ALL
 * WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO
 * EVENT SHALL ISC BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
 * WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
 * TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH
 * THE USE OR PERFORMANCE OF THIS SOFTWARE.
 **/
import { IBuildPath, IRule, Path, RecipeArgs } from 'esmakefile';
import webpack, { Configuration, Compiler, Stats } from 'webpack';

import { resolvers } from './resolvers.js';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export class WebpackRule implements IRule {
	private config: Configuration;
	private compiler: Compiler;

	constructor(config: Configuration) {
		this.config = config;
		this.compiler = webpack(this.config);
	}

	targets(): IBuildPath {
		return Path.build('webpack');
	}

	recipe(args: RecipeArgs): Promise<boolean> {
		const { promise, resolve: promiseResolve, reject } = resolvers<boolean>();

		this.compiler.run(async (err: Error | undefined, stats: Stats) => {
			if (err) reject(err);

			args.logStream.write(stats.toString({ colors: true }));

			for (const dep of stats.compilation.fileDependencies) {
				args.addPostreq(resolve(dep));
			}

			try {
				await writeFile(args.abs(Path.build('webpack')), stats.toString());
			} catch (ex) {
				reject(ex);
			}

			promiseResolve(!stats.hasErrors());
		});

		return promise;
	}
}
