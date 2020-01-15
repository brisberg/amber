import {registerEnergyNode} from 'energy-network/energyNode';
import {HARVEST_SOURCE_FLAG_COLOR} from 'flagConstants';

import {HarvestingMission} from '../missions/harvesting';

import {analyzeSourceForHarvesting, SourceAnalysis} from './sourceAnalysis';

/**
 * Mining Operation
 *
 * This Operation will facilitate all of the sub operations required to set up a
 * harvesting operation.
 *
 * It will perform Source Analysis on a given source node, designate where the
 * Container should be placed. Once the container is build it will start a new
 * Harvest mission on the node.
 *
 * This operation will replace the container ConstructionSite if it is removed
 * or destroyed, but it depends on an existing BuildOperation to complete it.
 */

export interface MiningOperationMemory {
  analysis: SourceAnalysis|null;
  harvestMission: string|null;
  sourceID: Id<Source>;
  containerID: Id<StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>>|
      null;
  eNodeFlag: string|null;
}

export class MiningOperation {
  private readonly name: string;
  private readonly room: Room;
  private readonly source: Source;
  private readonly mem: MiningOperationMemory;

  private container: StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>|
      null = null;

  constructor(name: string, source: Source) {
    this.name = name;
    this.room = source.room;
    this.source = source;

    // Init memory
    if (!Memory.operations[name]) {
      const mem: MiningOperationMemory = {
        analysis: null,
        containerID: null,
        eNodeFlag: null,
        harvestMission: null,
        sourceID: source.id,
      };
      Memory.operations[name] = mem;
    }
    this.mem = Memory.operations[name] as MiningOperationMemory;

    if (this.mem.containerID) {
      this.container = Game.getObjectById(this.mem.containerID);
    }
  }

  public run() {
    // Run source analysis if we don't have one
    if (!this.mem.analysis) {
      this.mem.analysis = analyzeSourceForHarvesting(this.source);
    }

    if (!this.container) {
      // Look for an existing Container or Construction Site at these locations
      const results = this.room.lookAt(
          this.mem.analysis.containerPos[0], this.mem.analysis.containerPos[1]);
      results.some((lookup) => {
        if (lookup.constructionSite &&
            lookup.constructionSite.structureType === STRUCTURE_CONTAINER) {
          this.setContainer(
              lookup.constructionSite as ConstructionSite<STRUCTURE_CONTAINER>);
          return true;
        } else if (
            lookup.structure &&
            lookup.structure.structureType === STRUCTURE_CONTAINER) {
          this.setContainer(lookup.structure as StructureContainer);
          return true;
        }
        return false;
      });

      if (!this.container) {
        // No container assigned or none exsists, need to build a new one
        this.room.createConstructionSite(
            this.mem.analysis.containerPos[0],
            this.mem.analysis.containerPos[1], STRUCTURE_CONTAINER);
      }
    }

    if (this.container instanceof StructureContainer) {
      // Attach ourselves to the energy network
      if (!this.mem.eNodeFlag) {
        const flag = registerEnergyNode(
            this.room, [this.container.pos.x, this.container.pos.y], {
              persistant: true,
              structureID: this.container.id,
              threshold: 0,  // Keep us empty
              type: 'structure',
            });
        this.mem.eNodeFlag = flag.name;
      }

      // Start the misions
      if (!this.mem.harvestMission) {
        if (this.source.pos.lookFor(LOOK_FLAGS)
                .filter((flag) => flag.color !== HARVEST_SOURCE_FLAG_COLOR)
                .length === 0) {
          this.room.createFlag(
              this.source.pos.x, this.source.pos.y, this.name + '_harvest',
              HARVEST_SOURCE_FLAG_COLOR);
          const flag = Game.flags[this.name + '_harvest'];

          const harvestMsn = new HarvestingMission(flag);
          this.mem.harvestMission = harvestMsn.name;
          harvestMsn.setSource(this.source);
          harvestMsn.setContainer(this.container);
          harvestMsn.setMaxHarvesters(this.mem.analysis.maxHarvesters);
        }
      }
    }
  }

  private setContainer(container: StructureContainer|
                       ConstructionSite<STRUCTURE_CONTAINER>) {
    this.container = container;
    this.mem.containerID = container.id;
  }
}
