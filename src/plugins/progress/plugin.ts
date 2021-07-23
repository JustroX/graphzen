import { Store } from ".";
import { Plugin } from "../";
import { Task } from "../../formats/base";
import { ParsedTree } from "../../formats/tree";

export class ProgressPlugin implements Plugin<Task, ParsedTree, ParsedTree> {
  private all_checked: boolean = true;
  private latest?: string;
  private has_name: { [name: string]: boolean } = {};
  private file?: string;

  constructor(
    private readonly store: Store,
    private pre_hook: (name: string) => Promise<void>
  ) {}

  async init() {
    this.all_checked = true;
  }

  async pre(tree: ParsedTree) {
    tree.flags.push("has_progress");
    this.file = tree.name;
    if (!this.store[this.file]) this.store[this.file] = {};
    await this.pre_hook(tree.name);
  }

  async each(task: Task) {
    if (!this.file) throw new Error("File has not been properly initialized.");
    const name = task.name;
    const is_checked = !!this.store[this.file][name];
    if (is_checked) task.flags.push("is_checked");

    if (this.has_name[name]) throw new Error("Task names should be unique.");
    this.has_name[name] = true;

    if (this.all_checked) this.latest = name;
    if (this.all_checked && !is_checked) this.all_checked = false;
  }

  async post(data: ParsedTree): Promise<ParsedTree> {
    if (this.all_checked) data.flags.push("is_checked");
    data.plugins = {
      progress: {
        latest: this.latest as string,
      },
    };
    return data;
  }
}
