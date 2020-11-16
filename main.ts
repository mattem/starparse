import { parseBuild } from './src';

const BUILD = `
load("@npm//@bazel/typescript", "ts_library", _bar = "some_rule")
load("@npm//@angular/bazel", "ng_module")

ts_library(
    name = "foo",
    srcs = ["main.ts", SOME_VAR],
    linting = True,
    auto_deps = 0,
    deps = 1,
    num = 123409876,
    deps = glob(["**/*.ts"], exclude = [])
)

_bar(name = "sheep")
`;

const result = parseBuild(BUILD);
if (result.errors) {
  console.error(result.errors);
  process.exit(1);
}

console.log('Parsed:');
console.log(JSON.stringify(result.ast, null, 2));

