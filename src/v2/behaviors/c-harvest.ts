import {BehaviorSettings} from '../types';

import {Behavior, getBehaviorMemory} from './behavior';

/**
 * Harvesting behavior which will transfer the resulting resources into
 * the specified container.
 */
export default class CHarvestBehavior extends Behavior {
  protected name = 'c-harvest';

  protected settings: BehaviorSettings = {
    timeout: Infinity,
    range: 1,
    blind: false,
  }

  /** Harvest from the source. Even if creep is full. */
  protected work(creep: Creep): number {
    let result: number = OK;
    const mem = getBehaviorMemory(creep);
    const target = Game.getObjectById(mem.target.id) as Source | null;
    const container =
        Game.getObjectById(mem.data.containerId as Id<StructureContainer>);
    if (target) {
      result = creep.harvest(target);

      const harvestAmount = creep.getActiveBodyparts(WORK) * HARVEST_POWER;
      if (container && creep.store.getFreeCapacity() < harvestAmount) {
        const amount =
            Math.min(container.store.getFreeCapacity(), creep.store.energy);
        if (amount > 0) {
          creep.transfer(container, RESOURCE_ENERGY, amount);
        }
      }

      return result;
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
