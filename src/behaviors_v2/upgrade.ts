import {Behavior, getBehaviorMemory} from './behavior';
import {BehaviorSettings} from './types';

export default class UpgradeBehavior extends Behavior {
  protected name = 'upgrade';

  protected settings: BehaviorSettings = {
    timeout: Infinity,
    range: 3,
    blind: false,
  }

  /** Upgrade the controller if creep has energy. */
  protected work(creep: Creep): number {
    if (creep.store.energy === 0) {
      return ERR_NOT_ENOUGH_ENERGY;
    }

    const mem = getBehaviorMemory(creep);
    const target =
        Game.getObjectById(mem.target.id) as StructureController | null;
    if (target) {
      return creep.upgradeController(target);
    }
    return ERR_INVALID_TARGET;
  }

  /** Valid if the Controller is owned by the player and not blocked. */
  protected isValidTarget(creep: Creep): boolean {
    const mem = getBehaviorMemory(creep);
    const target =
        Game.getObjectById(mem.target.id) as StructureController | null;
    return this.isUpgradable(target);
  }

  private isUpgradable(cont: StructureController|null): boolean {
    return !!cont && cont.my && (cont.upgradeBlocked || 0) <= 0;
  }

  /** Creeps must have WORK and CARRY to build. */
  protected isValidTask(creep: Creep): boolean {
    return (
        creep.getActiveBodyparts(WORK) > 0 &&
        creep.getActiveBodyparts(CARRY) > 0);
  }
}
