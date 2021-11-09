export interface Token<T = string> {
  type: string;
  raw: string;
  value: T;
}
