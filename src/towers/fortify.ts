/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {setCreepBehavior} from 'behaviors/behavior';
import {ENET_FETCHER, ENetFetcher} from 'behaviors/eNetFetcher';
import {IDLER} from 'behaviors/idler';
import {Repairer, REPAIRER} from 'behaviors/repairer';
import {EnergyNode} from 'energy-network/energyNode';
import {CARRY_WORKER, GenerateCreepBodyOptions} from 'spawn-system/bodyTypes';

export interface FortifyMemory {
  room: string|null;
  eNodeFlag: string|null;
  targetIDs: {[id: string]: number};
  creep: string|null;
  wallHeight: number;
}

/**
 * Hits Buffer above wall height to repair up to. Not a factor of 25k to avoid
 * an extra creep repairing Ramparts.
 */
export const REPAIR_BUFFER = 80000;

/**
 * Fortify Mission is a room scopped mission to build and repair
 * walls/ramparts to enhance defences.
 *
 * This mission will request a cworker creep to perform the repairs.
 */
export class FortifyMission {
  protected readonly spawnPriority = 3;
  protected readonly bodyType = CARRY_WORKER;
  protected readonly bodyOptions: GenerateCreepBodyOptions = {max: {work: 5}};

  public eNode: EnergyNode|null = null;
  public targets: Array<StructureWall|StructureRampart> = [];

  constructor(private mem: FortifyMemory) {}

  /** @override */
  public init(): boolean {
    if (!this.mem.room || !Game.rooms[this.mem.room] ||
        !Game.rooms[this.mem.room].controller!.my) {
      console.log(
          `Fortify Mission ${this.mem.room}: Does not own room. Retiring`);
      return false;
    }

    if (this.mem.eNodeFlag && Game.flags[this.mem.eNodeFlag]) {
      this.eNode = new EnergyNode(Game.flags[this.mem.eNodeFlag]);
    }
    this.targets =
        Object.keys(this.mem.targetIDs)
            .map((id) => Game.getObjectById(id))
            .filter((t) => !!t) as Array<StructureWall|StructureRampart>;

    return true;
  }

  /** Executes one update tick for this mission */
  public run(): void {
    if (!this.mem.creep || !this.eNode) {
      return;
    }

    const target = this.targets[0];
    if (!target) {
      return;
    }

    /**
     * If they are fetching
     *    and source is not correct, fixit
     *    and they are full, swap
     * If they are depositing
     *    and dest is wrong, fix it
     *    and they are empty, swap
     */

    // Direct each creep to pick up or dropoff
    const creep = Game.creeps[this.mem.creep];
    if (!creep) return;

    if (creep.memory.behavior === IDLER) {
      // Pickup newly spawned idle creeps
      creep.memory.behavior = ENET_FETCHER;
      creep.memory.mission = 'fortify';
    }

    if (creep.memory.behavior === ENET_FETCHER) {
      if (ENetFetcher.getTarget(creep.memory.mem) !== this.mem.eNodeFlag) {
        // Update fetch target
        setCreepBehavior(
            creep,
            ENET_FETCHER,
            ENetFetcher.initMemory(this.eNode!, 0),
        );
      }

      if (creep.store.getFreeCapacity() === 0 ||
          this.eNode.getStoredEnergy() === 0) {
        // Repair Wall
        setCreepBehavior(
            creep,
            REPAIRER,
            Repairer.initMemory(target, this.mem.wallHeight + REPAIR_BUFFER),
        );
        creep.memory.mission = 'fortify';
      }
    } else if (creep.memory.behavior === REPAIRER) {
      if ((Repairer.getTarget(creep.memory.mem) as StructureWall |
           StructureRampart)
              .id !== target.id) {
        // Update repair target
        creep.memory.mem =
            Repairer.initMemory(target, this.mem.wallHeight + REPAIR_BUFFER);
      }

      if (Repairer.getRepairRemaining(creep.memory.mem) <= 0) {
        // Finished repairing
        delete this.mem.targetIDs[target.id];
        const newTarget =
            Game.getObjectById(Object.keys(this.mem.targetIDs)[0]) as
                StructureWall |
            StructureRampart | null;
        if (newTarget) {
          // Update repair target
          creep.memory.mem = Repairer.initMemory(
              newTarget, this.mem.wallHeight + REPAIR_BUFFER);
        }
      }

      if (creep.store[RESOURCE_ENERGY] === 0) {
        // Fetch more energy
        setCreepBehavior(
            creep,
            ENET_FETCHER,
            ENetFetcher.initMemory(this.eNode, 1000),
        );
        creep.memory.mission = 'fortify';
      }
    }
  }

  /**
   * @override
   * Requests a creep if needed for this mission
   */
  public requestCreep(): boolean {
    // Only request a creep if we have a target to fortify
    if (this.targets.length > 0 && this.targets.find((struct) => {
          return struct.hits <
              (this.mem.wallHeight + REPAIR_BUFFER || struct.hitsMax);
        })) {
      const creep = Game.creeps[this.mem.creep || ''];
      if (creep) {
        return false;
      }

      // Request a new hauler creep
      const queue = global.spawnQueues[this.mem.room!];
      if (queue) {
        this.mem.creep = queue.requestCreep({
          bodyOptions: this.bodyOptions,
          bodyRatio: this.bodyType,
          mission: 'fortify',
          priority: this.spawnPriority,
        });
      }

      return true;
    }
    return false;
  }
}
