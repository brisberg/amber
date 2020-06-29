import {constructOperationFromType} from '.';
import Operation from './operation';

/**
 * Operation Registry is map which holds references to all initialized Operation
 * Objects.
 *
 * It is stored on the global scope, meaning it will persist between ticks to
 * avoid rebuilding the Operation Objects.
 */
export class OperationRegistry {
  private operationMap: {[name: string]: Operation} = {}

  /**
   * Initialize the Operation Registry from scratch.
   *
   * Usually called after a Global Reset
   */
  public init(): void {
    this.operationMap = {};

    for (const name in Memory.operations) {
      if ({}.hasOwnProperty.call(Memory.operations, name)) {
        const mem = Memory.operations[name];
        const op = constructOperationFromType(mem.type, name);

        if (op) {
          this.register(op);
        }
      }
    }
  }

  /**
   * Refresh the Operation Registry from the world once per tick.
   */
  public refresh(): void {
    throw new Error('Unimplemented');
  }

  /**
   * Registers a new Operation into the Global Registry.
   * @param Operation Operation to register
   */
  public register(operation: Operation): Operation {
    this.operationMap[operation.name] = operation;
    return operation;
  }

  /**
   * Removes the specified Operation or Operation name from the Global Registry
   */
  public unregister(opOrName: Operation|string): boolean {
    const key = opOrName instanceof Operation ? opOrName.name : opOrName;

    if (this.operationMap[key]) {
      delete this.operationMap[key];
      return true;
    }

    return false;
  }

  /** Returns a specific Operation by name. Null if not registered */
  public get(name: string): Operation|null {
    return this.operationMap[name] || null;
  }

  /** Returns a list of all operations registered */
  public list(): Operation[] {
    return Object.values(this.operationMap);
  }
}
