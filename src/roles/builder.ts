interface BuilderMemory {
  role: string;
  targetSiteID: Id<ConstructionSite>;
}

/**
 * Creep behavior class for a single creep to build a single structure.
 *
 * Takes a creep. Handles moving the creep towards the construction site,
 * and builds it.
 */
export class Builder {
  private target: ConstructionSite|null;
  private creep: Creep;
  private mem: BuilderMemory;

  constructor(creep: Creep) {
    this.mem = creep.memory as unknown as BuilderMemory;
    this.creep = creep;
    this.target = Game.getObjectById(this.mem.targetSiteID);
  }

  public run() {
    if (this.target) {
      if (this.creep.store.energy > 0) {
        if (this.creep.build(this.target) === ERR_NOT_IN_RANGE) {
          this.creep.moveTo(this.target);
        }
      }
    }
  }
}
