import { EmbeddedActionsParser, IToken } from 'chevrotain';

import * as Tokens from './tokens';
import { BuildFile, LoadStatement, RenamedSymbolLoad, SymbolLoad } from './ast';

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

  private loadStatement = this.RULE<LoadStatement>('loadStatement', () => {
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

  private symbolLoad = this.RULE<SymbolLoad>('symbolLoad', () => {
    const symbol = this.CONSUME(Tokens.StringLiteral);

    return {
      type: 'SYMBOL_LOAD',
      symbol: symbol.image.replace(/['"]+/g, '')
    };
  });

  private symbolRenameLoad = this.RULE<RenamedSymbolLoad>(
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

  private buildRule = this.RULE('buildRule', () => {
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

  private ruleAttributeValue = this.RULE('ruleAttributeValue', () => {
    return this.OR([
      {
        ALT: () => {
          const value = this.CONSUME(Tokens.StringLiteral);
          return {
            type: 'STRING_LITERAL_RULE_ATTRIBUTE_VALUE',
            value: value.image
          };
        }
      },
      {
        ALT: () => {
          const values = [];
          this.CONSUME(Tokens.LSquare);
          this.MANY_SEP({
            SEP: Tokens.Comma,
            DEF: () => {
              const value = this.OR1([
                { ALT: () => this.CONSUME1(Tokens.StringLiteral) },
                { ALT: () => this.CONSUME1(Tokens.NumberLiteral) },
                { ALT: () => this.CONSUME(Tokens.Identifier) }
              ]);
              values.push(value.image);
            }
          });
          this.CONSUME(Tokens.RSquare);

          return {
            type: 'ARRAY_RULE_ATTRIBUTE_VALUE',
            value: values
          };
        }
      },
      {
        ALT: () => {
          const value = this.OR2([
            { ALT: () => this.CONSUME(Tokens.True) },
            { ALT: () => this.CONSUME(Tokens.False) },
            { ALT: () => this.CONSUME(Tokens.IntTrue) },
            { ALT: () => this.CONSUME(Tokens.IntFalse) }
          ]);

          return {
            type: 'BOOL_RULE_ATTRIBUTE_VALUE',
            value: value.image === '1' || value.image === 'True',
            raw: value.image
          };
        }
      },
      {
        ALT: () => {
          const value = this.CONSUME(Tokens.NumberLiteral);

          return {
            type: 'NUM_RULE_ATTRIBUTE_VALUE',
            value: Number(value.image)
          };
        }
      }
    ]);
  });

  private stringValue = this.RULE('stringValue', () => {
    const value = this.CONSUME(Tokens.StringLiteral);

    return {
      type: 'STRING_LITERAL',
      value: value.image.replace(/['"]+/g, '')
    };
  });
}
