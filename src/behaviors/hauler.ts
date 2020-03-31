import {EnergyNode} from 'energy-network/energyNode';

interface HaulerMemory {
  phase: 'deliver'|'fetch';
  energyNode: string;
  mission: string;  // Name of our parent mission so we can identify coworkers
}

export class Hauler {
  private energyNode: EnergyNode;
  private creep: Creep;
  private mem: HaulerMemory;

  constructor(creep: Creep) {
    this.mem = creep.memory as unknown as HaulerMemory;
    this.creep = creep;
    this.energyNode = new EnergyNode(Game.flags[this.mem.energyNode]);
  }

  public run(): void {
    const tarX = this.energyNode.flag.pos.x;
    const tarY = this.energyNode.flag.pos.y;

    if (this.energyNode.isOccupied()) {
      // Stay back from occupied nodes
      if (!this.creep.pos.inRangeTo(tarX, tarY, 3)) {
        this.creep.moveTo(tarX, tarY);
        return;
      }
    } else {
      // Actually move into Creep nodes
      const range = this.energyNode.mem.type === 'creep' ? 0 : 1;
      if (!this.creep.pos.inRangeTo(tarX, tarY, range)) {
        this.creep.moveTo(tarX, tarY);
        return;
      }
    }

    if (this.energyNode) {
      if (this.mem.phase === 'fetch') {
        this.energyNode.transferTo(this.creep);
        return;
      } else if (this.energyNode.mem.type !== 'creep') {
        // Hack a bit so we remain stationary when the 'creep' at a Creep Node
        this.energyNode.transferFrom(this.creep);
      }
    }
  }
}
