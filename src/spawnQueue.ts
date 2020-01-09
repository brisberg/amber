import {BodyPartManifest, generateManifestFromBody} from 'utils/bodypartManifest';
import {totalCost} from 'utils/workerUtils';

/**
 * Represents the queue of creeps to be build by a given spawner.
 *
 * For now this is a barebones implementation, we will need to expand on it to
 * incorporate specific activities/operations later. For now it will manage all
 * of the spawning for a single spawner.
 */

/**
 * Request object for a single Creep to be spawned. Subject to priority,
 * usually requested by missions.
 */
export interface SpawnRequest {
  priority: number;
  name: string;
  body: BodyPartConstant[];
  options?: SpawnOptions;
}

/**
 * Interface representing a "promise" to spawn a specified creep in the future.
 * Returned to missions from the spawn system when a new creep is requested.
 * These creeps will be spawned eventaully and assigned to the requesting
 * mission.
 */
export interface SpawnReservation {
  name: string;
  loadout: BodyPartManifest;
}

export class SpawnQueue {
  private spawner: StructureSpawn;
  private mem: SpawnMemory;

  constructor(spawner: StructureSpawn) {
    this.spawner = spawner;
    this.mem = Memory.spawns[spawner.name];

    if (!this.mem) {
      Memory.spawns[spawner.name] = {requests: []};
    }
  }

  public requestCreep(request: SpawnRequest): SpawnReservation {
    // TODO: Validate that creep cost is less than total spawn storage
    this.mem.requests.push(request);
    this.sortQueueByPriority();
    return {
      loadout: generateManifestFromBody(request.body),
      name: request.name,
    };
  }

  /** Executes one update tick of the spawner */
  public run() {
    if (this.mem.requests.length === 0) {
      return;
    }

    if (this.spawner.spawning) {
      return;
    }

    if (this.spawner.store.energy >= totalCost(this.mem.requests[0].body)) {
      const request = this.mem.requests.shift();
      this.spawner.spawnCreep(request.body, request.name, request.options);
    }
  }

  private sortQueueByPriority() {
    this.mem.requests.sort((a, b) => b.priority - a.priority);
  }
}
