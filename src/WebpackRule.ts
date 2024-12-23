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
