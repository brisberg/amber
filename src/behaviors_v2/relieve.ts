import {Behavior, getBehaviorMemory} from './behavior';
import {BehaviorSettings} from './types';

export default class RelieveBehavior extends Behavior {
  protected name = 'relieve';

  protected settings: BehaviorSettings = {
    timeout: Infinity,
    range: 1,
    blind: false,
  }

  /** Cause target creep to suicide, and step into their place. */
  protected work(creep: Creep): number {
    const mem = getBehaviorMemory(creep);
    const target = Game.getObjectById(mem.target.id) as Creep | null;
    if (target) {
      target.suicide();
      creep.say('Relieved');
      return creep.moveTo(target);
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
   *
   * Determines if the creep can perform this task.
   * Always true, as the task will end when the target doesn't exist
   */
  protected isValidTask(): boolean {
    return true;
  }
}
