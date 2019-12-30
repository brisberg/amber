interface TransporterMemory {
  sourceId: Id<Source>;
}

export class Transporter {
  private source: Source|null;
  private creep: Creep;
  private mem: TransporterMemory;

  constructor(creep: Creep) {
    this.mem = creep.memory as unknown as TransporterMemory;
    this.creep = creep;
    this.source = Game.getObjectById(this.mem.sourceId);
  }

  public run() {
    return;
  }
}
