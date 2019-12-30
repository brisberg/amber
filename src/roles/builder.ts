interface BuilderMemory {
  sourceId: Id<Source>;
}

export class Builder {
  private source: Source|null;
  private creep: Creep;
  private mem: BuilderMemory;

  constructor(creep: Creep) {
    this.mem = creep.memory as unknown as BuilderMemory;
    this.creep = creep;
    this.source = Game.getObjectById(this.mem.sourceId);
  }

  public run() {
    return;
  }
}
