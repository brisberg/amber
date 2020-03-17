import {Behavior, BehaviorMemory} from './behavior';

export type UnitWithStore =|StructureContainer|StructureStorage|StructureSpawn|
    StructureExtension|StructureLink|StructureTower|Creep;

interface DepositerMemory extends BehaviorMemory {
  resource: ResourceConstant;
  targetID: Id<UnitWithStore>;
}

export const DEPOSITER = 'depositer';

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
      let amount = creep.store[mem.resource];

      // Have to special case spawns and extensions for some reason
      // spawn.store.getFreeCapacity() always returns 0
      if (target instanceof StructureSpawn ||
          target instanceof StructureExtension ||
          target instanceof StructureTower) {
        amount = Math.min(amount, target.energyCapacity - target.energy);
      } else {
        amount = Math.min(amount, target.store.getFreeCapacity());
      }

      if (amount > 0) {
        creep.transfer(target, mem.resource, amount);
        return false;
      }
    }
    return false;
  }

  public static initMemory(
      target: UnitWithStore,
      resource: ResourceConstant = RESOURCE_ENERGY): DepositerMemory {
    return {resource, targetID: target.id};
  }

  public static getTarget(mem: DepositerMemory): Id<UnitWithStore>|null {
    if (!mem) {
      return null;
    }

    return mem.targetID;
  }
}
