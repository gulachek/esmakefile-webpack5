import { WebpackRule } from './WebpackRule.js';
import { IBuildPath, Makefile } from 'esmakefile';
import { Configuration } from 'webpack';

/**
 * Adds a webpack target to the build system
 * @param make The Makefile to add the target to
 * @param config The webpack configuration object
 * @returns The target that represents running webpack
 */
export function addWebpack(make: Makefile, config: Configuration): IBuildPath {
	const rule = new WebpackRule(config);
	make.add(rule);
	return rule.targets(); // 'webpack'
}
