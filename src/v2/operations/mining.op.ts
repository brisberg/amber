import SingleHarvestMsn from 'v2/missions/mining/single-harvest';

import Operation from './operation';
import {analyzeSourceForHarvesting, SourceAnalysis} from './sourceAnalysis';

export interface MiningOperationMemory {
  sourceIdx: number;
  harvestMsn?: string;
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
  private singleHarvestMsn: SingleHarvestMsn|null = null;

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
    const harvestMsn = this.mem.data.harvestMsn;
    if (harvestMsn) {
      const msn = global.msnRegistry.get(harvestMsn) as SingleHarvestMsn | null;
      if (msn) {
        this.singleHarvestMsn = msn;
      }
    }
  }

  protected initMemory(config: MiningOperationConfig): MiningOperationMemory {
    return {
      sourceIdx: config.sourceIdx,
      type: config.type,
    };
  }

  /**  */
  public run(): void {
    if (!this.mem.data.analysis) return;

    if (!this.singleHarvestMsn) {
      // Launch a new Single Harvest Mission for primary position
      const pos = this.mem.data.analysis.positions[0];
      const msn = new SingleHarvestMsn(`${this.name}-hvst`);
      msn.init(this.mem.colony, {
        sourceIdx: this.mem.data.sourceIdx,
        pos,
      });
      global.msnRegistry.register(msn);
      this.mem.data.harvestMsn = msn.name;
    }
  }

  protected finalize(): void {
    return;
  }
}
