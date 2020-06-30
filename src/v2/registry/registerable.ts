export interface Registerable {
  name: string;
}

export interface RegisterableMemory {
  type: string;  // Name of Object Class this memory should instantiate
}

export type FromTypeFn<R> = (type: string, name: string) => R|null;
