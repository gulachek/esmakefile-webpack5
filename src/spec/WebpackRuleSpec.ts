import { expect } from "chai";
import { mkdir, rm, writeFile, stat, readFile } from "node:fs/promises";
import { Makefile, Path, updateTarget } from "esmakefile";
import { addWebpack } from "../index.js";
import { chdir, cwd } from "node:process";
import { join, resolve } from "node:path";

function loadModule(this: any, content: string, exportName: string): any {
  eval(content);
  return this[exportName];
}

async function myRequire(path: string): Promise<any> {
  const jsContent = await readFile(path, "utf8");
  return loadModule.call({}, jsContent, "TestModule");
}

describe("addWebpack", function () {
  this.timeout(5000); // 5s becuz webpack slow

  const dir = resolve(".scratch/webpack-rule-spec");
  let _cwd: string;
  let make: Makefile;

  const entry = "./entry.js";
  const output = Path.build("entry.js");

  function addWp() {
    addWebpack(make, {
      entry,
      target: ["node"],
      output: {
        path: make.buildRoot,
        filename: output.basename,
        library: {
          type: "this",
          name: "TestModule",
        },
      },
      mode: "production",
    });
  }

  beforeEach(async () => {
    await mkdir(dir, { recursive: true });

    _cwd = cwd();
    chdir(dir);

    await writeFile(join(dir, "package.json"), '{"type": "commonjs"}');

    make = new Makefile();
  });

  afterEach(async () => {
    chdir(_cwd);
    await rm(dir, { recursive: true, force: true });
  });

  it('registers a "webpack" target', async () => {
    await writeFile(entry, "module.exports = { four: 4 };");

    addWp();

    const result = await updateTarget(make, "webpack");
    expect(result).to.be.true;

    const mod = await myRequire(make.abs(output));
    expect(mod.four).to.equal(4);
  });

  it("rebuilds if entrypoint changes", async () => {
    await writeFile(entry, "module.exports = { four: 4 };");

    addWp();

    let result = await updateTarget(make, "webpack");
    expect(result).to.be.true;

    const modScript = make.abs(output);

    const mod = await myRequire(modScript);
    expect(mod.four).to.equal(4);

    await writeFile(entry, "module.exports = { five: 5 };");
    result = await updateTarget(make, "webpack");
    expect(result).to.be.true;

    const newMod = await myRequire(modScript);
    expect(newMod.five).to.equal(5);
  });

  it("rebuilds when a transitive dependency changes", async () => {
    const dep = "./dep.js";
    await writeFile(dep, "module.exports = { n: 4 };");
    await writeFile(
      entry,
      `
										const { n } = require('./dep.js');
										module.exports = { n };
										`
    );

    addWp();

    let result = await updateTarget(make, "webpack");
    expect(result).to.be.true;

    const testMod = make.abs(output);

    const mod = await myRequire(testMod);
    expect(mod.n).to.equal(4);

    await writeFile(dep, "module.exports = { n: 5 };");
    result = await updateTarget(make, "webpack");
    expect(result).to.be.true;

    const newMod = await myRequire(testMod);
    expect(newMod.n).to.equal(5);
  });

  it("does not rebuild if entry does not change", async () => {
    await writeFile(entry, "module.exports = { four: 4 };");

    addWp();

    let result = await updateTarget(make, "webpack");
    expect(result).to.be.true;
    const mod = await myRequire(make.abs(output));
    expect(mod.four).to.equal(4);

    const oldStats = await stat(make.abs(Path.build("webpack")));

    result = await updateTarget(make, "webpack");
    expect(result).to.be.true;

    const newStats = await stat(make.abs(Path.build("webpack")));

    expect(newStats.mtimeMs).to.equal(oldStats.mtimeMs);
  });
});
