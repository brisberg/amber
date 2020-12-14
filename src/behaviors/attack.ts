import {Behavior, BehaviorMemory} from './behavior';

interface AttackerMemory extends BehaviorMemory {
  targetID: Id<Structure|Creep>|string;
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
    const target = Game.getObjectById(mem.targetID) as Structure;
    const flag = Game.flags[mem.targetID];

    if (target) {
      creep.attack(target);

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

  public static initMemory(target: Structure|Creep|Flag): AttackerMemory {
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
