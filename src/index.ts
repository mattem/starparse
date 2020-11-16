import { ILexingError, IRecognitionException, Lexer } from 'chevrotain';

import * as Tokens from './tokens';
import { BuildParser } from './parser';
import { BuildFile } from './ast';

export interface BuildParseResult {
  errors?: Array<ILexingError | IRecognitionException>;
  ast?: BuildFile;
}

// export function parseFile(path: string): BuildParseResult {}

export function parseBuild(content: string): BuildParseResult {
  const lexer = new Lexer(Tokens.AllTokens);
  const parser = new BuildParser();

  const lex = lexer.tokenize(content);
  if (lex.errors.length) {
    return { errors: lex.errors };
  }

  const ast = parser.parse(lex.tokens);
  if (parser.errors.length) {
    return { errors: parser.errors };
  }

  return { ast };
}
