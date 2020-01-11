import {EnergyNode} from 'energy-network/energyNode';

interface UpgraderMemory {
  role: string;
  controllerID: Id<StructureController>;
  eNodeFlag: string;
  destPos?: [number, number];
}

/**
 * Creep behavior class for a single creep to upgrade a single Room Controller.
 *
 * Takes a creep. Handles moving the creep towards the controller,
 * and builds it.
 */
export class Upgrader {
  private controller: StructureController|null;
  private creep: Creep;
  private mem: UpgraderMemory;
  private sourceNode: EnergyNode|null = null;

  constructor(creep: Creep) {
    this.mem = creep.memory as unknown as UpgraderMemory;
    this.creep = creep;
    this.controller = Game.getObjectById(this.mem.controllerID);

    if (creep.memory.eNodeFlag) {
      this.sourceNode = new EnergyNode(Game.flags[creep.memory.eNodeFlag]);
    }
  }

  public run() {
    if (this.controller && this.sourceNode) {
      if (!this.mem.destPos) {
        // Determine the best location between the controller and the sourceNode
        const path = this.sourceNode.flag.pos.findPathTo(this.controller, {
          ignoreRoads: true,
          swampCost: 1,
        });
        for (const step of path) {
          const pos = this.creep.room.getPositionAt(step.x, step.y)!;
          if (pos.inRangeTo(this.controller.pos.x, this.controller.pos.y, 3) &&
              pos.inRangeTo(
                  this.sourceNode.flag.pos.x, this.sourceNode.flag.pos.y, 1)) {
            this.mem.destPos = [pos.x, pos.y];
            break;
          }
        }
      }

      // Move us to the target destination
      if (this.creep.memory.destPos) {
        const destPos = this.creep.memory.destPos;
        if (!this.creep.pos.inRangeTo(destPos[0], destPos[1], 0)) {
          if (this.creep.room.lookForAt(LOOK_CREEPS, destPos[0], destPos[1])) {
            // Someone else is in our desired position, forget it and look for
            // a new target
            delete this.mem.destPos;
            return;
          }
          this.creep.moveTo(destPos[0], destPos[1]);
          return;
        }
      }

      // Build the target site
      if (this.creep.store.energy > 0) {
        if (this.creep.upgradeController(this.controller) ===
            ERR_NOT_IN_RANGE) {
          this.creep.moveTo(this.controller);
        }
      }

      // If we have a node, attempt to refill from it
      if (this.sourceNode) {
        if (this.creep.store.energy < 20) {
          this.sourceNode.transferTo(this.creep);
        }
      }
    }
  }
}
