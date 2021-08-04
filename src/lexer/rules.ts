import { Lexer, LexerState } from ".";
import { Token } from "./tokenizer";

export type RuleSet = Rule[];

interface RuleOptions {
  token_type: string;
  tokenizer: (src: string, state: LexerState) => Token;
  guards: ((state: LexerState) => void)[];
  flags: {
    override_guard: boolean;
  };
}

export class Rule {
  private options: RuleOptions;
  constructor(opts: {
    token_type: string;
    tokenizer: (src: string) => Token;
    guards?: ((state: LexerState) => void)[];
    flags?: {
      override_guard?: boolean;
    };
  }) {
    if (!opts.guards) opts.guards = [];
    if (!opts.flags)
      opts.flags = {
        override_guard: false,
      };
    // Add default guard. Reserve first line for title.
    if (!opts.flags.override_guard) {
      opts.flags.override_guard = false;
      opts.guards.push((x) => x.line_count != 0);
    }

    this.options = {
      token_type: opts.token_type,
      tokenizer: opts.tokenizer,
      guards: opts.guards,
      flags: {
        override_guard: opts.flags.override_guard,
      },
    };
  }

  will_enforce(state: LexerState) {
    return this.options.guards.every((x) => x(state));
  }

  tokenize(src: string, state: LexerState) {
    const token = this.options.tokenizer(src, state);
    const new_lines = (token.raw.match(/\r\n|\r|\n/g) || "").length;
    return {
      token,
      new_lines,
    };
  }
}
