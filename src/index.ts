import { ILexingError, IRecognitionException, Lexer } from 'chevrotain';

import * as Tokens from './tokens';
import { BuildParser } from './parser';

export interface BuildParseResult {
  errors?: Array<ILexingError | IRecognitionException>;
  ast?: any;
}

// export function parseFile(path: string): BuildParseResult {}

export function parseBuild(content: string): BuildParseResult {
  const lexer = new Lexer(Tokens.AllTokens);
  const parser = new BuildParser();

  const lex = lexer.tokenize(content);
  if (lex.errors.length) {
    console.error(lex.errors);
    return { errors: lex.errors };
  }

  const ast = parser.parse(lex.tokens);
  if (parser.errors.length) {
    console.error(parser.errors);
    return { errors: parser.errors };
  }

  console.log('Parsed:');
  console.log(JSON.stringify(ast, null, 2));
  return { ast };
}
