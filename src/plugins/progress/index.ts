import { ProgressPlugin } from "./plugin";

export interface Store {
  [file: string]: {
    [task: string]: boolean;
  };
}

/**
 * Class to manage progress saved in browser's localstorage
 * @author Justine Romero
 */
export class BrowserProgress {
  private readonly store_key = "graphzen:store";
  private file: string = "";
  private store: Store = {};

  constructor() {
    const store_str = localStorage.getItem(this.store_key) ?? "";
    if (store_str == "" || !store_str) this.saveStore();
    else this.store = JSON.parse(store_str);
  }

  /**
   * Set the current opened file
   * @param name name of the file
   */
  setFile(name: string) {
    this.file = name;
  }

  private saveStore() {
    localStorage.setItem(this.store_key, JSON.stringify(this.store));
  }

  private assertFile() {
    if (!this.store[this.file]) this.store[this.file] = {};
  }

  /**
   * Mark progress of a task
   * @param task Name of task
   */
  mark(task: string) {
    this.assertFile();
    this.store[this.file][task] = true;
    this.saveStore();
  }

  /**
   * Unmark progress of a task
   * @param task Name of task
   */
  unmark(task: string) {
    this.assertFile();
    this.store[this.file][task] = false;
    this.saveStore();
  }

  /**
   * Returns whether a task is marked
   * @param task Name of task
   * @returns true if task is marked
   */
  is_marked(task: string) {
    this.assertFile();
    return !!this.store[this.file][task];
  }

  /**
   * Returns a progress plugin
   * @returns the plugin
   */
  plugin() {
    return new ProgressPlugin(this.store[this.file]);
  }
}
