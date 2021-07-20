/**
 * Base task interface
 * @author Justine Romero
 */
export interface Task {
  name: string;
  notes?: string;
  props: {
    [prop: string]: string;
  };
  children: Task[];
  flags: string[];
}

/**
 * Base class for formats
 * @author Justine Romero
 */
export interface BaseFormat<Format> {
  /**
   * Parse text into the specified format
   * @param text the text to be parsed
   */
  parse: (text: string) => Promise<Format>;
}
