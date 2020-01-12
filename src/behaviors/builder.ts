import {EnergyNode} from 'energy-network/energyNode';
import {findMidPoint} from 'utils/midpoint';

interface BuilderMemory {
  role: string;
  targetSiteID: Id<ConstructionSite>;
  eNodeFlag?: string;
  destPos?: [number, number];
}

/**
 * Creep behavior class for a single creep to build a single structure.
 *
 * Takes a creep. Handles moving the creep towards the construction site,
 * and builds it.
 *
 * If an EnergyNode is provided, it will attempt to place itself between the
 * node and the site for easy energy pickup.
 */
export class Builder {
  private target: ConstructionSite|null;
  private creep: Creep;
  private mem: BuilderMemory;
  private eNode: EnergyNode|null = null;

  constructor(creep: Creep) {
    this.mem = creep.memory as unknown as BuilderMemory;
    this.creep = creep;
    this.target = Game.getObjectById(this.mem.targetSiteID);

    if (creep.memory.eNodeFlag) {
      this.eNode = new EnergyNode(Game.flags[creep.memory.eNodeFlag]);
    }
  }

  public run() {
    if (this.target) {
      if (!this.creep.memory.destPos) {
        if (this.eNode) {
          // We have a eNode, find a static position between it and the target
          if (!this.mem.destPos) {
            const midPoint =
                findMidPoint(this.eNode.flag.pos, 1, this.target.pos, 3);

            if (midPoint) {
              this.mem.destPos = [midPoint.x, midPoint.y];
            }
          }
        } else {
          // No eNode, meaning we are manually harvesting our energy. Just get
          // close.
          const path = this.creep.pos.findPathTo(
              this.target.pos.x, this.target.pos.y, {range: 3});
          if (path.length > 0) {
            const lastStep = path[path.length - 2];
            this.creep.memory.destPos = [lastStep.x, lastStep.y];
          }
        }
      }

      // Move us to the target destination
      if (this.creep.memory.destPos) {
        const destPos = this.creep.memory.destPos;
        if (!this.creep.pos.inRangeTo(destPos[0], destPos[1], 0)) {
          this.creep.moveTo(destPos[0], destPos[1]);
          return;
        }
      }

      // Build the target site
      if (this.creep.store.energy > 0) {
        if (this.creep.build(this.target) === ERR_NOT_IN_RANGE) {
          this.creep.moveTo(this.target);
        }
      }

      // If we have a node, attempt to refill from it
      if (this.eNode) {
        if (this.creep.store.energy < 20) {
          this.eNode.transferTo(this.creep);
        }
      }
    }
  }
}
