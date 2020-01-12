import {EnergyNode} from 'energy-network/energyNode';
import {findMidPoint} from '../utils/midpoint';

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
        const midPoint =
            findMidPoint(this.sourceNode.flag.pos, 1, this.controller.pos, 3);

        if (midPoint) {
          this.mem.destPos = [midPoint.x, midPoint.y];
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
