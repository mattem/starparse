import { createToken, Lexer } from 'chevrotain';

export const Identifier = createToken({
  name: 'Identifier',
  pattern: /[A-Za-z_]\w*/
});
export const Load = createToken({
  name: 'Load',
  pattern: /load/
});
export const Glob = createToken({
  name: 'Glob',
  pattern: /glob/
});

export const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"(:?[^\\"\n\r]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/
});
export const NumberLiteral = createToken({
  name: 'NumberLiteral',
  pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/
});
export const True = createToken({ name: 'True', pattern: /True/ });
export const False = createToken({ name: 'False', pattern: /False/ });
export const Integer = createToken({ name: 'Integer', pattern: /0|[1-9]\d*/ });

export const Comma = createToken({ name: 'Comma', pattern: /,/ });
export const LSquare = createToken({ name: 'LParen', pattern: /\[/ });
export const RSquare = createToken({ name: 'RParen', pattern: /]/ });
export const LParen = createToken({ name: 'LParen', pattern: /\(/ });
export const RParen = createToken({ name: 'RParen', pattern: /\)/ });
export const LCurly = createToken({ name: 'LCurly', pattern: /{/ });
export const RCurly = createToken({ name: 'RCurly', pattern: /}/ });
export const SQuote = createToken({ name: 'GreaterThan', pattern: /'/ });
export const DQuote = createToken({ name: 'GreaterThan', pattern: /"/ });
export const Equals = createToken({ name: 'GreaterThan', pattern: /=/ });
export const GreaterThan = createToken({ name: 'GreaterThan', pattern: />/ });
export const LessThan = createToken({ name: 'LessThan', pattern: /</ });

export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED
});

// placing WhiteSpace first as it is very common thus it will speed up the lexer.
export const AllTokens = [
  WhiteSpace,
  // "keywords" appear before the Identifier
  Load,
  Glob,
  // The Identifier must appear after the keywords because all keywords are valid identifiers.
  StringLiteral,
  NumberLiteral,
  True,
  False,
  Identifier,
  Comma,
  LSquare,
  RSquare,
  LParen,
  RParen,
  LCurly,
  RCurly,
  SQuote,
  DQuote,
  Equals,
  Integer,
  GreaterThan,
  LessThan
];
