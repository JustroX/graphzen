import { Rule, RuleSet } from "../../lexer/rules";

export const default_rules: RuleSet = [
  new Rule({
    token_type: "title",
    guards: [(s) => s.line_count == 0],
    tokenizer(src) {
      const cap = /^.*\n/.exec(src);
      if (cap) {
        return {
          type: "title",
          raw: cap[0],
          value: cap[0],
        };
      }
    },
    flags: {
      override_guard: true,
    },
  }),

  new Rule({
    token_type: "description",
    tokenizer(src) {
      return undefined;
    },
  }),
];
