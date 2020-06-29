import {deleteMemory, getMemory, setMemory} from './utils';


export interface OperationMemory<M> {
  type: string;          // KEY of the Mission class for this memory
  spawnSource?: string;  // Optional name of foreign SpawnQueue
  colony: string;        // WIP Roomname of host colony
  data: M;               // Operation specific data fields
}

/**
 * Abstract Operation base class all other operations with inherit from.
 *
 */
export default abstract class Operation<
    M = Record<string, unknown>, C = Record<string, unknown>> {
  protected mem: OperationMemory<M>;

  constructor(readonly name: string) {
    this.mem = getMemory(this);
  }

  // ### Abstract Fields #### //

  /** Operation specific initializer to set up initial memory/config */
  protected abstract initialize(config: C): void;
  /** Operation specific handler to update GameObject references each tick. */
  protected abstract reconcile(): void;

  /**
   * Operation specific memory initialization. Sub-classes should set up their
   * specific data fields.
   */
  protected abstract initMemory(config: C): M;

  /** Execute one update tick for this mission */
  public abstract run(): void;

  /**
   * Operation specific cleanup when the operation is retired.
   */
  protected abstract finalize(): void;
  // #### End Abstract Fields #### //


  // #### Public API #### //
  /**
   * Initializes this operation.
   *
   * Registers the operation in the registry
   * Formats initial operation Memory
   * Runs sub-class initializer
   * Refreshes specialized operation state.
   *
   * Returns the initialized Operation object so operations can be spawned:
   * const msn = new Operation(...).init('room', {config});
   */
  public init(roomName: string, config: C): this {
    if (this.mem === undefined) {
      // No existing memory, initialize default
      this.mem = {
        type: this.constructor.name,
        colony: roomName,
        data: this.initMemory(config),
      };
      setMemory(this, this.mem);
    }

    this.initialize(config);

    return this;
  }

  /**
   * Refreshes the operation based on the world state this tick.
   *
   * Reaquires fresh references to GameObjects needed by the operation.
   */
  public refresh(): void {
    throw new Error('Not Implemented');
  }

  /**
   * Remove and cleanup the mission. Creep up creeps, flags, and memory
   * resources.
   */
  public retire(): void {
    this.finalize();

    deleteMemory(this);
  }

  /**
   * Overrides the SpawnQueue from which this mission will request Creeps.
   *
   * @param source RoomName of Foreign SpawnQueue
   */
  public setSpawnSource(source: string): void {
    this.mem.spawnSource = source;
  }
}
