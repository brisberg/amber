/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {setCreepBehavior} from 'behaviors/behavior';
import {Depositer, DEPOSITER} from 'behaviors/depositer';
import {Fetcher, FETCHER} from 'behaviors/fetcher';
import {IDLER} from 'behaviors/idler';
import {GenerateCreepBodyOptions, HAULER} from 'spawn-system/bodyTypes';
import {declareOrphan} from 'spawn-system/orphans';

export interface CollectionMemory {
  room: string|null;
  resource: ResourceConstant;
  creep: string|null;
}

/**
 * Temporary Mission construct to facilitate collecting resources from ruins
 * into Storage.
 *
 * This mission will request a hauler creeps.
 *
 * @derecated Currently unsed. Specialized for season.
 */
export class CollectMission {
  protected readonly spawnPriority = 3;
  protected readonly bodyType = HAULER;
  // Hack: Limited size to save cost. Should be able to gather ~25k each
  protected readonly bodyOptions: GenerateCreepBodyOptions = {max: {carry: 10}};

  public dest: StructureStorage|null = null;

  constructor(private mem: CollectionMemory) {}

  /** @override */
  public init(): boolean {
    if (!this.mem.room || !Game.rooms[this.mem.room] ||
        !Game.rooms[this.mem.room].controller!.my) {
      console.log(
          `Collection Mission ${this.mem.room}: Does not own room. Retiring`);
      return false;
    }

    this.dest = Game.rooms[this.mem.room].storage || null;
    // this.ruins = this.mem.ruins.map((id) => Game.getObjectById(id))
    //                  .filter((ruin): ruin is Ruin => !!ruin);

    return true;
  }

  /** Executes one update tick for this mission */
  public run(): void {
    if (!this.dest || !this.mem.creep) {
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

    const RESOURCE = this.mem.resource;

    // Direct each creep to pick up or dropoff
    const creep = Game.creeps[this.mem.creep];
    if (!creep) return;

    const ruin = Game.rooms[this.mem.room!]
                     .find(FIND_RUINS)
                     .find((ruin) => ruin.store[RESOURCE] > 0);

    if (creep.memory.behavior === IDLER) {
      // Pickup newly spawned idle creeps
      creep.memory.behavior = FETCHER;
      creep.memory.mission = 'collect';
    }

    if (creep.memory.behavior === FETCHER) {
      if (ruin && Fetcher.getTarget(creep.memory.mem) !== ruin.id) {
        // Update fetch target
        setCreepBehavior(
            creep,
            FETCHER,
            Fetcher.initMemory(ruin, RESOURCE),
        );
      }

      if (creep.store.getUsedCapacity() !== 0) {
        // Have score, travel to destination
        setCreepBehavior(
            creep,
            DEPOSITER,
            Depositer.initMemory(this.dest, RESOURCE),
        );
        creep.memory.mission = 'collect';
      }
    } else if (creep.memory.behavior === DEPOSITER) {
      if (Depositer.getTarget(creep.memory.mem) !== this.dest.id) {
        // Update fetch target
        creep.memory.mem = Depositer.initMemory(this.dest, RESOURCE);
      }

      if (creep.store[RESOURCE_OXYGEN] === 0) {
        if ((creep.ticksToLive || 100) < 100) {
          // Decommission this hauler after it has delivered its payload
          console.log(
              'Collection ' + this.mem.room + ' decommissioning a hauler ' +
              creep.name);
          declareOrphan(creep);
          this.mem.creep = null;
        } else {
          if (!ruin) {
            return;
          }
          // Fetch more energy
          setCreepBehavior(
              creep,
              FETCHER,
              Fetcher.initMemory(ruin, RESOURCE),
          );
          creep.memory.mission = 'collect';
        }
      }

      // if (this.container.store[RESOURCE_SCORE] === 0 &&
      //     creep.store[RESOURCE_SCORE] === 0) {
      //   // Operation finished. Disolve
      //   declareOrphan(creep);
      // }
    }
  }

  /**
   * @override
   * Requests a creep if needed for this mission
   */
  public requestCreep(): boolean {
    const creep = Game.creeps[this.mem.creep || ''];
    if (creep) {
      return false;
    }

    // Request a new hauler creep
    const queue = global.spawnQueues[this.mem.room!];
    this.mem.creep = queue.requestCreep({
      bodyOptions: this.bodyOptions,
      bodyRatio: this.bodyType,
      mission: 'collect',
      priority: this.spawnPriority,
    });
    return true;
  }
}
