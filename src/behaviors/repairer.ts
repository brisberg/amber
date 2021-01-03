import {Behavior, BehaviorMemory} from './behavior';

interface RepairerMemory extends BehaviorMemory {
  structureID: Id<Structure<StructureConstant>>;
  // Max hit point to repair up to (suitable for walls and ramparts)
  maxHits?: number;
}

export const REPAIRER = 'repairer';

/**
 * Creep behavior class for a single creep to repair a single structure.
 *
 * Takes a creep and a structure. Handles moving the creep towards the structure
 * and repairing it.
 *
 * Low level behavior as it will not fetch more energy if the creep is out of
 * energy.
 */
export class Repairer extends Behavior<RepairerMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: RepairerMemory): boolean {
    const structure = Game.getObjectById(mem.structureID);
    // RepairPower isn't necessary, as we should repair down to 0 energy.
    // const repairPower = creep.getActiveBodyparts(WORK) * REPAIR_POWER;

    if (structure) {
      if (!creep.pos.inRangeTo(structure, 3)) {
        creep.moveTo(structure);
        return true;
      }

      // We have arrived

      // Repair structure if it is low
      const hitsMissing = (mem.maxHits || structure.hitsMax) - structure.hits;
      // if (hitsMissing > 0 &&
      //     creep.store.energy >= (repairPower * REPAIR_COST)) {
      if (hitsMissing > 0 && creep.store.energy > 0) {
        creep.repair(structure);
        return false;
      }
    }
    return false;
  }

  public static getTarget(mem: RepairerMemory): Structure|null {
    return Game.getObjectById(mem.structureID);
  }

  public static getRepairRemaining(mem: RepairerMemory): number {
    const struct = Game.getObjectById(mem.structureID);
    if (!struct) {
      return 0;
    }

    return (mem.maxHits || struct.hitsMax) - struct.hits;
  }

  public static initMemory(structure: Structure, maxHits?: number):
      RepairerMemory {
    const mem: RepairerMemory = {
      structureID: structure.id,
      maxHits,
    };
    if (maxHits) {
      mem.maxHits = maxHits;
    }
    return mem;
  }
}
