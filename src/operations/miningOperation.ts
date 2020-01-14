import {registerEnergyNode} from 'energy-network/energyNode';

import {BuildMission} from '../missions/build';
import {HarvestingMission} from '../missions/harvesting';
import {analyzeSourceForHarvesting, SourceAnalysis} from './sourceAnalysis';

/**
 * Mining Operation
 *
 * This Operation will facilitate all of the sub operations required to set up a
 * harvesting operation.
 *
 * It will perform Source Analysis on a given source node, designate where the
 * Container should be placed. It will run a Build missions to get this
 * container constructed. Once the Build is completed, it will scrap that
 * mission and start a new Harvest mission on the node.
 *
 * This will reassign all the worker from the build to the harvest.
 */

export interface MiningOperationMemory {
  analysis: SourceAnalysis|null;
  buildMission: string|null;
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
        buildMission: null,
        containerID: null,
        eNodeFlag: null,
        harvestMission: null,
        sourceID: source.id,
      };
      Memory.operations[name] = mem;
    }
    this.mem = Memory.operations[name] as MiningOperationMemory;
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

    if (this.container instanceof ConstructionSite && !this.mem.buildMission) {
      // Build Phase
      const buildMsn = new BuildMission(this.name + '_build');
      buildMsn.setTargetSite(this.container);
      buildMsn.useRawSource(this.source);  // We know we have a source near by
      buildMsn.setMaxBuilders(2);          // Hardcoding for now
      this.mem.buildMission = buildMsn.name;
    } else if (this.container instanceof StructureContainer) {
      // Attach ourselves to the enrgy network
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

      // Transfer Phase
      if (this.mem.buildMission && !this.mem.harvestMission) {
        // Cleanup the build missions and reassign all creeps to the new Harvest
        // missions
        const creeps = BuildMission.cleanup(this.mem.buildMission);
        this.mem.buildMission = null;
        const harvestMsn = new HarvestingMission(this.name + '_harvest');
        this.mem.harvestMission = harvestMsn.name;
        harvestMsn.setSource(this.source);
        harvestMsn.setContainer(this.container);
        harvestMsn.setMaxHarvesters(this.mem.analysis.maxHarvesters);
        // Transfer the creeps as harvesters to the harvesting missions
        Memory.missions[harvestMsn.name].harvesters = creeps;
      } else if (!this.mem.harvestMission) {
        const harvestMsn = new HarvestingMission(this.name + '_harvest');
        this.mem.harvestMission = harvestMsn.name;
        harvestMsn.setSource(this.source);
        harvestMsn.setContainer(this.container);
        harvestMsn.setMaxHarvesters(this.mem.analysis.maxHarvesters);
      }
    }
  }

  private setContainer(container: StructureContainer|
                       ConstructionSite<STRUCTURE_CONTAINER>) {
    this.container = container;
    this.mem.containerID = container.id;
  }
}
