import { format, parseBuild } from './src';

const BUILD = `
load("@npm//@bazel/typescript", "ts_library", _bar = "some_rule")
load("@npm//@angular/bazel", "ng_module")

VALUE = True
VALUE_ONE = glob(["**/*.ts", VALUE], exclude = [])

exports_files(["ts"])

ts_library(
    name = "foo",
    foo = VALUE,
    srcs = ["main.ts", SOME_VAR],
    linting = True,
    auto_deps = 0,
    deps = 1,
    num = 123409876,
    deps = glob(["**/*.ts"], exclude = [])
)

_bar(name = "sheep")
`;

const BUILD2 = `
load("@io_bazel_rules_docker//container:container.bzl", "container_bundle")

container_bundle(
    name = "containers",
    images = {
        "container-registry.evertz.tools/mediocker/auroraservermonitor:latest": "//products/mediator/auroraservermonitor:auroraservermonitor_container",
        "container-registry.evertz.tools/mediocker/configtools:latest": "//products/mediator/configtools",
        "container-registry.evertz.tools/mediocker/infocentre:latest": "//products/mediator/infocentre:infocentre_container",
        "container-registry.evertz.tools/mediocker/mariadb:latest": "//products/mediator/mariadbscripts:db",
        "container-registry.evertz.tools/mediocker/mariadbservermonitor:latest": "//products/mediator/mariadbservermonitor:mariadbservermonitor_container",
        "container-registry.evertz.tools/mediocker/mcadapter:latest": "//products/mediator/mcadapter:mcadapter_container",
        "container-registry.evertz.tools/mediocker/mediafilemanager:latest": "//products/mediator/mediafilemanager:mediafilemanager_container",
        "container-registry.evertz.tools/mediocker/rabbitmq:latest": "//products/mediator/rabbitmq",
        "container-registry.evertz.tools/mediocker/turbine:latest": "//products/mediator/turbine:turbine_container",
        "container-registry.evertz.tools/mediocker/zookeeper:latest": "//products/mediator/zookeeper"
    }
)
`;

const result = parseBuild(BUILD);
if (result.errors) {
  console.error(result.errors);
  process.exit(1);
}

console.log('Parsed:');
console.log(JSON.stringify(result.ast, null, 2));

// console.log(format(BUILD));
