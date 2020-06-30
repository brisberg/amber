import {FromTypeFn, Registerable, RegisterableMemory} from './registerable';

/**
 * Registry is map which holds references to all initialized Registerable
 * Objects.
 *
 * It is stored on the global scope, meaning it will persist between ticks to
 * avoid rebuilding the Registered Objects.
 */
export class Registry<R extends Registerable> {
  private map: {[name: string]: R} = {};

  constructor(private constructObjectFromType: FromTypeFn<R>) {}

  /**
   * Initialize the Registry from scratch.
   *
   * Usually called after a Global Reset
   */
  public init(memories: {[name: string]: RegisterableMemory}): void {
    this.map = {};

    for (const name in memories) {
      if ({}.hasOwnProperty.call(memories, name)) {
        const mem = memories[name];
        const msn = this.constructObjectFromType(mem.type, name);

        if (msn) {
          this.register(msn);
        }
      }
    }
  }

  /**
   * Refresh the Mission Registry from the world once per tick.
   */
  public refresh(): void {
    throw new Error('Unimplemented');
  }

  /**
   * Registers a new mission into the Global Registry.
   * @param mission Mission to register
   */
  public register(registerable: R): R {
    this.map[registerable.name] = registerable;
    return registerable;
  }

  /**
   * Removes the specified Registerable or registration key from the Global
   * Registry
   */
  public unregister(msnOrName: R|string): boolean {
    const key = typeof msnOrName === 'string' ? msnOrName : msnOrName.name;

    if (this.map[key]) {
      delete this.map[key];
      return true;
    }

    return false;
  }

  /** Returns a specific Registerable by name. Null if not registered */
  public get(name: string): R|null {
    return this.map[name] || null;
  }

  /** Returns a list of all Registered Objects registered */
  public list(): R[] {
    return Object.values(this.map);
  }
}
