import {Behavior, BehaviorMemory} from './behavior';

export type UnitWithStore =|StructureContainer|StructureStorage|StructureSpawn|
    StructureExtension|StructureLink|StructureTower|StructureTerminal|Creep;

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
  protected behaviorActions(creep: Creep, mem: DepositerMemory): boolean {
    const target = Game.getObjectById(mem.targetID);

    if (target) {
      if (!creep.pos.inRangeTo(target, 1)) {
        creep.moveTo(target, {
          costCallback: (roomname, costMatrix) => {
            // Hack for season instance to avoid a hostil room
            if (roomname === 'E7S28') {
              for (let i = 0; i < 50; i++) {
                // North exit is unwalkable
                costMatrix.set(i, 0, 255);
              }
            }

            return costMatrix;
          },
        });
        return true;
      }

      // We have arrived

      // Transfer to target
      let amount = creep.store[mem.resource];

      // Have to special case spawns and extensions for some reason
      // spawn.store.getFreeCapacity() always returns 0
      if (target instanceof StructureSpawn ||
          target instanceof StructureExtension ||
          target instanceof StructureTower || target instanceof StructureLink) {
        amount = Math.min(amount, target.energyCapacity - target.energy);
      } else {
        amount = Math.min(
            amount,
            target.store.getFreeCapacity(RESOURCE_ENERGY),
        );
      }

      if (amount > 0) {
        creep.transfer(target, mem.resource, amount);
        return false;
      }
      creep.transfer(target, mem.resource);
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
