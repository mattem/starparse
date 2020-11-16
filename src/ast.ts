export interface Node {
  type: string;
}

export interface SymbolLoad extends Node {
  type: 'SYMBOL_LOAD';

  /**
   * Symbol that is loaded inside a load statement
   */
  symbol: string;
}

export interface RenamedSymbolLoad extends Node {
  type: 'SYMBOL_RENAME_LOAD';

  /**
   * Identifier that the loaded symbol as been assigned to
   */
  identifier: string;

  /**
   * Symbol that is loaded inside a load statement
   */
  symbol: string;
}

export interface LoadStatement extends Node {
  type: 'LOAD_STATEMENT';

  /**
   * Site where the symbols are loaded from
   */
  from: string;

  /**
   * List of symbols that are loaded within this load statement
   */
  symbols: Array<SymbolLoad | RenamedSymbolLoad>;
}

export interface BuildFile extends Node {
  type: 'BUILD_FILE';

  /**
   * List of 'load' statements found in the BUILD file
   */
  loads: LoadStatement[];

  /**
   * List of rules found in the BUILD file
   */
  rules: any[];
}
