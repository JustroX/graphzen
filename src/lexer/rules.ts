import { LexerState } from ".";
import { Token } from "./tokenizer";

export type RuleSet = Rule<any>[];

interface RuleOptions<T = string> {
  token_type: string;
  tokenizer: (src: string, state: LexerState) => Token<T> | undefined;
  guards: ((state: LexerState) => void)[];
  update_state?: (state: LexerState) => void;
  flags: {
    override_guard: boolean;
  };
}

export class Rule<T = string> {
  private options: RuleOptions<T>;
  constructor(opts: {
    token_type: string;
    tokenizer: (src: string, state: LexerState) => Token<T> | undefined;
    guards?: ((state: LexerState) => void)[];
    flags?: {
      override_guard?: boolean;
    };
    update_state?: RuleOptions["update_state"];
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
      update_state: opts.update_state,
      guards: opts.guards,
      flags: {
        override_guard: opts.flags.override_guard,
      },
    };
  }

  update_state(state: LexerState) {
    if (this.options.update_state) this.options.update_state(state);
    return state;
  }

  will_enforce(state: LexerState) {
    return this.options.guards.every((x) => x(state));
  }

  tokenize(src: string, state: LexerState) {
    const token = this.options.tokenizer(src, state);
    if (token) {
      const new_lines = (token.raw.match(/\r\n|\r|\n/g) || "").length;
      return {
        token,
        new_lines,
      };
    }
  }
}
