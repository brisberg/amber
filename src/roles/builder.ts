import {EnergyNode} from 'energy-network/energyNode';

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

  private calculateBoundingRect(pos1: RoomPosition, pos2: RoomPosition) {
    return {
      dx: Math.abs(pos1.x - pos2.x + 1),
      dy: Math.abs(pos1.y - pos2.y + 1),
      x: Math.min(pos1.x, pos2.x),
      y: Math.min(pos1.y, pos2.y),
    };
  }

  public run() {
    if (this.target) {
      if (!this.creep.memory.destPos) {
        if (this.eNode) {
          if (!this.mem.destPos) {
            // Determine the best location between the site and the sourceNode
            const path = this.eNode.flag.pos.findPathTo(this.target, {
              ignoreRoads: true,
              swampCost: 1,
            });
            for (const step of path) {
              const pos = this.creep.room.getPositionAt(step.x, step.y)!;
              if (pos.inRangeTo(this.target.pos.x, this.target.pos.y, 3) &&
                  pos.inRangeTo(
                      this.eNode.flag.pos.x, this.eNode.flag.pos.y, 1)) {
                this.mem.destPos = [pos.x, pos.y];
                break;
              }
            }
          }
        } else {
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
