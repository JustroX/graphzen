/**
 * Plugin interface
 * @author Justine Romero
 */
export interface Plugin<Task = any, Pre = any, Post = any> {
  /**
   * Called before parsing the text
   */
  init(): Promise<void>;

  /**
   * Hook to be called before calling each task
   * @param data initial parsed data
   */
  pre(data: Pre): Promise<void>;

  /**
   * Process each task in the tree
   * @param data single task
   */
  each(data: Task): Promise<void>;

  /**
   * Returns the final representation of data
   */
  post(data: Pre): Promise<Post>;
}
