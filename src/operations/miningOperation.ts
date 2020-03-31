import {
  registerEnergyNode,
  unregisterEnergyNode,
} from 'energy-network/energyNode';
import {
  ENERGY_NODE_FLAG,
  flagIsColor,
  HARVEST_SOURCE_FLAG,
} from 'flagConstants';

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
  sourceID: Id<Source>|null;
  containerID: Id<StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>>|
      null;
  eNodeFlag: string|null;
}

export class MiningOperation {
  public readonly name: string;

  private readonly flag: Flag;
  private readonly room: Room;
  private readonly mem: MiningOperationMemory;

  private source: Source|null = null;
  private harvestMns: HarvestingMission|null = null;
  private container: StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>|
      null = null;

  constructor(flag: Flag) {
    this.flag = flag;
    this.name = flag.name;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.room = flag.room!;

    // Init memory
    if (!Memory.operations[flag.name]) {
      const mem: MiningOperationMemory = {
        analysis: null,
        containerID: null,
        eNodeFlag: null,
        harvestMission: null,
        sourceID: null,
      };
      Memory.operations[flag.name] = mem;
    }
    this.mem = Memory.operations[flag.name] as MiningOperationMemory;

    if (this.mem.containerID) {
      this.container = Game.getObjectById(this.mem.containerID);
    }
  }

  public init(): boolean {
    // Validate missions cache
    if (this.mem.harvestMission) {
      if (!Game.flags[this.mem.harvestMission]) {
        this.mem.harvestMission = null;
      } else {
        this.harvestMns =
            new HarvestingMission(Game.flags[this.mem.harvestMission]);
      }
    }

    // Validate Source cache
    if (this.mem.sourceID) {
      const source = Game.getObjectById(this.mem.sourceID);
      if (!source) {
        console.log('Mining Operation: Source no longer exists. Retiring.');
        this.mem.sourceID = null;
        return false;
      } else {
        this.source = source;
      }
    } else {
      // Check at our flag location for the source
      const sources = this.flag.pos.lookFor(LOOK_SOURCES);
      if (sources.length > 0) {
        const source = sources[0];
        this.mem.sourceID = source.id;
        this.source = source;
      }
    }

    // Validate Container cache, Non-blocking as we can request a new one
    if (this.mem.containerID) {
      const container = Game.getObjectById(this.mem.containerID);
      if (!container) {
        console.log('Mining Operation: Container no longer exists.');
        this.mem.containerID = null;
      } else {
        this.container = container;
      }
    }

    // Validate ENode cache. Non-blocking as we can register a new one
    if (this.mem.eNodeFlag) {
      const flag = Game.flags[this.mem.eNodeFlag];
      if (!flag) {
        console.log('Mining Operation: ENode no longer exists');
        this.mem.eNodeFlag = null;
      }
    }

    return true;
  }

  public run(): void {
    if (!this.source) {
      return;
    }

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
        console.log(`Mining Op creating construction site at: (${
            this.mem.analysis.containerPos[0]},${
            this.mem.analysis.containerPos[1]})`);
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
              color: ENERGY_NODE_FLAG,
              coreBuffer: 0,
              persistant: true,
              polarity: 10,  // Keep us empty
              structureID: this.container.id,
              type: 'structure',
            });
        this.mem.eNodeFlag = flag.name;
      }

      // Start the misions
      if (!this.mem.harvestMission) {
        if (this.source.pos.lookFor(LOOK_FLAGS)
                .filter((flag) => flagIsColor(flag, HARVEST_SOURCE_FLAG))
                .length === 0) {
          console.log(`Mining operation launching new harvesting missions`);
          this.room.createFlag(
              this.source.pos.x, this.source.pos.y, this.name + '_harvest',
              HARVEST_SOURCE_FLAG.color, HARVEST_SOURCE_FLAG.secondaryColor);
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
                       ConstructionSite<STRUCTURE_CONTAINER>): void {
    this.container = container;
    this.mem.containerID = container.id;
  }

  public isHealthy(): boolean {
    if (this.container === null) {
      return false;
    }

    if (!this.mem.harvestMission) {
      return false;
    }

    if (!HarvestingMission.isHealthy(this.mem.harvestMission)) {
      return false;
    }

    return true;
  }

  public retire(): void {
    console.log('Retiring MiningOp: ' + this.name);
    if (this.harvestMns) {
      this.harvestMns.retire();
    }
    if (this.mem.eNodeFlag) {
      const flag = Game.flags[this.mem.eNodeFlag];
      unregisterEnergyNode(flag);
    }
    this.flag.remove();
    delete Memory.operations[this.name];
  }
}
