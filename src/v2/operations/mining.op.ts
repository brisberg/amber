import SingleHarvestMsn from 'v2/missions/mining/single-harvest';

import Operation from './operation';
import {analyzeSourceForHarvesting, SourceAnalysis} from './sourceAnalysis';

export interface MiningOperationMemory {
  sourceIdx: number;
  harvestMsns: string[];
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
  private harvestMsns: SingleHarvestMsn[] = [];
  private hUnitsAvailable = 0;

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
    const room = Game.rooms[this.mem.colony];
    const maxEnergy = room.energyCapacityAvailable;

    // TODO: perform this calculation somewhere else
    // (Energy - 1x CARRY) / 2x WORK 1x Move
    this.hUnitsAvailable = Math.min((maxEnergy - 50) / 250);

    this.mem.data.harvestMsns.forEach((msnName) => {
      const msn = global.msnRegistry.get(msnName);
      if (msn) {
        this.harvestMsns.push(msn as SingleHarvestMsn);
      }
    });
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

    // TODO: Maybe cache last room energy calculated, to avoid most of the time

    let hUnitsLeft = 3;
    this.harvestMsns.forEach((msn) => {
      if (hUnitsLeft <= 0) {
        msn.retire();
      } else {
        const hUnits = Math.min(hUnitsLeft, this.hUnitsAvailable);
        hUnitsLeft -= hUnits;
        // msn.setHUnits(hUnits);
      }
    });

    // Fill in mission amounts
  }

  protected finalize(): void {
    // Retire all sub-missions
    this.harvestMsns.forEach((msn) => msn.retire());
  }
}
