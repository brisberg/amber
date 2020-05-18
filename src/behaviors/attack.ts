import {Behavior, BehaviorMemory} from './behavior';

interface AttackerMemory extends BehaviorMemory {
  targetID: Id<Structure|Creep>;
}

export const ATTACKER = 'attack';

/**
 * Creep behavior class for a single creep to attack a target.
 *
 * Takes a creep and a target construction site. Handles moving the creep
 * towards the target and building it.
 *
 * Low level behavior as it will not fetch more energy if the creep is out of
 * energy.
 */
export class Attacker extends Behavior<AttackerMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: AttackerMemory): boolean {
    const target = Game.getObjectById(mem.targetID);

    if (target) {
      if (!creep.pos.inRangeTo(target, 1)) {
        creep.moveTo(target, {
          swampCost: 1,  // SwampCost Hack to avoid stronghold
        });
        return true;
      }

      // We have arrived

      // Attack the target
      creep.attack(target);
      return false;
    }
    return false;
  }

  public static initMemory(target: Structure|Creep): AttackerMemory {
    return {
      targetID: target.id,
    };
  }
}
