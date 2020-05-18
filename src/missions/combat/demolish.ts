/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {setCreepBehavior} from 'behaviors/behavior';
import {DEMOLISHER, Demolisher} from 'behaviors/demolish';
import {GenerateCreepBodyOptions, WORKER} from 'spawn-system/bodyTypes';

import {Mission, MissionMemory} from '../mission';

interface DemolishMissionMemory extends MissionMemory {
  tarID: Id<Structure>|null;
  all: boolean;  // Should mission clear all structures
}

/**
 * Demolish Missions use worker creeps to dismantle friendly or hostile
 * structures in the target room.
 *
 * Use it to clear a recently conqured room, NPC stronghold, or salvage your own
 * room.
 *
 * This mission will coordinate requesting hauler creeps.
 */
export class DemolishMission extends Mission<DemolishMissionMemory> {
  protected readonly spawnPriority = 3;
  protected readonly bodyType = WORKER;
  protected readonly bodyOptions: GenerateCreepBodyOptions = {
    max: {
      work: 6,
    },
  };

  public structs: Structure[] = [];

  constructor(flag: Flag) {
    super(flag);
  }

  /** @override */
  protected initialMemory(): DemolishMissionMemory {
    return {
      creeps: [],
      tarID: null,
      all: false,
    };
  }

  /** @override */
  public init(): boolean {
    // Hacl
    if (!this.room) return true;

    if (this.mem.all) {
      // Find all structures in the room
      this.structs = this.room.find(FIND_HOSTILE_STRUCTURES);

      // Target InvaderCore
      const core = this.structs.find((struct) => {
        return struct.structureType === 'invaderCore';
      });
      if (core) {
        this.structs = [core];
      }

      if (this.structs.length === 0) {
        console.log(`Demolish Mission ${
            this.name} has no remaining structures to dismantle. Retiring`);
        return false;
      }

      return true;
    }

    if (this.mem.tarID) {
      if (Game.getObjectById(this.mem.tarID)) {
        this.structs = [Game.getObjectById(this.mem.tarID)!];
      } else {
        console.log(`Demolish Mission ${
            this.name}: Could not find Target Structure. Retiring`);
        return false;
      }
    }

    return false;
  }

  public setTarget(tar: Structure): void {
    this.mem.tarID = tar.id;
    this.structs = [tar];
  }

  public setAllFlag(all: boolean): void {
    this.mem.all = all;
  }

  /** Executes one update tick for this mission */
  public run(): void {
    if (this.structs.length === 0) {
      return;
    }

    const struct = this.structs[0];

    // Direct each creep to pick up or dropoff
    this.creeps.forEach((creep) => {
      if (creep.memory.behavior !== DEMOLISHER) {
        // Pickup newly spawned idle creeps
        creep.memory.mission = this.name;
        // Update demoplishss target
        setCreepBehavior(
            creep,
            DEMOLISHER,
            Demolisher.initMemory(this.room!.name, struct),
        );
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
