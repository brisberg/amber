import {setCreepBehavior} from 'behaviors/behavior';
import {DEPOSITER, Depositer} from 'behaviors/Depositer';
import {FETCHER, Fetcher} from 'behaviors/fetcher';
import {IDLER} from 'behaviors/idler';
import {GenerateCreepBodyOptions, HAULER} from 'spawn-system/bodyTypes';
import {declareOrphan} from 'spawn-system/orphans';

import {Mission, MissionMemory} from './mission';

interface RaidMissionMemory extends MissionMemory {
  destID: Id<StructureStorage>|null;
}

/**
 * Raid Missions use Hauler creeps to transport resources from Ruins (either
 * friendly or hostile).
 *
 * Use it to clear a recently conqured room, NPC stronghold, or salvage your own
 * room.
 *
 * This mission will coordinate requesting hauler creeps.
 */
export class RaidMission extends Mission<RaidMissionMemory> {
  protected readonly spawnPriority = 3;
  protected readonly bodyType = HAULER;
  protected readonly bodyOptions: GenerateCreepBodyOptions = {};

  public dest: StructureStorage|null = null;
  public ruins: Ruin[] = [];

  constructor(flag: Flag) {
    super(flag);
  }

  /** @override */
  protected initialMemory(): RaidMissionMemory {
    return {
      creeps: [],
      destID: null,
    };
  }

  /** @override */
  public init(): boolean {
    if (!this.mem.destID || !Game.getObjectById(this.mem.destID)) {
      const storage = this.room!.storage;
      if (storage) {
        this.dest = storage;
        this.mem.destID = storage.id;
      } else {
        console.log(
            `Raid Mission ${this.name}: Could not find Dest Storage. Retiring`);
        return false;
      }
    }

    this.dest = Game.getObjectById(this.mem.destID);

    // Find all ruins in the room with resources
    this.ruins = this.room!.find(FIND_RUINS).filter((ruin) => {
      return ruin.store.getUsedCapacity() > 0;
    });

    if (this.ruins.length === 0) {
      console.log(
          `Raid Mission ${this.name} has no remaining ruins to loot. Retiring`);
      return false;
    }

    return true;
  }

  public setDestination(dest: StructureStorage) {
    this.mem.destID = dest.id;
    this.dest = dest;
  }

  /** Executes one update tick for this mission */
  public run() {
    if (!this.dest || this.ruins.length === 0) {
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

    const ruin = this.ruins[0];

    // Direct each creep to pick up or dropoff
    this.creeps.forEach((creep) => {
      if (creep.memory.behavior === IDLER) {
        // Pickup newly spawned idle creeps
        creep.memory.behavior = FETCHER;
        creep.memory.mission = this.name;
      }

      if (creep.memory.behavior === FETCHER) {
        if (Fetcher.getTarget(creep.memory.mem) !== ruin.id) {
          // Update fetch target
          setCreepBehavior(
              creep,
              FETCHER,
              Fetcher.initMemory(ruin, RESOURCE_OXYGEN),  // Hack Oxygen
          );
        }

        if (creep.store.getFreeCapacity() === 0) {
          // Have energy, travel to destination
          setCreepBehavior(
              creep,
              DEPOSITER,
              Depositer.initMemory(this.dest!, RESOURCE_OXYGEN),
          );
          creep.memory.mission = this.name;
        }
      } else if (creep.memory.behavior === DEPOSITER) {
        if (Depositer.getTarget(creep.memory.mem) !== this.dest!.id) {
          // Update fetch target
          creep.memory.mem = Depositer.initMemory(this.dest!, RESOURCE_OXYGEN);
        }

        if (creep.store.getUsedCapacity() === 0) {
          if ((creep.ticksToLive || 100) < 100) {
            // Decommission this hauler after it has delivered its payload
            console.log(
                'Raid ' + this.name + ' decommissioning a hauler ' +
                creep.name);
            declareOrphan(creep);
            this.mem.creeps =
                this.mem.creeps.filter((name) => name !== creep.name);
          } else {
            // Fetch more energy
            setCreepBehavior(
                creep,
                FETCHER,
                Fetcher.initMemory(ruin, RESOURCE_OXYGEN),
            );
            creep.memory.mission = this.name;
          }
        }
      }
    });
  }

  /**
   * @override
   * Returns true if we need another Hauler.
   *
   * Hardcoded to two Haulers
   */
  protected needMoreCreeps(): boolean {
    const creeps = this.getYoungCreeps();
    if (creeps.length >= 2) {
      return false;
    }

    return true;
  }

  /** @override */
  /** Mission not Critical */
  protected needMoreCreepsCritical(): boolean {
    return false;
  }
}
