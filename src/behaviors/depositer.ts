import {Behavior, BehaviorMemory} from './behavior';

export type UnitWithStore =
    StructureContainer|StructureSpawn|StructureExtension|StructureLink|Creep;

interface DepositerMemory extends BehaviorMemory {
  targetID: Id<UnitWithStore>;
}

export const DEPOSITER_KEY = 'depositer';

/**
 * Creep behavior class for a single creep to deposit energy in a target store.
 *
 * Takes a creep and a target (Anything with a .store). Handles moving the creep
 * towards the target and transfering it.
 *
 * Low level behavior as it will not fetch more energy if the creep is out of
 * energy.
 *
 * TODO: Can be paramaretized to transfer different resources besides energy
 */
export class Depositer extends Behavior<DepositerMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: DepositerMemory) {
    const target = Game.getObjectById(mem.targetID);

    if (target) {
      if (!creep.pos.inRangeTo(target, 1)) {
        creep.moveTo(target);
        return true;
      }

      // We have arrived

      // Transfer to target
      const amount =
          Math.min(creep.store.energy, target.store.getFreeCapacity());
      if (amount > 0) {
        creep.transfer(target, RESOURCE_ENERGY, amount);
        return false;
      }
    }
    return false;
  }

  public static initMemory(target: UnitWithStore): DepositerMemory {
    return {
      targetID: target.id,
    };
  }
}
