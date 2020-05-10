import {Behavior, getBehaviorMemory} from './behavior';
import {BehaviorSettings} from './types';

export default class DropMiningBehavior extends Behavior {
  protected name = 'dropMining';

  protected settings: BehaviorSettings = {
    timeout: Infinity,
    range: 1,
    blind: false,
  }

  /** Harvest from the source. Even if creep is full. */
  protected work(creep: Creep): number {
    const mem = getBehaviorMemory(creep);
    const target = Game.getObjectById(mem.target.id) as Source | null;
    if (target) {
      return creep.harvest(target);
    }
    return ERR_INVALID_TARGET;
  }

  /** Determines if the source is a valid target. */
  protected isValidTarget(creep: Creep): boolean {
    const mem = getBehaviorMemory(creep);
    const target = Game.getObjectById(mem.target.id) as Source | null;
    if (target && target.energy > 0) {
      return true;
    }
    return false;
  }

  /** Determines if the creep can perform this task. */
  protected isValidTask(creep: Creep): boolean {
    return (creep.getActiveBodyparts(WORK) > 0);
  }
}
