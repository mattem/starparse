import { ILexingError, IRecognitionException, Lexer } from 'chevrotain';

import * as Tokens from './tokens';
import { BuildParser } from './parser';
import { BuildFile } from './ast';
import { Printer } from './printer';

export interface BuildParseResult {
  errors?: Array<ILexingError | IRecognitionException>;
  ast?: BuildFile;
}

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

export function format(content: string): string {
  const result = parseBuild(content);

  if (result.errors) {
    throw new Error(`Errors while parsing:\n${result.errors.join('\n')}`);
  }

  const printer = new Printer();
  return printer.printToString(result.ast);
}
