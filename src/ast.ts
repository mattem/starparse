export interface Node {
  type: string;

  line?: number;
  col?: number;
  offset?: number;
}

export interface SymbolLoadNode extends Node {
  type: 'SYMBOL_LOAD';

  /**
   * Symbol that is loaded inside a load statement
   */
  symbol: string;
}

export interface RenamedSymbolLoadNode extends Node {
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

export interface LoadStatementNode extends Node {
  type: 'LOAD_STATEMENT';

  /**
   * Site where the symbols are loaded from
   */
  from: string;

  /**
   * List of symbols that are loaded within this load statement
   */
  symbols: Array<SymbolLoadNode | RenamedSymbolLoadNode>;
}

export interface StringLiteralNode extends Node {
  type: 'STRING_LITERAL';

  /**
   * Raw token value
   */
  raw: string;

  /**
   * Stringy value of the string literal (quotes stripped)
   */
  value: string;
}

export interface NumberLiteralNode extends Node {
  type: 'NUMBER_LITERAL';

  /**
   * Raw token value
   */
  raw: string;

  /**
   * Number representation of the number literal
   */
  value: number;
}

export interface BoolTypeNode extends Node {
  type: 'BOOLEAN';

  /**
   * Raw token value
   */
  raw: string;

  /**
   * Parsed true or false value
   */
  value: boolean;
}

export interface ArrayTypeNode {
  type: 'ARRAY_TYPE';

  /**
   * List of contained values in the array
   */
  values: Array<
    StringLiteralNode | NumberLiteralNode | BoolTypeNode | IdentifierNode
  >;
}

export interface IdentifierNode extends Node {
  type: 'IDENTIFIER_NODE';

  /**
   * Raw token value
   */
  raw: string;

  /**
   * Stringy value of the identifier (quotes stripped)
   */
  value: string;
}

export interface GlobNode extends Node {
  type: 'GLOB';

  /**
   * List of strings or identifiers found in the 'includes' part of the glob
   */
  includes: Array<StringLiteralNode | IdentifierNode>;

  /**
   * List of strings or identifiers found in the 'excludes' part of the glob
   * Undefined if no excludes attribute is set
   */
  excludes?: Array<StringLiteralNode | IdentifierNode>;
}

export type RuleAttributeType =
  | StringLiteralNode
  | NumberLiteralNode
  | BoolTypeNode
  | ArrayTypeNode
  | IdentifierNode
  | GlobNode;

export interface RuleAttributeNode extends Node {
  type: 'RULE_ATTRIBUTE';

  /**
   * The name of this attribute, eg name, srcs, deps etc
   */
  identifier: string;

  /**
   * Node that corresponds to the attributes value
   */
  value: RuleAttributeType;
}

export interface RuleNode extends Node {
  type: 'RULE';

  /**
   * The type of rule this is, eg ts_library, java_binary etc
   */
  kind: string;

  /**
   * List of attributes that this rule has, and their corresponding value
   */
  attributes: RuleAttributeNode[];
}

export interface BuildFile extends Node {
  type: 'BUILD_FILE';

  /**
   * List of 'load' statements found in the BUILD file
   */
  loads: LoadStatementNode[];

  /**
   * List of rules found in the BUILD file
   */
  rules: RuleNode[];
}
