import HarvestMsn from 'v2/missions/mining/harvest.msn';

import Operation from '../operation';
import {analyzeSourceForHarvesting, SourceAnalysis} from './sourceAnalysis';

export interface MiningOperationMemory {
  sourceIdx: number;
  harvestMsn?: string;  // Harvest Mission for this Op
  containerId?: Id<StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>>;
  analysis?: SourceAnalysis;
  type: 'drop'|'cont'|'link';
  [key: string]: unknown;
}

export interface MiningOperationConfig {
  sourceIdx: number;
  type: 'drop'|'cont'|'link';
  [key: string]: unknown;
}

/**
 * Mining Operation
 *
 * Mining Operation coordinates several missions to efficiently harvest energy
 * from a single Source.
 *
 * Operation comes in three modes, and will handle upgrading between them:
 *
 * - Drop Mining:
 * Requires no infrastructure. Creeps simply harvest from the Source and drop
 * the energy in place.
 *
 * - Container Mining:
 * Requires a Container to be built adjacent to the Source. Creeps will continue
 * to drop-mine above the container. If the miners are in a secondary positon,
 * they will transfer their energy into the container instead.
 *
 * - Link Mining:
 * Requires a Link to be build adjacent to the harvesting creep. Creeps will
 * transfer their energy into the Link for transfer over the Link network.
 * Requires a slightly larger carry capacity to reduce Transfer intents.
 */
export default class MiningOperation extends
    Operation<MiningOperationMemory, MiningOperationConfig> {
  private harvestMsn: HarvestMsn|null = null;
  private container: StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>|
      null = null;

  protected initialize(config: MiningOperationConfig): void {
    const room = Game.rooms[this.mem.colony];
    const source = room.find(FIND_SOURCES)[config.sourceIdx];
    // TODO: calculate a better base location
    const spawn = room.find(FIND_MY_SPAWNS)[0];

    const analysis = analyzeSourceForHarvesting(spawn.pos, source);
    this.mem.data.analysis = analysis;
    return;
  }

  protected reconcile(): void {
    if (this.mem.data.harvestMsn) {
      this.harvestMsn =
          global.msnRegistry.get(this.mem.data.harvestMsn) as HarvestMsn | null;
    }

    if (this.mem.data.containerId) {
      this.container = Game.getObjectById(this.mem.data.containerId);
    }
  }

  protected initMemory(config: MiningOperationConfig): MiningOperationMemory {
    return {
      harvestMsns: [],
      sourceIdx: config.sourceIdx,
      type: config.type,
    };
  }

  /**  */
  public run(): void {
    if (!this.mem.data.analysis) return;

    if (!this.harvestMsn) {
      const msn = new HarvestMsn(`${this.name}-harvest`);
      msn.init(this.mem.colony, {
        sourceIdx: this.mem.data.sourceIdx,
        positions: this.mem.data.analysis.positions,
      });
      global.msnRegistry.register(msn);
      this.harvestMsn = msn;
      this.mem.data.dropMsn = msn.name;
    }

    if (this.mem.data.type === 'cont') {
      if (!this.container) {
        const room = Game.rooms[this.mem.colony];
        const primaryPos = this.mem.data.analysis.positions[0];
        room.createConstructionSite(
            primaryPos[0],
            primaryPos[1],
            STRUCTURE_CONTAINER,
        );
      } else if ((this.container as StructureContainer).hits > 0) {
        // Container finished

        if (this.harvestMsn) {
          this.harvestMsn.init(this.mem.colony, {
            sourceIdx: this.mem.data.sourceIdx,
            containerId: this.container.id as Id<StructureContainer>,
            positions: this.mem.data.analysis.positions,
          });
        }
      }
    }
  }

  protected finalize(): void {
    // Retire all sub-missions
    if (this.harvestMsn) {
      this.harvestMsn.retire();
    }
  }
}
