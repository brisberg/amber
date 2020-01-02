interface MinerMemory {
  sourceId: Id<Source>;
}

export class Miner {
  private source: Source|null;
  private creep: Creep;
  private mem: MinerMemory;

  constructor(creep: Creep) {
    this.mem = creep.memory as unknown as MinerMemory;
    this.creep = creep;
    this.source = Game.getObjectById(this.mem.sourceId);
  }

  public setSource(source: Source) {
    this.source = source;
    this.mem.sourceId = source.id;
  }

  public run() {
    if (this.source) {
      if (this.creep.store.getFreeCapacity() > 0) {
        if (this.creep.harvest(this.source) === ERR_NOT_IN_RANGE) {
          this.creep.moveTo(this.source);
        }
      } else {
        const spawn = Game.spawns.Spawn1;
        if (spawn.energy < spawn.energyCapacity) {
          const amount = Math.min(
              this.creep.store.energy, spawn.energyCapacity - spawn.energy);
          if (this.creep.transfer(spawn, RESOURCE_ENERGY, amount) ===
              ERR_NOT_IN_RANGE) {
            this.creep.moveTo(spawn);
          }
        }
      }
    }
  }
}
