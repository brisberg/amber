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
 */


export interface MissionMemory {
  creeps: string[];      // Names of owned creeps
  nextCreep: string;     // Name of possible next creep
  spawnSource?: string;  // Optional name of foreign SpawnQueue
}

export abstract class Mission<M extends MissionMemory> {
  protected abstract maxCreeps: number;

  protected abstract bodyType: string;

  constructor(readonly name: string) {}

  public init(): void {
    throw new Error('Not Implemented');
  }

  public rollCall(): void {
    throw new Error('Not Implemented');
  }

  public run(): void {
    throw new Error('Not Implemented');
  }
}
