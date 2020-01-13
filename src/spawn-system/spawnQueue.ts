import {IDLER} from 'behaviors/idler';
import {registerEnergyNode} from 'energy-network/energyNode';
import {request} from 'http';
import {BodyPartManifest, generateManifestFromBody} from 'utils/bodypartManifest';
import {totalCost} from 'utils/workerUtils';

import {isOrphan} from './orphans';

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
  bodyType: string;
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
      this.mem = Memory.spawns[spawner.name] = {requests: []};
    }

    if (!Game.flags['enode_' + this.spawner.name]) {
      // Register us as an Energy Sink
      registerEnergyNode(
          this.spawner.room, [this.spawner.pos.x, this.spawner.pos.y], {
            persistant: true,
            polarity: -10,
            structureID: this.spawner.id,
            type: 'structure',
          });
    }
  }

  // tslint:disable-next-line: no-shadowed-variable
  public requestCreep(request: SpawnRequest): Creep|SpawnReservation {
    // Look for Orphaned creeps
    for (const name in Game.creeps) {
      const creep = Game.creeps[name];

      if (isOrphan(creep) && creep.memory.bodyType === request.bodyType) {
        return creep;
      }
    }

    // TODO: Validate that creep cost is less than total spawn storage
    this.mem.requests.push(request);
    this.sortQueueByPriority();
    return {
      loadout: generateManifestFromBody(request.body),
      name: request.name,
    };
  }

  /** Removes a creep name from the spawn queue */
  public cancelReservation(name: string) {
    this.mem.requests = this.mem.requests.filter((res: SpawnRequest) => {
      return res.name !== name;
    });
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
      const req = this.mem.requests.shift();

      const defaultOptions: SpawnOptions = {
        memory: {
          behavior: IDLER,
          bodyType: req.bodyType,
          mem: null,
          mission: null,
        },
      };

      let combinedOptions = defaultOptions;
      if (req.options && req.options.memory) {
        combinedOptions = {
          ...req.options,
          memory: {
            ...req.options.memory,
            bodyType: req.bodyType,
          },
        };
      }
      this.spawner.spawnCreep(req.body, req.name, combinedOptions);
    }
  }

  /**
   * Sorts the request queue in descenting priority order.
   *
   * (Priority 1 is the highest priority)
   */
  private sortQueueByPriority() {
    this.mem.requests.sort((a, b) => a.priority - b.priority);
  }
}
