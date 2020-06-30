import SingleHarvestMsn from 'v2/missions/mining/single-harvest';
import {ProtoPos} from 'v2/types';

import Operation from './operation';

export interface MiningOperationMemory {
  sourceIdx: number;
  harvestMsn?: string;
  analysis?: {pos: ProtoPos};
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected initialize(config: MiningOperationConfig): void {
    // TODO: Perform Source Analysis
    const room = Game.rooms[this.mem.colony];
    const source = room.find(FIND_SOURCES)[config.sourceIdx];
    this.mem.data.analysis = {
      pos: {
        room: room.name,
        x: source.pos.x,
        y: source.pos.y - 1,
      },
    };
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
      // Launch a new Single Harvest Mission
      const pos = this.mem.data.analysis.pos;
      const msn = new SingleHarvestMsn(`${this.name}-hvst`);
      msn.init(this.mem.colony, {
        sourceIdx: this.mem.data.sourceIdx,
        pos: [pos.x, pos.y],
      });
      global.msnRegistry.register(msn);
      this.mem.data.harvestMsn = msn.name;
    }
  }

  protected finalize(): void {
    return;
  }
}
