interface MinerMemory {
  sourceID: Id<Source>;
}

/**
 * Creep behavior class for a single creep to harvest from a single Energy
 * Source and fuel a Spawn.
 *
 * Takes a creep. Handles moving the creep towards the source,
 * harvesting it, transporting the energy back to spawn.
 *
 * This role is mainly used to recovery from an emergency, or to bootstrap a new
 * colony/outpost.
 */
export class Miner {
  private source: Source|null;
  private creep: Creep;
  private mem: MinerMemory;

  constructor(creep: Creep) {
    this.mem = creep.memory as unknown as MinerMemory;
    this.creep = creep;
    this.source = Game.getObjectById(this.mem.sourceID);
  }

  public setSource(source: Source) {
    this.source = source;
    this.mem.sourceID = source.id;
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
