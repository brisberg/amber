import {Behavior, BehaviorMemory} from './behavior';

interface RangerMemory extends BehaviorMemory {
  targetID: Id<Structure|Creep>|string;
}

export const RANGER = 'ranger';

/**
 * Creep behavior class for a single creep to ranged a target.
 *
 * Takes a creep and a target construction site. Handles moving the creep
 * towards the target and building it.
 *
 * Low level behavior as it will not fetch more energy if the creep is out of
 * energy.
 */
export class Ranger extends Behavior<RangerMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: RangerMemory): boolean {
    const target = Game.getObjectById(mem.targetID) as Structure;
    const flag = Game.flags[mem.targetID];

    if (target) {
      creep.rangedAttack(target);

      if (!creep.pos.inRangeTo(target, 1)) {
        creep.moveTo(target);
        return true;
      }

      // We have arrived

      // Attack the target
      // creep.rangedAttack(target);
      return false;
    } else {
      creep.moveTo(flag);
    }
    return false;
  }

  public static initMemory(target: Structure|Creep|Flag): RangerMemory {
    if (target instanceof Flag) {
      return {
        targetID: target.name,
      };
    } else {
      return {
        targetID: target.id,
      };
    }
  }
}
