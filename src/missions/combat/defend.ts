/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {setCreepBehavior} from 'behaviors/behavior';
import {Ranger, RANGER} from 'behaviors/range';
import {GenerateCreepBodyOptions, RANGED} from 'spawn-system/bodyTypes';

import {Mission, MissionMemory} from '../mission';

interface DefendMissionMemory extends MissionMemory {
  tarID: Id<Structure|Creep>|null;
  all: boolean;  // Should mission clear all structures
}

/**
 * Defend Missions use fighter creeps to attack a hostile creeps in controlled
 * rooms.
 *
 * This mission will coordinate requesting fighter creeps.
 */
export class DefendMission extends Mission<DefendMissionMemory> {
  protected readonly spawnPriority = 3;
  protected readonly bodyType = RANGED;
  protected readonly bodyOptions: GenerateCreepBodyOptions = {
    max: {
      range: 10,
    },
  };

  public targets: Array<Structure|Creep> = [];

  constructor(flag: Flag) {
    super(flag);
  }

  /** @override */
  protected initialMemory(): DefendMissionMemory {
    return {
      creeps: [],
      tarID: null,
      all: false,
    };
  }

  /** @override */
  public init(): boolean {
    // Hack
    this.mem.all = true;
    this.mem.spawnSource = 'E4S28';

    if (!this.room) return true;

    if (this.mem.all) {
      // Find all structures in the room
      this.targets = this.room.find(FIND_HOSTILE_STRUCTURES);
      this.targets.concat(this.room.find(FIND_HOSTILE_CREEPS));

      // Target InvaderCore
      const core = this.targets.find((target) => {
        return target instanceof Structure &&
            target.structureType === 'invaderCore';
      });
      if (core) {
        this.targets = [core];
      }

      // Hack to only break InvaderCores
      // this.targets = this.targets.filter((target: Structure|Creep) => {
      //   return target instanceof Structure &&
      //       target.structureType === 'invaderCore';
      // });

      // if (this.targets.length === 0) {
      //   console.log(`Attack Mission ${
      //       this.name} has no remaining targets to attack. Retiring`);
      //   return false;
      // }

      return true;
    }

    if (this.mem.tarID) {
      if (Game.getObjectById(this.mem.tarID)) {
        this.targets = [Game.getObjectById(this.mem.tarID)!];
      } else {
        console.log(
            `Attack Mission ${this.name}: Could not find Target. Retiring`);
        return false;
      }
    }

    return false;
  }

  public setTarget(tar: Structure): void {
    this.mem.tarID = tar.id;
    this.targets = [tar];
  }

  public setAllFlag(all: boolean): void {
    this.mem.all = all;
  }

  /** Executes one update tick for this mission */
  public run(): void {
    this.mem.all = true;  // Hack

    const struct = this.targets[0];

    // Direct each creep to pick up or dropoff
    this.creeps.forEach((creep) => {
      if (creep.memory.behavior !== RANGER) {
        // Pickup newly spawned idle creeps
        creep.memory.mission = this.name;
        if (!struct) {
          // Update demoplishss target
          setCreepBehavior(
              creep,
              RANGER,
              Ranger.initMemory(this.flag),
          );
        } else {
          // Update demoplishss target
          setCreepBehavior(
              creep,
              RANGER,
              Ranger.initMemory(struct),
          );
        }
      }
    });
  }

  /**
   * @override
   * Returns true if we need another Worker.
   *
   * Hardcoded to 1 Worker
   */
  protected needMoreCreeps(): boolean {
    const creeps = this.getYoungCreeps();
    if (creeps.length >= 1) {
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
