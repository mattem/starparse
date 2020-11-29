import { EmbeddedActionsParser, IToken } from 'chevrotain';

import * as Tokens from './tokens';
import {
  ArrayTypeNode,
  BoolTypeNode,
  BuildFile,
  DictTypeNode,
  ExportsFilesDeclarationNode,
  GlobNode,
  IdentifierNode,
  InitializerType,
  LoadStatementNode,
  NumberLiteralNode,
  PackageDeclarationNode,
  PackageGroupDeclarationNode,
  RenamedSymbolLoadNode,
  RuleAttributeNode,
  RuleNode,
  SelectStatementNode,
  StringLiteralNode,
  SymbolLoadNode,
  VariableDeclarationNode
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
    this.OPTION(() => {
      this.MANY(() => {
        loads.push(this.SUBRULE(this.loadStatement));
      });
    });

    const rules = [];
    const declarations = [];

    let exportsFilesNode;

    this.MANY1({
      DEF: () => {
        this.OR([
          { ALT: () => rules.push(this.SUBRULE(this.buildRule)) },
          { ALT: () => declarations.push(this.SUBRULE(this.declaration)) },
          { ALT: () => exportsFilesNode = this.SUBRULE(this.exportsFiles) }
        ]);
      }
    });

    const packageDeclarationNode = this.OPTION2(() =>
      this.SUBRULE(this.package)
    );
    const packageGroupDeclarationNode = this.OPTION3(() =>
      this.SUBRULE(this.packageGroup)
    );

    return {
      type: 'BUILD_FILE',
      exportsFiles: exportsFilesNode,
      package: packageDeclarationNode,
      packageGroup: packageGroupDeclarationNode,
      loads,
      rules,
      declarations
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

  private declaration = this.RULE<VariableDeclarationNode>(
    'declaration',
    () => {
      const identifier = this.CONSUME(Tokens.Identifier);
      this.CONSUME(Tokens.Equals);
      const assignment = this.SUBRULE(this.assignment);

      return {
        type: 'VARIABLE_DECLARATION',
        identifier: identifier.image,
        initializer: assignment
      };
    }
  );

  private package = this.RULE<PackageDeclarationNode>('package', () => {
    this.CONSUME(Tokens.Package);
    this.CONSUME(Tokens.LParen);

    const node: PackageDeclarationNode = {
      type: 'PACKAGE_DECLARATION'
    };

    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        const id = this.CONSUME(Tokens.Identifier);
        this.CONSUME(Tokens.Equals);

        const assignment = this.SUBRULE(this.assignment);
        switch (id.image?.replace(/['"]+/g, '')) {
          case 'default_visibility':
            node.defaultVisibility = assignment;
            break;
          case 'default_deprecation':
            node.defaultDeprecation = assignment;
            break;
          case 'default_testonly':
            node.defaultTestonly = assignment;
            break;
          case 'features':
            node.features = assignment;
            break;
        }

        this.SUBRULE(this.optionalTrailingComma);
      }
    });

    this.CONSUME(Tokens.RParen);

    return node;
  });

  private packageGroup = this.RULE<PackageGroupDeclarationNode>(
    'packageGroup',
    () => {
      this.CONSUME(Tokens.PackageGroup);
      this.CONSUME(Tokens.LParen);

      const node: PackageGroupDeclarationNode = {
        type: 'PACKAGE_GROUP_DECLARATION'
      };

      this.MANY_SEP({
        SEP: Tokens.Comma,
        DEF: () => {
          const id = this.CONSUME(Tokens.Identifier);
          this.CONSUME(Tokens.Equals);

          const assignment = this.SUBRULE(this.assignment);
          switch (id.image?.replace(/['"]+/g, '')) {
            case 'name':
              node.name = assignment;
              break;
            case 'packages':
              node.packages = assignment;
              break;
            case 'includes':
              node.includes = assignment;
              break;
          }

          this.SUBRULE(this.optionalTrailingComma);
        }
      });

      this.CONSUME(Tokens.RParen);

      return node;
    }
  );

  private exportsFiles = this.RULE<ExportsFilesDeclarationNode>(
    'exportsFiles',
    () => {
      this.CONSUME(Tokens.ExportsFiles);
      this.CONSUME(Tokens.LParen);

      // the files array is required
      const files = this.SUBRULE(this.arrayOrIdentifierTypeNode);

      // other attrs are not required
      const visibility = this.OPTION(() => {
        this.CONSUME(Tokens.Comma);
        this.CONSUME(Tokens.Identifier);
        this.CONSUME(Tokens.Equals);

        return this.SUBRULE1(this.arrayOrIdentifierTypeNode);
      });

      this.SUBRULE1(this.optionalTrailingComma);
      this.CONSUME(Tokens.RParen);

      return {
        type: 'EXPORTS_FILES_DECLARATION',
        files,
        visibility
      };
    }
  );

  private buildRule = this.RULE<RuleNode>('buildRule', () => {
    const kind = this.CONSUME(Tokens.Identifier);
    this.CONSUME(Tokens.LParen);

    const attributes: RuleAttributeNode[] = [];
    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        const identifier = this.CONSUME1(Tokens.Identifier);
        this.CONSUME(Tokens.Equals);
        const value = this.SUBRULE(this.assignment);

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

  private assignment = this.RULE('assignmentStatement', () => {
    return this.OR<InitializerType>([
      { ALT: () => this.SUBRULE(this.stringLiteral) },
      { ALT: () => this.SUBRULE(this.numberLiteral) },
      { ALT: () => this.SUBRULE(this.boolValue) },
      { ALT: () => this.SUBRULE(this.identifierNode) },
      { ALT: () => this.SUBRULE(this.arrayType) },
      { ALT: () => this.SUBRULE(this.globNode) },
      { ALT: () => this.SUBRULE(this.dictType) },
      { ALT: () => this.SUBRULE(this.selectStatement) }
    ]);
  });

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

  private dictType = this.RULE<DictTypeNode>('dictType', () => {
    this.CONSUME(Tokens.LCurly);
    const values = [];

    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        const key = this.SUBRULE(this.stringLiteral);
        this.CONSUME(Tokens.Colon);
        const value = this.SUBRULE(this.assignment);

        const node = {
          type: 'DICT_ENTRY_NODE',
          key,
          value
        };

        values.push(node);
      }
    });

    this.SUBRULE(this.optionalTrailingComma);
    this.CONSUME(Tokens.RCurly);

    return {
      type: 'DICT_TYPE',
      values
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

  private optionalTrailingComma = this.RULE<void>(
    'optionalTrailingComma',
    () => {
      this.OPTION(() => this.CONSUME(Tokens.Comma));
    }
  );

  private arrayOrIdentifierTypeNode = this.RULE<ArrayTypeNode | IdentifierNode>(
    'arrayOrIdentifierType',
    () => {
      return this.OR([
        { ALT: () => this.SUBRULE(this.identifierNode) },
        { ALT: () => this.SUBRULE(this.arrayType) }
      ]);
    }
  );

  private selectStatement = this.RULE<SelectStatementNode>(
    'selectStatement',
    () => {
      this.CONSUME(Tokens.Select);
      const constraint = this.OR([
        { ALT: () => this.SUBRULE(this.identifierNode) },
        { ALT: () => this.SUBRULE(this.dictType) }
      ]);

      const node: SelectStatementNode = {
        type: 'SELECT_STATEMENT_NODE',
        constraint
      };

      this.OPTION({
        DEF: () => {
          this.CONSUME(Tokens.Comma);
          this.CONSUME(Tokens.Identifier);
          this.CONSUME(Tokens.Equals);

          node.noMatchErrorNode = this.OR1([
            { ALT: () => this.SUBRULE(this.stringLiteral) },
            { ALT: () => this.SUBRULE1(this.identifierNode) }
          ]);
        }
      });

      return node;
    }
  );
}
