import {IDLER, Idler} from '../behaviors/idler';
import {totalCost} from '../utils/creepBodyUtils';

import {creepBodyRatios, GenerateCreepBodyOptions, generateFlexibleCreep} from './bodyTypes';
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
  name?: string;  // Determined by SpawnQueue, not requester
  priority: number;
  bodyRatio: string;
  bodyOptions?: GenerateCreepBodyOptions;
  mission: string;
  options?: SpawnOptions;
}

export class SpawnQueue {
  private readonly spawner: StructureSpawn;
  private readonly requests: SpawnRequest[] = [];

  constructor(spawner: StructureSpawn) {
    this.spawner = spawner;
  }

  /**
   * Queue a request for a Creep with the SpawnQueue. Returns the name of the
   * future Creep if it is ever spawned.
   */
  public requestCreep(request: SpawnRequest): string {
    // TODO: Maybe find a better system for avoid collisions?
    let name;
    while (!name || Game.creeps[name]) {
      name = request.bodyRatio + Math.floor(Math.random() * 9999);
    }
    request.name = name;
    this.requests.push(request);

    return name;
  }

  /** Executes one update tick of the spawner */
  public run() {
    if (this.requests.length === 0) {
      return;
    }

    this.sortQueueByPriority();

    // Look for Orphaned creeps
    const orphans: Creep[] = [];
    for (const name in Game.creeps) {
      const creep = Game.creeps[name];

      if (isOrphan(creep)) {
        orphans.push(creep);
      }
    }

    // Attempt to fulfill requests with orphans in priority order and filter out
    // those requests in the process
    this.requests.filter((request) => {
      const index = orphans.findIndex((orphan) => {
        // TODO: Expand this check to look for things like Min/Max parts
        return orphan.memory.bodyRatio === request.bodyRatio;
      });

      if (index !== -1) {
        const match = orphans.splice(index, 1)[0];
        this.assignToMission(match, request.mission);
        return false;  // Request was fultilled
      }
      return true;
    });

    if (this.spawner.spawning) {
      return;
    }

    if (this.requests.length === 0) {
      return;
    }

    // Attempt to spawn the highest priority remaining request
    const req = this.requests.shift()!;

    // Generate the flex creep with the given body ratio and options.
    const body = generateFlexibleCreep(
        this.spawner.room.energyCapacityAvailable,
        creepBodyRatios[req.bodyRatio], req.bodyOptions);

    if (this.spawner.room.energyAvailable >= totalCost(body)) {
      const defaultOptions: SpawnOptions = {
        memory: {
          behavior: IDLER,
          bodyRatio: req.bodyRatio,
          mem: Idler.initMemory(),
          mission: null,
        },
      };

      let combinedOptions = defaultOptions;
      if (req.options && req.options.memory) {
        combinedOptions = {
          ...req.options,
          memory: {
            ...req.options.memory,
            bodyRatio: req.bodyRatio,
            mission: req.mission,
          },
        };
      }
      // console.log(`Spawning new creeps: ${req.name} with ${body}`);
      this.spawner.spawnCreep(body, req.name!, combinedOptions);
    }
  }

  private assignToMission(creep: Creep, mission: string) {
    console.log('Assigned orhpan ' + creep.name + ' to ' + mission);
    creep.memory.mission = mission;
    const missMem = Memory.missions[mission];
    if (missMem) {
      missMem.nextCreep = creep.name;
    }
    return;
  }

  /**
   * Sorts the request queue in descenting priority order.
   *
   * (Priority 1 is the highest priority)
   */
  private sortQueueByPriority() {
    this.requests.sort((a, b) => a.priority - b.priority);
  }
}
