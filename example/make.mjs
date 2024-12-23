import { cli, Path } from "esmakefile";
import { WebpackRule } from "esmakefile-webpack5";

cli((make) => {
  const index = Path.src("src/index.ts");

  // from https://webpack.js.org/guides/typescript/
  const webpack = new WebpackRule({
    entry: make.abs(index),
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    output: {
      filename: "bundle.js",
      path: make.buildRoot,
    },
    mode: "development",
  });

  make.add(webpack);
});
