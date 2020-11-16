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
    num = 123409876 
)
`;

parseBuild(BUILD);
