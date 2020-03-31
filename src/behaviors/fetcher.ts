import {Behavior, BehaviorMemory} from './behavior';
import {UnitWithStore} from './depositer';

interface FetcherMemory extends BehaviorMemory {
  targetID: Id<UnitWithStore|Ruin>;
  resource: ResourceConstant;
}

export const FETCHER = 'fetcher';

/**
 * Creep behavior class for a single creep to fetch energy from a target store.
 *
 * Takes a creep and a target (Anything with a .store). Handles moving the creep
 * towards the target and withdrawing from it.
 *
 * Low level behavior.
 *
 * TODO: Can be paramaretized to transfer different resources besides energy
 */
export class Fetcher extends Behavior<FetcherMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: FetcherMemory): boolean {
    const target = Game.getObjectById(mem.targetID);

    if (target) {
      if (!creep.pos.inRangeTo(target, 1)) {
        creep.moveTo(target);
        return true;
      }

      // We have arrived

      // Withdraw from target
      const amount =
          Math.min(creep.store.getFreeCapacity(), target.store[mem.resource]);
      if (amount > 0) {
        if (target instanceof Creep) {
          // You can't 'withdraw' from a creep
          target.transfer(creep, mem.resource, amount);
        } else {
          creep.withdraw(target, mem.resource, amount);
        }
        return false;
      }
    }
    return false;
  }

  public static initMemory(
      target: UnitWithStore|Ruin,
      resource: ResourceConstant = RESOURCE_ENERGY): FetcherMemory {
    return {
      resource,
      targetID: target.id,
    };
  }

  public static getTarget(mem: FetcherMemory): Id<UnitWithStore|Ruin>|null {
    if (!mem) {
      return null;
    }

    return mem.targetID;
  }
}
