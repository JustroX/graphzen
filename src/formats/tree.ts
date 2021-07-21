import { BaseFormat, Task } from "./base";

/**
 * Output interface of tree parser
 * @author Justine Romero
 */
export interface ParsedTree {
  version: "1.0.0";
  name: string;
  flags: string[];
  tasks: Task[];
  plugins: {
    [scope: string]: {
      [field: string]: any;
    };
  };
}

/**
 * State stack item
 * @author Justine Romero
 */
interface StackItem extends Task {
  indent: number;
  children: StackItem[];
}

/**
 * State while parsing
 * @author Justine Romero
 */
interface ParsingState {
  stack: StackItem[];
  is_capturing_notes: boolean;
  md_indent: number;
}

/**
 * Tree parser class
 * @author Justine Romero
 */
export class TreeParser implements BaseFormat<ParsedTree> {
  /**
   * Parse text into a graphzen tree format
   * @param text text to be parsed
   * @returns Parsed tree
   */
  async parse(text: string) {
    const result: ParsedTree = {
      version: "1.0.0",
      name: "",
      flags: [],
      tasks: [],
      plugins: {},
    };
    const lines = text.split("\n").map((x) => (!x ? " " : x));
    if (lines.length <= 0) throw new Error("Can not parse empty text.");
    let line: string | undefined = lines.shift() as string;
    result.name = line.trim();

    const state: ParsingState = {
      stack: [],
      is_capturing_notes: false,
      md_indent: 0,
    };
    while ((line = lines.shift())) this.parse_line(line, state);
    this.flush_stack(state, 0);
    result.tasks = this.cleanTasks(state.stack);
    return result;
  }

  /**
   * Returns an iterable of the tasks in the tree
   * @param tree parsed tree
   * @returns iterable of the tasks in the tree
   */
  traverse(tree: ParsedTree): Iterable<Task> {
    return (function* () {
      const stack = [];
      stack.push(...tree.tasks.reverse());
      while (stack.length) {
        const head = stack.pop() as Task;
        if (head?.children.length) stack.push(...head.children.reverse());
        yield head;
      }
    })();
  }

  private cleanTasks(tasks: StackItem[]): Task[] {
    return tasks.map((x) => ({
      ...x,
      indent: undefined,
      children: this.cleanTasks(x.children),
    }));
  }

  private flush_stack(state: ParsingState, indent: number) {
    const { stack } = state;
    let head = stack[stack.length - 1];
    while (true) {
      head = stack[stack.length - 1];
      if ((head?.indent ?? 0) < indent) break;
      if ((head?.indent ?? 0) == 0) break;
      stack.pop();
    }
  }

  private parse_line(line: string, state: ParsingState) {
    const indent = line.length - line.trimLeft().length;
    const trimmed = line.trim();

    if (trimmed == "...") this.handle_md_boundary(line, state);
    else if (state.is_capturing_notes) this.handle_plain(line, state);
    else if (trimmed.slice(0, 2) == "- ")
      this.handle_task(trimmed.slice(2), indent, state);
    else if (trimmed.slice(0, 2) == "| ")
      this.handle_prop_line(trimmed.slice(2), state);
  }

  private handle_task(line: string, indent: number, state: ParsingState) {
    const { stack } = state;
    const [name, prop] = line.split("|");

    const task: StackItem = {
      name,
      props: {},
      children: [],
      flags: [],
      indent,
    };

    if (prop) {
      const [k, v] = this.parse_prop(prop);
      task.props[k] = v;
    }

    let head = stack[stack.length - 1];
    if (head) {
      if (indent > head.indent) {
        head.children.push(task);
      } else {
        this.flush_stack(state, indent);
        head = stack[stack.length - 1];
        if (head?.indent < indent) head.children.push(task);
      }
    }
    stack.push(task);
  }

  private handle_md_boundary(line: string, state: ParsingState) {
    const { stack } = state;
    const head = stack[stack.length - 1];
    if (!head) throw new Error("Notes has no parent task.");

    if (head.notes && state.is_capturing_notes) {
      state.is_capturing_notes = false;
    }
    if (!head.notes && !state.is_capturing_notes) {
      head.notes = "";
      state.is_capturing_notes = true;
    }
  }

  private handle_prop_line(line: string, state: ParsingState) {
    const { stack } = state;
    const head = stack[stack.length - 1];
    if (!head) throw new Error("Property has no parent task.");
    const [k, v] = this.parse_prop(line);
    head.props[k] = v;
  }

  private handle_plain(line: string, state: ParsingState) {
    const { stack } = state;
    const head = stack[stack.length - 1];
    if (!head) throw new Error("Notes has no parent task.");

    if (head.notes == "")
      state.md_indent = line.length - line.trimLeft().length;

    const indent = line.length - line.trimLeft().length;
    if (indent >= state.md_indent) line = line.slice(state.md_indent);
    else state.md_indent = indent;

    head.notes += `${line}\n`;
  }

  private parse_prop(line: string) {
    const [key, val] = line.split("=");
    return [key.trim(), val.trim()];
  }
}
