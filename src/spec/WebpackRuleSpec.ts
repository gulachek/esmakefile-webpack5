import { expect } from "chai";
import { mkdir, rm, writeFile, stat } from "node:fs/promises";
import { Makefile, Path, updateTarget } from "esmakefile";
import { addWebpack } from "../index.js";
import { chdir, cwd } from "node:process";
import { createRequire } from "node:module";

const require = createRequire(new URL(import.meta.url));

describe("addWebpack", function () {
  this.timeout(5000); // 5s becuz webpack slow

  const dir = ".scratch/webpack-rule-spec";
  let _cwd: string;
  let make: Makefile;

  const entry = "./entry.js";
  const output = Path.build("entry.cjs");

  function resetRequire() {
    delete require.cache[make.abs(output)];
  }

  beforeEach(async () => {
    await mkdir(dir, { recursive: true });

    _cwd = cwd();
    chdir(dir);

    make = new Makefile();
  });

  afterEach(async () => {
    resetRequire();
    chdir(_cwd);
    await rm(dir, { recursive: true, force: true });
  });

  it('registers a "webpack" target', async () => {
    await writeFile(entry, "module.exports = { four: 4 };");

    addWebpack(make, {
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

    const result = await updateTarget(make, "webpack");
    expect(result).to.be.true;

    const mod = require(make.abs(output));
    expect(mod.four).to.equal(4);
  });

  it("rebuilds if entrypoint changes", async () => {
    await writeFile(entry, "module.exports = { four: 4 };");

    addWebpack(make, {
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

    let result = await updateTarget(make, "webpack");
    expect(result).to.be.true;

    const cjsMod = make.abs(output);

    const mod = require(cjsMod);
    expect(mod.four).to.equal(4);

    await writeFile(entry, "module.exports = { five: 5 };");
    result = await updateTarget(make, "webpack");
    expect(result).to.be.true;

    resetRequire();

    const newMod = require(cjsMod);
    expect(newMod.five).to.equal(5);
  });

  it("rebuilds when a transitive dependency changes", async () => {
    const dep = "./dep.js";
    await writeFile("./package.json", '{"type": "commonjs"}');
    await writeFile(dep, "module.exports = { n: 4 };");
    await writeFile(
      entry,
      `
										const { n } = require('./dep.js');
										module.exports = { n };
										`
    );

    addWebpack(make, {
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

    let result = await updateTarget(make, "webpack");
    expect(result).to.be.true;

    const cjsMod = make.abs(output);

    const mod = require(cjsMod);
    expect(mod.n).to.equal(4);

    await writeFile(dep, "module.exports = { n: 5 };");
    result = await updateTarget(make, "webpack");
    expect(result).to.be.true;

    resetRequire();

    const newMod = require(cjsMod);
    expect(newMod.n).to.equal(5);
  });

  it("does not rebuild if entry does not change", async () => {
    await writeFile(entry, "module.exports = { four: 4 };");

    addWebpack(make, {
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

    let result = await updateTarget(make, "webpack");
    expect(result).to.be.true;
    const mod = require(make.abs(output));
    expect(mod.four).to.equal(4);

    const oldStats = await stat(make.abs(Path.build("webpack")));

    result = await updateTarget(make, "webpack");
    expect(result).to.be.true;

    const newStats = await stat(make.abs(Path.build("webpack")));

    expect(newStats.mtimeMs).to.equal(oldStats.mtimeMs);
  });
});
