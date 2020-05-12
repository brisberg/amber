import {Behavior, getBehaviorMemory} from './behavior';
import {BehaviorSettings} from './types';

/**
 * Behavior class for a fresh creep to replace their predecessor. Causes the
 * predecessor to suicide in place, and the new creep to take their place to
 * continue the task.
 */
export default class RelieveBehavior extends Behavior {
  protected name = 'relieve';

  protected settings: BehaviorSettings = {
    timeout: Infinity,
    range: 1,
    blind: false,
  }

  /** Cause target creep to suicide, and step into their place. */
  protected work(creep: Creep): number {
    if (creep.fatigue > 0) {
      return ERR_TIRED;
    }

    const mem = getBehaviorMemory(creep);
    const target = Game.getObjectById(mem.target.id) as Creep | null;
    if (target) {
      target.suicide();
      // creep.say('Relieved');
      // Necessary to save the position of a dying creep
      return creep.move(creep.pos.getDirectionTo(target));
    }
    return ERR_INVALID_TARGET;
  }

  /** Determines if the source is a valid target. */
  protected isValidTarget(creep: Creep): boolean {
    const mem = getBehaviorMemory(creep);
    const target = Game.getObjectById(mem.target.id) as Creep | null;
    return !!target;
  }

  /**
   * Creeps must be able to move to perform this task.
   */
  protected isValidTask(creep: Creep): boolean {
    return creep.getActiveBodyparts(MOVE) > 0;
  }
}
