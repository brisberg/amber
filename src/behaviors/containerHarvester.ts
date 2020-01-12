import {behaviors} from 'behaviors';

import {Behavior, BehaviorMemory} from './behavior';
import {Depositer, DEPOSITER_KEY} from './depositer';
import {Harvester, HARVESTER_KEY} from './harvester';
import {Repairer, REPAIRER_KEY} from './repairer';

interface ContainerHarvesterMemory extends BehaviorMemory {
  sourceID: Id<Source>;
  containerID: Id<StructureContainer>;
}

export const CONTAINER_HARVESTER_KEY = 'cont-harvester';

/**
 * Creep behavior class for a single creep to harvest a single energy source
 * paired with a static Container for storage.
 *
 * Takes a creep, source, and container. Handles moving the creep towards the
 * source, harvesting it, and building and repairing a container under the
 * creep.
 */
export class ContainerHarvester extends Behavior<ContainerHarvesterMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: ContainerHarvesterMemory) {
    const maxRepair = creep.getActiveBodyparts(WORK) * REPAIR_POWER;
    const source = Game.getObjectById(mem.sourceID);
    const container = Game.getObjectById(mem.containerID);

    if (!container) {
      console.log('Container Harvester not assigned a valid container');
      return false;
    }

    if (!source) {
      console.log('Container Harvester not assigned a valid source');
      return false;
    }

    // Repair container if it is low
    const hitsMissing = container.hitsMax - container.hits;
    if (hitsMissing > maxRepair &&
        creep.store.energy > maxRepair * REPAIR_COST) {
      mem.subBehavior = REPAIRER_KEY;
      mem.mem = Repairer.initMemory(container);
      return false;
    }

    // Store creep energy in container if it has space
    if (creep.store.energy > 40 &&
        container.store.getFreeCapacity() > creep.store.energy) {
      // Invoke the sub-behavior directly as it may not be blocking
      if (behaviors[DEPOSITER_KEY].run(
              creep,
              Depositer.initMemory(container),
              )) {
        return true;
      }
      // No return as we can still harvest on the same tick
    }

    if (source) {
      mem.subBehavior = HARVESTER_KEY;
      mem.mem = Harvester.initMemory(source);
      return false;
    }

    return false;
  }
}
