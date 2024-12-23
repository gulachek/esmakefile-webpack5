import { expect } from "chai";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { Makefile, Path, updateTarget } from "esmakefile";
import { WebpackRule } from "../index.js";
import { chdir, cwd } from "node:process";
import { createRequire } from "node:module";

const require = createRequire(new URL(import.meta.url));

describe("WebpackRule", function () {
  this.timeout(5000); // 5s becuz webpack slow

  const dir = ".scratch/webpack-rule-spec";
  let _cwd: string;
  let make: Makefile;

  beforeEach(async () => {
    await mkdir(dir, { recursive: true });

    _cwd = cwd();
    chdir(dir);

    make = new Makefile();
  });

  afterEach(async () => {
    chdir(_cwd);
    //await rm(dir, { recursive: true, force: true });
  });

  it('registers a "webpack" target', async () => {
    const entry = "./entry.js";
    const output = Path.build("entry.cjs");

    await writeFile(entry, "module.exports = { four: 4 };");

    const rule = new WebpackRule({
      entry,
      target: "node",
      output: {
        path: make.buildRoot,
        filename: output.basename,
        library: {
          type: "commonjs",
        },
      },
      mode: "production",
    });

    make.add(rule);

    const result = await updateTarget(make, "webpack");
    expect(result).to.be.true;

    const mod = require(make.abs(output));
    expect(mod.four).to.equal(4);
  });
});
