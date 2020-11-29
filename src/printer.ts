import { StringEmitter } from './string-emitter';
import {
  BuildFile,
  LoadStatementNode,
  RenamedSymbolLoadNode,
  SymbolLoadNode
} from './ast';

export class Printer extends StringEmitter {
  public printToString(buildFile: BuildFile): string {
    buildFile.loads
      ?.sort((a, b) => a.from.localeCompare(b.from))
      .forEach((load) => this.visitLoadStatement(load));

    return this.toString();
  }

  private visitLoadStatement(load: LoadStatementNode) {
    this.print(`load("${load.from}", `);

    load.symbols
      ?.sort((a, b) => a.symbol.localeCompare(b.symbol))
      .forEach((node, i) => {
        node.type === 'SYMBOL_LOAD'
          ? this.visitSymbolLoad(node)
          : this.visitRenamedSymbolLoad(node);

        if (i !== load.symbols.length - 1) {
          this.print(', ');
        }
      });

    this.println(')');
  }

  private visitSymbolLoad(node: SymbolLoadNode) {
    this.print(`"${node.symbol}"`);
  }

  private visitRenamedSymbolLoad(node: RenamedSymbolLoadNode) {
    this.print(`${node.identifier} = "${node.symbol}"`);
  }
}
