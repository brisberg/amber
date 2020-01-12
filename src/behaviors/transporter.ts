interface TransporterMemory {
  targetID: Id<StructureContainer|StructureSpawn>;
  withdraw: boolean;
}

export class Transporter {
  private target: StructureContainer|StructureSpawn|null;
  private creep: Creep;
  private mem: TransporterMemory;

  constructor(creep: Creep) {
    this.mem = creep.memory as unknown as TransporterMemory;
    this.creep = creep;
    this.target = Game.getObjectById(this.mem.targetID);
  }

  public run() {
    if (this.mem.withdraw) {
      if (this.target) {
        // Target must be a container
        const amount = Math.max(
            this.target.store.energy, this.creep.store.getFreeCapacity());
        if (this.creep.withdraw(this.target, RESOURCE_ENERGY, amount) ===
            ERR_NOT_IN_RANGE) {
          this.creep.moveTo(this.target);
        }
      }
    } else {
      if (this.target) {
        if (this.target instanceof StructureContainer) {
          const amount = Math.min(
              this.target.store.getFreeCapacity(), this.creep.store.energy);
          if (this.creep.transfer(this.target, RESOURCE_ENERGY, amount) ===
              ERR_NOT_IN_RANGE) {
            this.creep.moveTo(this.target);
          }
        } else if (this.target instanceof StructureSpawn) {
          const amount = Math.min(
              this.target.energyCapacity - this.target.energy,
              this.creep.store.energy);
          if (this.creep.transfer(this.target, RESOURCE_ENERGY, amount) ===
              ERR_NOT_IN_RANGE) {
            this.creep.moveTo(this.target);
          }
        }
      }
    }
  }
}
