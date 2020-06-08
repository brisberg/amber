import {deleteMemory, getMemory, setMemory} from './utils';


export interface MissionMemory<M> {
  creeps: string[];      // Names of owned creeps
  nextCreep?: string;    // Name of possible next creep
  spawnSource?: string;  // Optional name of foreign SpawnQueue
  colony: string;        // WIP Roomname of host colony
  data: M;               // Mission specific data fields
}

/**
 * Abstract Mission base class all other missions with inherit from.
 *
 * Missions are self-renewing collections of similar creeps performing a
 * specific set of tasks. They will request new creeps from their parent
 * SpawnQueue when they are below their allocation.
 *
 * Missions run in 4 phases:
 *
 * - Init
 *
 * When the mission is originally instantiated. Queries all game objects and
 * stores any imporatant variables in a global instance.
 *
 * - Refresh
 *
 * Each tick, missions will re-query for game objects and references.
 *
 * - Validate
 *
 * Each tick, missions will check for validation conditions. If the mission is
 * no longer valid, clear the mission and retire all creeps.
 *
 * - Roll Call
 *
 * Each tick, missions will validate their existing assigned creeps. If they are
 * below the required number it will request a new one from the SpawnQueue.
 *
 * Some missions may release creeps if the mission is over populated.
 *
 * - Run (Execute)
 *
 * Executes the action steps for this mission, setting or resetting the behavior
 * of each creep in the mission.
 *
 * Generic type M is the specialized memory data type for this mission.
 * Generic type C is the configuration type for this mission.
 */
export default abstract class Mission<M = {}, C = {}> {
  protected mem: MissionMemory<M>;

  constructor(readonly name: string) {
    this.mem = getMemory(this);
  }

  // ### Abstract Fields #### //
  /** BodyRatio of creeps used by this mission. */
  protected abstract bodyType: string;

  /** Mission specific initializer to set up initial memory/config */
  protected abstract initialize(config: C): void;
  /** Mission specific handler to update GameObject references each tick. */
  protected abstract reconcile(): void;

  /**
   * Mission specific memory initialization. Sub-classes should set up their
   * specific data fields.
   */
  protected abstract initMemory(config: C): M;

  /**
   * Mission specific calculation for the maximum number of creeps to hold.
   */
  protected abstract get maxCreeps(): number;

  /**
   * Mission specific creep actions to be executed when mission is executed.
   */
  protected abstract creepActions(): void;

  /**
   * Mission specific cleanup when the mission is retired.
   */
  protected abstract finalize(): void;
  // #### End Abstract Fields #### //


  // #### Public API #### //
  /**
   * Initializes this mission.
   *
   * Validates that there is not a duplicate mission in the Global Registry.
   *    If not, returns null to void the mission
   * Registers the mission in the registry
   * Formats initial Mission Memory
   * Runs sub-class initializer
   * Refreshes specialized mission state.
   *
   * Returns the initialized Mission object so missions can be spawned:
   * const msn = new Mission(...).init('room', {config});
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public init(roomName: string, config: C): this|null {
    if (this.mem === undefined) {
      // No existing memory, initialize default
      this.mem = {
        creeps: [],
        colony: roomName,
        data: this.initMemory(config),
      };
      setMemory(this, this.mem);
    }

    this.initialize(config);

    return this;
  }

  /**
   * Refreshes the mission based on the world state this tick.
   *
   * Reaquires fresh references to GameObjects needed by the mission.
   */
  public refresh(): void {
    throw new Error('Not Implemented');
  }

  public rollCall(): void {
    // Aquire next creep from last tick if it exists
    if (this.mem.nextCreep && Game.creeps[this.mem.nextCreep]) {
      // Creep exists, grab it!
      this.mem.creeps.push(this.mem.nextCreep);
    } else {
      // Oh well, remove flag so we can re-request
      delete this.mem.nextCreep;
    }

    if (this.mem.creeps.length >= this.maxCreeps) return;

    this.mem.nextCreep = global.spawnQueues[this.SpawnSource].requestCreep({
      bodyRatio: this.bodyType,
      priority: 1,
      mission: this.name,
    });
  }

  /** Execute one update tick for this mission */
  public run(): void {
    this.creepActions();
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

  public assignCreep(creep: Creep): void {
    // TODO: validate the creep has needed parts?
    this.mem.creeps.push(creep.name);
  }
  // #### End Public API #### //

  private get SpawnSource(): string {
    return this.mem.spawnSource || this.mem.colony;
  }
}
