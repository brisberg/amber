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

import {getMemory, setMemory} from './utils';


export interface MissionMemory<M> {
  creeps: string[];      // Names of owned creeps
  nextCreep?: string;    // Name of possible next creep
  spawnSource?: string;  // Optional name of foreign SpawnQueue
  colony: string;        // WIP Roomname of host colony
  data: M;               // Mission specific data fields
}

export default abstract class Mission<M> {
  private mem: MissionMemory<M>;

  protected abstract maxCreeps: number;
  protected abstract bodyType: string;

  constructor(readonly name: string, roomName: string) {
    this.mem = getMemory(this);

    if (this.mem === undefined) {
      // No existing memory, initialize default
      this.mem = {
        creeps: [],
        colony: roomName,
        data: this.initMemory(),
      };
      setMemory(this, this.mem);
    }
  }

  /**
   * Mission specific memory initialization. Sub-classes should set up their
   * specific data fields.
   */
  protected abstract initMemory(): M;

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
