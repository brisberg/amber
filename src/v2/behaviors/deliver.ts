import {BehaviorSettings} from '../types';

import {Behavior, getBehaviorMemory} from './behavior';

// Union type for all storage structures
// TODO Fill this out, and move it to a central file
export type StorageStructure = StructureContainer|StructureSpawn;

export default class DeliverBehavior extends Behavior {
  protected name = 'deliver';

  protected settings: BehaviorSettings = {
    timeout: Infinity,
    range: 1,
    blind: false,
  }

  /** Transfer Energy to the target. */
  protected work(creep: Creep): number {
    const mem = getBehaviorMemory(creep);
    const target = Game.getObjectById(mem.target.id) as StorageStructure | null;
    if (target) {
      return creep.transfer(target, RESOURCE_ENERGY);
    }
    return ERR_INVALID_TARGET;
  }

  /** Valid if the construction site exists. */
  protected isValidTarget(creep: Creep): boolean {
    const mem = getBehaviorMemory(creep);
    const target = Game.getObjectById(mem.target.id) as StorageStructure | null;
    return !!target && !!target.store;
  }

  /** Creeps must have CARRY to transfer. */
  protected isValidTask(creep: Creep): boolean {
    return creep.getActiveBodyparts(CARRY) > 0;
  }
}
