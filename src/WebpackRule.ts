import { IBuildPath, IRule, Path, RecipeArgs } from "esmakefile";
import webpack, { Configuration, Compiler, Stats } from "webpack";

import { resolvers } from "./resolvers.js";

export class WebpackRule implements IRule {
  private config: Configuration;
  private compiler: Compiler;

  constructor(config: Configuration) {
    this.config = config;
    this.compiler = webpack(this.config);
  }

  targets(): IBuildPath {
    return Path.build("webpack");
  }

  recipe(args: RecipeArgs): Promise<boolean> {
    const { promise, resolve, reject } = resolvers<boolean>();

    this.compiler.run((err?: Error, stats?: Stats) => {
      if (err) reject(err);

      args.logStream.write(stats.toString());

      resolve(!stats.hasErrors());
    });

    return promise;
  }
}
