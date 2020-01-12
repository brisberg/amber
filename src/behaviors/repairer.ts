import {Behavior, BehaviorMemory} from './behavior';

interface RepairerMemory extends BehaviorMemory {
  structureID: Id<Structure<StructureConstant>>;
}

export const REPAIRER_KEY = 'repairer';

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
  protected behaviorActions(creep: Creep, mem: RepairerMemory) {
    const structure = Game.getObjectById(mem.structureID);

    if (structure) {
      if (!creep.pos.inRangeTo(structure, 3)) {
        creep.moveTo(structure);
        return true;
      }

      // We have arrived

      // Repair structure if it is low
      const hitsMissing = structure.hitsMax - structure.hits;
      if (hitsMissing > 0 && creep.store.energy > hitsMissing * REPAIR_COST) {
        creep.repair(structure);
        return false;
      }
    }
    return false;
  }

  public static initMemory(structure: Structure): RepairerMemory {
    return {
      structureID: structure.id,
    };
  }
}
