interface FetcherMemory {
  role: string;
  containerID: Id<StructureContainer>;
}

/**
 * Creep behavior class for a single creep to draw energy from a container.
 *
 * Takes a creep. Handles moving the creep towards the container and drawing
 * from it.
 */
export class Fetcher {
  private container: StructureContainer|null;
  private creep: Creep;
  private mem: FetcherMemory;

  constructor(creep: Creep) {
    this.mem = creep.memory as unknown as FetcherMemory;
    this.creep = creep;
    this.container = Game.getObjectById(this.mem.containerID);
  }

  public run() {
    if (this.container) {
      if (this.creep.store.getFreeCapacity() > 0) {
        if (this.creep.withdraw(this.container, RESOURCE_ENERGY) ===
            ERR_NOT_IN_RANGE) {
          this.creep.moveTo(this.container);
        }
      }
    }
  }
}
