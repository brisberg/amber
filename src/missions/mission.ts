import {declareOrphan} from 'spawn-system/orphans';

export interface MissionMemory {
  creeps: string[];
  nextCreep?: string;
}

/**
 * Abstract Mission class from which all Misions are derived.
 *
 * Missions in general are meant to organize a group of a single type of creeps
 * (note: behaviors only control one creep) to accomplish a very specific task.
 *
 * NOTE: Single type of creep may be changed in the future.
 *
 * This task could be to Harvest from a specific Source, Upgrade a single
 * Controller, transport goods between two distinct points.
 *
 * Missions should all be represented by a Flag. This means they can be
 * regenerated from scratch if necessary.
 *
 * Missions may be permanent or ephemeral. They all have several stages:
 *
 * Init() - This phase we validate our Memory aginst the world. Check to see
 * that Energy Node flags actually exist, the Harvest Container exists, etc. If
 * something is missing, we should retire ourselves (freeing up our assigned
 * Creeps). Leave it to who ever spawned this mission to fix what is missing and
 * restart the mission.
 *
 * RoleCall() - Validates our list of creeps, claims our new creep, and
 * potentially requests a new one.
 *
 * Run() - Runs the actions required for this mission. Usually just depends on
 * memory and fields set during Init(). Results in changes to our Memory and
 * Updates to Behavior Memory of our Creeps.
 */
export abstract class Mission<M extends MissionMemory> {
  public readonly name: string;
  public readonly room: Room|null = null;

  protected readonly mem: M;
  protected creeps: Creep[] = [];

  private readonly flag: Flag;

  protected abstract readonly bodyType: string;
  protected abstract readonly spawnPriority: number;

  constructor(flag: Flag) {
    this.name = flag.name;
    this.room = flag.room || null;
    this.flag = flag;

    // Init memory
    if (!Memory.missions[this.name]) {
      const mem: M = this.initialMemory();
      Memory.missions[this.name] = mem;
    }
    this.mem = Memory.missions[this.name] as M;
  }

  /**
   * Validates the Mission memory against the world. Looks up Game objects and
   * flags and saves them on the mission. If anything is amiss and the mission
   * cannot continue, return false.
   */
  public abstract init(): boolean;

  /**
   * Validates our list of creeps from Memory against the world. Claims the
   * latest creep we were assigned if we have one. Potentially requests more
   * from the spawn.
   */
  public roleCall(): void {
    // Purge names of dead/expired creeps
    this.mem.creeps = this.mem.creeps.filter((cName) => Game.creeps[cName]);
    this.creeps = this.mem.creeps.map((cName) => Game.creeps[cName]);

    // Claim reserved creep if it exists
    if (this.mem.nextCreep && Game.creeps[this.mem.nextCreep]) {
      const creep = Game.creeps[this.mem.nextCreep];
      this.mem.creeps.push(creep.name);
      this.creeps.push(creep);
      delete this.mem.nextCreep;
    } else {
      // Oh well, it wasn't spawned afterall
      delete this.mem.nextCreep;
    }

    // Check for creep allocation
    if (this.needMoreCreeps()) {
      this.mem.nextCreep = this.requestCreep(this.bodyType);
    }

    // TODO: Add a section to automatically release creeps we don't need
  }

  /** Requests another Creep from the SpawnQueue */
  protected requestCreep(bodyType: string): string {
    return global.spawnQueue.requestCreep({
      bodyType,
      mission: this.name,
      priority: this.spawnPriority,
    });
  }

  /**
   * Executes one update tick for this mission. We can assume that Memory and
   * all needed Game Objects are available and in play.
   */
  public abstract run(): void;

  /**
   * Initialize the mission specfic memory for this mission. Usually only
   * called for new missions.
   */
  protected abstract initialMemory(): M;
  /** Return true if this mission needs to request a new Creep */
  protected abstract needMoreCreeps(): boolean;

  /**
   * Retires the missions. Deallocates all of its memory, removes its mission
   * flag, orphans all of its creeps and returns the list of orphaned creeps.
   */
  public retire(): Creep[] {
    console.log('Retiringing mission ' + this.name);
    this.creeps.forEach((creep) => declareOrphan(creep));
    delete Memory.missions[this.name];
    this.flag.remove();

    return this.creeps;
  }
}
