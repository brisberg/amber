import {BehaviorSettings} from '../types';

import {Behavior, getBehaviorMemory} from './behavior';

export default class PickupBehavior extends Behavior {
  protected name = 'pickup';

  protected settings: BehaviorSettings = {
    timeout: Infinity,
    range: 1,
    blind: false,
  }

  /** Pickup resources from the target pile. */
  protected work(creep: Creep): number {
    const mem = getBehaviorMemory(creep);
    const target = Game.getObjectById(mem.target.id) as Resource | null;
    if (target) {
      return creep.pickup(target);
    }
    return ERR_INVALID_TARGET;
  }

  /** Valid if the resource pile exists. */
  protected isValidTarget(creep: Creep): boolean {
    const mem = getBehaviorMemory(creep);
    const target = Game.getObjectById(mem.target.id) as Resource | null;
    return !!target;
  }

  /** Creeps must have CARRY to pickup. */
  protected isValidTask(creep: Creep): boolean {
    return creep.getActiveBodyparts(CARRY) > 0;
  }
}
