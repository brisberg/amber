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
  private creep: Creep;
  private mem: HarvesterMemory;
  private maxBuildCost: number;  // Maximum energy consumption of 'Build' action
  private maxRepair: number;     // Maximum hits repaired by a 'Repair' action

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
    if (this.source) {
      if (!this.creep.pos.inRangeTo(this.source.pos, 1)) {
        this.creep.moveTo(this.source);
        return;
      }

      // We have arrived
      if (!this.container) {
        // Build a container (TODO: Claim an existing abbandoned container)
        // Add a construction site
        const sites = this.source.room.lookForAt(
            LOOK_CONSTRUCTION_SITES, this.creep.pos.x, this.creep.pos.y);
        if (sites.length > 0) {
          // Assumes any construction site at our feet must be container
          const site = sites[0] as ConstructionSite<STRUCTURE_CONTAINER>;
          this.setContainer(site);
        }

        // Or add a finished container
        const container =
            this.source.room
                .lookForAt(LOOK_STRUCTURES, this.creep.pos.x, this.creep.pos.y)
                .filter((lookup) => {
                  return lookup.structureType === STRUCTURE_CONTAINER;
                });
        if (container.length > 0) {
          this.setContainer(container[0] as StructureContainer);
        }

        if (!this.container) {
          this.source.room.createConstructionSite(
              this.creep.pos.x, this.creep.pos.y, STRUCTURE_CONTAINER);
        }
      }

      if (this.container) {
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
              this.container.store.getFreeCapacity() >
                  this.creep.store.energy) {
            const amount = Math.min(
                this.creep.store.energy,
                this.container.store.getFreeCapacity());
            this.creep.transfer(this.container, RESOURCE_ENERGY, amount);
          }
        }

        if (this.creep.store.getFreeCapacity() > 0) {
          this.creep.harvest(this.source);
        }
      }
    }
  }
}
