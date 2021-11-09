import { LexerPartitions } from "../../lexer";
import { Rule, RuleSet } from "../../lexer/rules";

interface Item {
  label: string;
  indent: number;
  data: {
    [key: string]: any;
  };
}

const inline_rules = {
  item_title: new Rule({
    token_type: "inline_item_title",
    tokenizer(src) {
      const matches = /^[^\|\n]*\s*\|?/.exec(src);
      if (matches) {
        const raw = matches[0];
        return {
          type: "item_ordered",
          raw,
          value: raw.substring(0, raw.length - 1).trim(),
        };
      }
    },
  }),

  item_attribute: new Rule<{ key: string; value: string }>({
    token_type: "inline_item_attribute",
    tokenizer(src) {
      const matches =
        /^\s*?,?\s*?[a-zA-Z0-9_]*\s*=\s*((\".*?\")|([^\|\n\s]*))\s*/.exec(src);
      if (matches) {
        const raw = matches[0];
        let [key, value] = raw.split("=");
        key = key.trim();
        value = value.trim();
        if (value[0] == '"') value = value.substring(1, value.length - 1);
        if (value[value.length - 1] == ",")
          value = value.substring(0, value.length - 1);

        return {
          type: "inline_item_attribute",
          raw,
          value: {
            key,
            value,
          },
        };
      }
    },
  }),
};

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
          value: cap[0].substring(0, cap[0].length - 1),
        };
      }
    },
    flags: {
      override_guard: true,
    },
    update_state(state) {
      state.partition = LexerPartitions.DESCRIPTION;
    },
  }),

  new Rule({
    token_type: "description",
    guards: [(s) => s.partition == LexerPartitions.DESCRIPTION],
    tokenizer(src) {
      const _cap = /(.*?\n)*?-\s/s.exec(src);
      if (_cap) {
        const str = _cap[0];
        const cap = str.substring(0, str.length - 2);
        return {
          type: "description",
          raw: cap,
          value: cap.substring(0, cap.length - 1),
        };
      }
    },
    update_state(state) {
      state.partition = LexerPartitions.BODY;
    },
  }),

  new Rule<Item>({
    token_type: "item_ordered",
    guards: [(s) => s.partition == LexerPartitions.BODY],
    tokenizer(src, state) {
      const matches = /^\ *-\s.*\n/.exec(src);
      if (matches) {
        const raw = matches[0];
        const indent = raw.length - raw.trimLeft().length;
        const line = raw.trimLeft().substring(1).trim();

        let m_raw = line;
        let col = 1;
        const label_token = inline_rules.item_title.tokenize(m_raw, state);
        if (!label_token)
          throw new SyntaxError(
            `Can not parse item label at line ${state.line_count}`
          );

        const label = label_token.token.value;
        const label_raw = label_token.token.raw;
        m_raw = m_raw.substring(label_raw.length);
        col += label_raw.length;

        const data: { [key: string]: string } = {};
        while (m_raw.length) {
          const attrib_token = inline_rules.item_attribute.tokenize(
            m_raw,
            state
          );
          if (!attrib_token)
            throw new SyntaxError(
              `Can not parse item attribute at line ${state.line_count}, col ${col}.`
            );
          const attrib_data = attrib_token.token.value;
          data[attrib_data.key] = attrib_data.value;
          m_raw = m_raw.substring(attrib_token.token.raw.length);
          col += attrib_token.token.raw.length;
        }

        return {
          type: "item_ordered",
          raw,
          value: {
            label,
            indent,
            data,
          },
        };
      }
    },
  }),

  new Rule({
    token_type: "markdown_block",
    guards: [(s) => s.partition == LexerPartitions.BODY],
    tokenizer(src) {
      const matches = /(\s*\.\.\..*)(.*\n)*(\s*\.\.\..*\n)/.exec(src);
      if (matches) {
        const raw = matches[0];
        const trimmed = raw.trim();
        const text = trimmed.substring(3, trimmed.length - 3).trim();
        return {
          type: "item_ordered",
          raw,
          value: text,
        };
      }
    },
  }),

  new Rule({
    token_type: "item_attribute",
    guards: [(s) => s.partition == LexerPartitions.BODY],
    tokenizer(src, state) {
      const matches = /^\s*\|\s*.*\n?/.exec(src);
      if (matches) {
        const raw = matches[0];
        const trimmed = raw.trim();
        const text = trimmed.substring(1).trim();
        let m_raw = text;
        let col = raw.length - raw.trimLeft().length;

        const data: { [key: string]: string } = {};
        while (m_raw.length) {
          const attrib_token = inline_rules.item_attribute.tokenize(
            m_raw,
            state
          );
          if (!attrib_token)
            throw new SyntaxError(
              `Can not parse item attribute at line ${state.line_count}, col ${col}.`
            );
          const attrib_data = attrib_token.token.value;
          data[attrib_data.key] = attrib_data.value;
          m_raw = m_raw.substring(attrib_token.token.raw.length);
          col += attrib_token.token.raw.length;
        }

        return {
          type: "item_attribute",
          raw,
          value: data,
        };
      }
    },
  }),
];
