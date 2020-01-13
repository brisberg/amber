import {findMidPoint} from 'utils/midpoint';

import {Behavior, BehaviorMemory} from './behavior';
import {Repairer, REPAIRER} from './repairer';

interface UpgraderMemory extends BehaviorMemory {
  controllerID: Id<StructureController>;
  containerID: Id<StructureContainer>;
  destPos?: [number, number];
}

export const UPGRADER = 'upgrader';

/**
 * Creep behavior class for a single creep to upgrade a Room Controller from a
 * Container.
 *
 * Takes a creep, room controller, and a container. Handles moving the creep
 * between the container and the controller. Will gather energy from the Energy
 * Source and upgrade the controller.
 */
export class Upgrader extends Behavior<UpgraderMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: UpgraderMemory) {
    const maxRepair = creep.getActiveBodyparts(WORK) * REPAIR_POWER;
    const controller = Game.getObjectById(mem.controllerID);
    const container = Game.getObjectById(mem.containerID);

    if (!container) {
      console.log('Upgrader not assigned a valid Container');
      return false;
    }

    if (!controller) {
      console.log('Upgrader not assigned a valid Room Controller');
      return false;
    }

    // We don't have a destination position or our current one is occupied
    if (!mem.destPos ||
        creep.room.lookForAt(LOOK_CREEPS, mem.destPos[0], mem.destPos[1])
                .length > 0) {
      // We have a eNode, find a static position between it and the target
      if (!mem.destPos) {
        const midPoint = findMidPoint(container.pos, 1, controller.pos, 3, {
          ignoreCreeps: false,
        });

        if (!midPoint) {
          // Throw error? There is no midpoint position between the eNode and
          // the target site
          return false;
        }

        mem.destPos = [midPoint.x, midPoint.y];
      }
    }

    // Move us to the target destination
    if (mem.destPos) {
      const destPos = mem.destPos;
      if (!creep.pos.inRangeTo(destPos[0], destPos[1], 0)) {
        creep.moveTo(destPos[0], destPos[1]);
        return true;
      }

      // Attempt to refill from energy source
      if (creep.store.energy < 20) {
        const amount =
            Math.min(creep.store.getFreeCapacity(), container.store.energy);
        creep.withdraw(container, RESOURCE_ENERGY, amount);
      }

      // Repair container if it is low
      const hitsMissing = container.hitsMax - container.hits;
      if (hitsMissing > maxRepair &&
          creep.store.energy > maxRepair * REPAIR_COST) {
        mem.subBehavior = REPAIRER;
        mem.mem = Repairer.initMemory(container);
        return false;
      }

      // Build the target site
      if (creep.store.energy > 0) {
        creep.upgradeController(controller);
        return false;
      }
    }

    return false;
  }

  public static initMemory(
      controller: StructureController,
      container: StructureContainer): UpgraderMemory {
    return {
      containerID: container.id,
      controllerID: controller.id,
    };
  }
}
