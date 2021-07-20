import { BaseFormat } from "./formats/base";
import { TreeParser } from "./formats/tree";

/**
 * Main graphzen class
 * @author Justine Romero
 */
export class Graphzen {
  private formats: { [format: string]: BaseFormat<any> } = {
    tree: new TreeParser(),
  };

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
    const data = await this.formats[format].parse(text);
    return data as T;
  }
}
