# Starparse

Small (and wildly incomplete) parser for [bazel](https://bazel.build) BUILD files.

Mainly an excuse for experimenting with [Chevrotain](https://github.com/SAP/chevrotain)  

```
import { parseBuild } from './src/index';

const ast = parseBuild('load("//blah", my_symbol")');
console.log(ast);
```
