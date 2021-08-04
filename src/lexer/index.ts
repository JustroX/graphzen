import { RuleSet } from "./rules";
import { Token } from "./tokenizer";

/**
 * State during lexing
 */
export interface LexerState {
  line_count: number;
}

/**
 * Lexer class
 */
export class Lexer {
  constructor(private readonly ruleset: RuleSet) {}

  /**
   * Lex text
   * @param src source text
   */
  lex(src: string): Token[] {
    const tokens: Token[] = [];
    const state: LexerState = {
      line_count: 0,
    };

    while (src) {
      let matched = false;
      for (const rule of this.ruleset) {
        if (rule.will_enforce(state)) {
          let token: Token;
          let new_lines: number;
          if (({ token, new_lines } = rule.tokenize(src, state))) {
            src = src.substring(token.raw.length);
            state.line_count += new_lines;
            tokens.push(token);
            matched = true;
            break;
          }
        }
      }
      if (!matched)
        throw new SyntaxError(
          `No matching keyword for "${src.slice(0, 10)}" at line ${
            state.line_count
          }`
        );
    }

    return tokens;
  }
}
