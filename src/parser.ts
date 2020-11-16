import { EmbeddedActionsParser, IToken } from 'chevrotain';

import * as Tokens from './tokens';
import {
  ArrayTypeNode,
  BoolTypeNode,
  BuildFile,
  GlobNode,
  IdentifierNode,
  LoadStatementNode,
  NumberLiteralNode,
  RenamedSymbolLoadNode,
  RuleAttributeNode,
  RuleNode,
  StringLiteralNode,
  SymbolLoadNode
} from './ast';

export class BuildParser extends EmbeddedActionsParser {
  constructor() {
    super(Tokens.AllTokens, { recoveryEnabled: true });
    this.performSelfAnalysis();
  }

  public parse(tokens: IToken[]): BuildFile {
    this.input = tokens;
    return this.parseBuild();
  }

  private parseBuild = this.RULE<BuildFile>('BUILD', () => {
    const loads = [];
    this.MANY({
      DEF: () => loads.push(this.SUBRULE(this.loadStatement))
    });

    const rules = [];
    this.MANY1({
      DEF: () => rules.push(this.SUBRULE(this.buildRule))
    });

    return {
      type: 'BUILD_FILE',
      loads: loads,
      rules: rules
    };
  });

  private loadStatement = this.RULE<LoadStatementNode>('loadStatement', () => {
    this.CONSUME(Tokens.Load);
    this.CONSUME(Tokens.LParen);

    const from = this.CONSUME(Tokens.StringLiteral).image;
    this.CONSUME(Tokens.Comma);

    const symbols = [];
    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        const load = this.OR([
          { ALT: () => this.SUBRULE(this.symbolLoad) },
          { ALT: () => this.SUBRULE(this.symbolRenameLoad) }
        ]);
        symbols.push(load);
      }
    });

    this.CONSUME(Tokens.RParen);

    return {
      type: 'LOAD_STATEMENT',
      from: from.replace(/['"]+/g, ''),
      symbols: symbols
    };
  });

  private symbolLoad = this.RULE<SymbolLoadNode>('symbolLoad', () => {
    const symbol = this.CONSUME(Tokens.StringLiteral);

    return {
      type: 'SYMBOL_LOAD',
      symbol: symbol.image.replace(/['"]+/g, '')
    };
  });

  private symbolRenameLoad = this.RULE<RenamedSymbolLoadNode>(
    'symbolRenameLoad',
    () => {
      const identifier = this.CONSUME(Tokens.Identifier);
      this.CONSUME(Tokens.Equals);
      const symbol = this.CONSUME(Tokens.StringLiteral);

      return {
        type: 'SYMBOL_RENAME_LOAD',
        identifier: identifier.image.replace(/['"]+/g, ''),
        symbol: symbol.image.replace(/['"]+/g, '')
      };
    }
  );

  private buildRule = this.RULE<RuleNode>('buildRule', () => {
    const kind = this.CONSUME(Tokens.Identifier);
    this.CONSUME(Tokens.LParen);

    const attributes = [];
    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        const identifier = this.CONSUME1(Tokens.Identifier);
        this.CONSUME(Tokens.Equals);
        const value = this.SUBRULE(this.ruleAttributeValue);

        attributes.push({
          type: 'RULE_ATTRIBUTE',
          identifier: identifier.image.replace(/['"]+/g, ''),
          value: value
        });
      }
    });

    this.CONSUME(Tokens.RParen);

    return {
      type: 'RULE',
      kind: kind.image.replace(/['"]+/g, ''),
      attributes: attributes
    };
  });

  private ruleAttributeValue = this.RULE<RuleAttributeNode>(
    'ruleAttributeValue',
    () => {
      return this.OR([
        { ALT: () => this.SUBRULE(this.stringLiteral) },
        { ALT: () => this.SUBRULE(this.numberLiteral) },
        { ALT: () => this.SUBRULE(this.boolValue) },
        { ALT: () => this.SUBRULE(this.identifierNode) },
        { ALT: () => this.SUBRULE(this.arrayType) },
        { ALT: () => this.SUBRULE(this.globNode) }
      ]);
    }
  );

  private stringLiteral = this.RULE<StringLiteralNode>('stringLiteral', () => {
    const value = this.CONSUME(Tokens.StringLiteral);

    return {
      type: 'STRING_LITERAL',
      raw: value.image,
      value: value.image.replace(/['"]+/g, '')
    };
  });

  private numberLiteral = this.RULE<NumberLiteralNode>('numberLiteral', () => {
    const value = this.CONSUME(Tokens.NumberLiteral);

    return {
      type: 'NUMBER_LITERAL',
      raw: value.image,
      value: Number(value.image.replace(/['"]+/g, ''))
    };
  });

  private boolValue = this.RULE<BoolTypeNode>('boolValue', () => {
    const value = this.OR([
      { ALT: () => this.CONSUME(Tokens.True) },
      { ALT: () => this.CONSUME(Tokens.False) }
    ]);

    return {
      type: 'BOOLEAN',
      raw: value.image,
      value: value.image?.replace(/['"]+/g, '').toLowerCase() === 'true'
    };
  });

  private identifierNode = this.RULE<IdentifierNode>('identifierNode', () => {
    const identifier = this.CONSUME(Tokens.Identifier);

    return {
      type: 'IDENTIFIER_NODE',
      raw: identifier.image,
      value: identifier.image.replace(/['"]+/g, '')
    };
  });

  private arrayType = this.RULE<ArrayTypeNode>('arrayType', () => {
    const values = [];
    this.CONSUME(Tokens.LSquare);
    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        const value = this.OR1([
          { ALT: () => this.SUBRULE(this.stringLiteral) },
          { ALT: () => this.SUBRULE(this.numberLiteral) },
          { ALT: () => this.SUBRULE(this.identifierNode) },
          { ALT: () => this.SUBRULE(this.boolValue) }
        ]);
        values.push(value);
      }
    });
    this.CONSUME(Tokens.RSquare);

    return {
      type: 'ARRAY_TYPE',
      values: values
    };
  });

  private globNode = this.RULE<GlobNode>('globNode', () => {
    this.CONSUME(Tokens.Glob);
    this.CONSUME(Tokens.LParen);

    let includes;
    let excludes;

    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        this.OR([
          {
            ALT: () => {
              includes = this.SUBRULE(this.arrayType)?.values;
            }
          },
          {
            ALT: () => {
              const id = this.CONSUME(Tokens.Identifier);
              this.CONSUME(Tokens.Equals);
              const array = this.SUBRULE1(this.arrayType)?.values;

              if (id.image?.toLowerCase() === 'include') {
                includes = array;
              } else {
                excludes = array;
              }
            }
          }
        ]);
      }
    });

    this.CONSUME(Tokens.RParen);

    return {
      type: 'GLOB',
      includes,
      excludes
    };
  });
}
