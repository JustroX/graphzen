import { BaseFormat } from "./formats/base";
import { TreeParser } from "./formats/tree";
import { Plugin } from "./plugins";

/**
 * Main graphzen class
 * @author Justine Romero
 */
export class Graphzen {
  private formats: { [format: string]: BaseFormat<any> } = {
    tree: new TreeParser(),
  };

  private plugins: Plugin[] = [];

  constructor() {}

  /**
   * Register a data parser
   * @param label Name of the new format
   * @param parser The parser object
   */
  register(label: string, parser: BaseFormat<any>) {
    this.formats[label] = parser;
  }

  /**
   * Parse text into the specified format
   * @param text the text to be parsed
   * @param format the format of the output
   * @returns the parsed graphzen markup
   */
  async parse<T>(text: string, format: string = "tree") {
    for (const plugin of this.plugins) await plugin.init();

    const formater = this.formats[format];
    let data = await formater.parse(text);

    // Pre-hooks
    for (const plugin of this.plugins) await plugin.pre(data);
    // Traversal
    for (const plugin of this.plugins)
      for (const task of formater.traverse(data)) await plugin.each(task);
    // Post-hooks
    for (const plugin of this.plugins) data = await plugin.post(data);

    return data as T;
  }

  /**
   * Install a plugin
   * @param plugin the plugin to be installed
   */
  install(plugin: Plugin) {
    this.plugins.push(plugin);
  }
}
