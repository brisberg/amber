interface UpgraderMemory {
  role: string;
  controllerID: Id<StructureController>;
}

/**
 * Creep behavior class for a single creep to upgrade a single Room Controller.
 *
 * Takes a creep. Handles moving the creep towards the controller,
 * and builds it.
 */
export class Upgrader {
  private controller: StructureController|null;
  private creep: Creep;
  private mem: UpgraderMemory;

  constructor(creep: Creep) {
    this.mem = creep.memory as unknown as UpgraderMemory;
    this.creep = creep;
    this.controller = Game.getObjectById(this.mem.controllerID);
  }

  public run() {
    if (this.controller) {
      if (this.creep.store.energy > 0) {
        if (this.creep.upgradeController(this.controller) ===
            ERR_NOT_IN_RANGE) {
          this.creep.moveTo(this.controller);
        }
      }
    }
  }
}
