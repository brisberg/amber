interface HarvesterMemory {
  sourceID: Id<Source>;
  containerID: Id<StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>>;
}

/**
 * Creep behavior class for a single creep to harvest a single Energey Source
 *
 * Takes a creep and a source. Handles moving the creep towards the source,
 * harvesting it, and building and repairing a container under the creep.
 */
export class Harvester {
  private source: Source|null;
  private container: StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>|
      null;
  private readonly creep: Creep;
  private readonly mem: HarvesterMemory;
  // Maximum energy consumption of 'Build' action
  private readonly maxBuildCost: number;
  // Maximum hits repaired by a 'Repair' action
  private readonly maxRepair: number;

  constructor(creep: Creep) {
    this.mem = creep.memory as unknown as HarvesterMemory;
    this.creep = creep;
    this.maxBuildCost = this.creep.getActiveBodyparts(WORK) * BUILD_POWER;
    this.maxRepair = this.creep.getActiveBodyparts(WORK) * REPAIR_POWER;
    this.source = Game.getObjectById(this.mem.sourceID);
    this.container = Game.getObjectById(this.mem.containerID);
  }

  public setSource(source: Source) {
    this.source = source;
    this.mem.sourceID = source.id;
  }

  public setContainer(container: StructureContainer|
                      ConstructionSite<STRUCTURE_CONTAINER>) {
    this.container = container;
    this.mem.containerID = container.id;
  }

  public run() {
    if (!this.container) {
      console.log('Harvester not assigned a valid container');
      return;
    }

    if (this.source) {
      if (!this.creep.pos.inRangeTo(this.source, 1) &&
          this.creep.store.energy < 40) {
        this.creep.moveTo(this.source);
        return;
      }

      // We have arrived

      if (this.container instanceof ConstructionSite) {
        // Need to build the container
        if (this.creep.store.energy > this.maxBuildCost) {
          this.creep.build(this.container);
          return;
        }
      } else if (this.container instanceof StructureContainer) {
        // Repair container if it is low
        const hitsMissing = this.container.hitsMax - this.container.hits;
        if (hitsMissing > this.maxRepair &&
            this.creep.store.energy > this.maxRepair * REPAIR_COST) {
          this.creep.repair(this.container);
          return;
        }

        // Store creep energy in container if it has space
        if (this.creep.store.energy > 40 &&
            this.container.store.getFreeCapacity() > this.creep.store.energy) {
          const amount = Math.min(
              this.creep.store.energy, this.container.store.getFreeCapacity());
          if (!this.creep.pos.inRangeTo(this.container, 1)) {
            this.creep.moveTo(this.container);
            return;
          }
          this.creep.transfer(this.container, RESOURCE_ENERGY, amount);
        }
      }

      if (this.creep.store.getFreeCapacity() > 0) {
        if (!this.creep.pos.inRangeTo(this.source, 1)) {
          this.creep.moveTo(this.source);
          return;
        }
        this.creep.harvest(this.source);
      }
    }
  }
}
