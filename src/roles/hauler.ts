import {EnergyNode} from 'energy-network/energyNode';

interface HaulerMemory {
  phase: 'deliver'|'fetch';
  energyNode: EnergyNode;
}

export class Hauler {
  private energyNode: EnergyNode;
  private creep: Creep;
  private mem: HaulerMemory;

  constructor(creep: Creep) {
    this.mem = creep.memory as unknown as HaulerMemory;
    this.creep = creep;
    this.energyNode = this.mem.energyNode;
  }

  public run() {
    const tarX = this.energyNode.pos[0];
    const tarY = this.energyNode.pos[1];
    if (!this.creep.pos.inRangeTo(tarX, tarY, 1)) {
      this.creep.moveTo(tarX, tarY);
      return;
    }

    // HACK Assuming node is a container for now
    const structs = this.creep.room.lookForAt(LOOK_STRUCTURES, tarX, tarY);
    const container = structs.find(
                          (struct) => struct.structureType ===
                              STRUCTURE_CONTAINER) as StructureContainer |
        undefined;

    if (container) {
      if (this.mem.phase === 'fetch') {
        const amount = Math.min(
            container.store.energy, this.creep.store.getFreeCapacity());
        this.creep.withdraw(container, RESOURCE_ENERGY, amount);
        return;
      } else {
        const amount = Math.min(
            container.store.getFreeCapacity(), this.creep.store.energy);
        this.creep.transfer(container, RESOURCE_ENERGY, amount);
      }
    }
  }
}
