import {BehaviorSettings} from '../types';

import {Behavior, getBehaviorMemory} from './behavior';

export default class BuildBehavior extends Behavior {
  protected name = 'build';

  protected settings: BehaviorSettings = {
    timeout: Infinity,
    range: 3,
    blind: false,
  }

  /** Build the target site if creep has energy. */
  protected work(creep: Creep): number {
    if (creep.store.energy === 0) {
      return ERR_NOT_ENOUGH_ENERGY;
    }

    const mem = getBehaviorMemory(creep);
    const target = Game.getObjectById(mem.target.id) as ConstructionSite | null;
    if (target) {
      return creep.build(target);
    }
    return ERR_INVALID_TARGET;
  }

  /** Valid if the construction site exists. */
  protected isValidTarget(creep: Creep): boolean {
    const mem = getBehaviorMemory(creep);
    return !!Game.getObjectById(mem.target.id);
  }

  /** Creeps must have WORK and CARRY to build. */
  protected isValidTask(creep: Creep): boolean {
    return (
        creep.getActiveBodyparts(WORK) > 0 &&
        creep.getActiveBodyparts(CARRY) > 0);
  }
}
