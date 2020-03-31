import {Behavior, BehaviorMemory} from './behavior';
import {Repairer, REPAIRER} from './repairer';
import {Upgrader, UPGRADER} from './upgrader';

interface ContainerUpgraderMemory extends BehaviorMemory {
  controllerID: Id<StructureController>;
  containerID: Id<StructureContainer>;
  destPos?: [number, number];
}

export const CONTAINER_UPGRADER = 'cont-upgrader';

/**
 * Creep behavior class for a single creep to upgrade a Room Controller from a
 * Container.
 *
 * Takes a creep, room controller, and a container. Handles moving the creep
 * between the container and the controller. Will gather energy from the Energy
 * Source and upgrade the controller.
 */
export class ContainerUpgrader extends Behavior<ContainerUpgraderMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: ContainerUpgraderMemory):
      boolean {
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
    if (!mem.destPos) {
      // We have a source, find a static position around it near the target
      // console.log(
      //     creep.name + ' is looking for a new SourceBuild dest location');
      for (let i: number = container.pos.x - 1; i <= container.pos.x + 1; i++) {
        for (let j: number = container.pos.y - 1; j <= container.pos.y + 1;
             j++) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const pos = creep.room.getPositionAt(i, j)!;
          if (pos.lookFor(LOOK_TERRAIN)[0] !== 'wall') {
            const occupied =
                creep.room.lookForAt(LOOK_CREEPS, pos.x, pos.y).length > 0;
            if (!occupied) {
              mem.destPos = [pos.x, pos.y];
            }
          }
        }
      }
    }

    if (mem.destPos) {
      const creeps =
          creep.room.lookForAt(LOOK_CREEPS, mem.destPos[0], mem.destPos[1]);
      if (creeps.length > 0 && creeps[0].id !== creep.id) {
        // Someone else took our spot, forget it
        delete mem.destPos;
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
      if (creep.store.energy < 20 && container.store.energy > 0) {
        const amount = Math.min(
            creep.store.getFreeCapacity(),
            container.store.energy,
        );
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

      // Upgrade the controller
      if (creep.store.energy > 0) {
        mem.subBehavior = UPGRADER;
        mem.mem = Upgrader.initMemory(controller);
        return false;
      }
    }

    return false;
  }

  public static initMemory(
      controller: StructureController,
      container: StructureContainer): ContainerUpgraderMemory {
    return {
      containerID: container.id,
      controllerID: controller.id,
    };
  }
}
