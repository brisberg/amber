import {WORKER} from 'spawn-system/bodyTypes';
import {setCreepBehavior} from 'v2/behaviors/behavior';
import HarvestBehavior from 'v2/behaviors/harvest';
import RelieveBehavior from 'v2/behaviors/relieve';
import {Point} from 'v2/types';

import Mission from '../mission';

interface DropMineMsnData {
  sourceIdx: number;   // Target source index in room.sources
  positions: Point[];  // Mining positions, Ordered Primary first
}

export interface DropMineMsnConfig {
  sourceIdx: number;   // Target source index in room.sources
  positions: Point[];  // Mining positions
}

/**
 * DropMineMsn is a general mission to maintain creeps harvesting from a single
 * source and dropping the resources at their feet.
 *
 * Creeps will prioritize standing in the supplied position.
 */
export default class DropMineMsn extends
    Mission<DropMineMsnData, DropMineMsnConfig> {
  private source: Source|null = null;

  protected bodyType = WORKER;

  protected initialize(): void {
    return;
  }

  protected reconcile(): void {
    const room = Game.rooms[this.mem.colony];
    const sources = room.find(FIND_SOURCES);
    this.source = sources[this.mem.data.sourceIdx];
  }

  protected initMemory(config: DropMineMsnConfig): DropMineMsnData {
    return {
      sourceIdx: config.sourceIdx,
      positions: config.positions,
    };
  }

  protected get maxCreeps(): number {
    return this.mem.data.positions.length;
  }

  protected creepActions(): void {
    if (!this.source) return;

    const harvest = global.behaviorsMap['harvest'] as HarvestBehavior;
    const relieve = global.behaviorsMap['relieve'] as RelieveBehavior;

    this.mem.creeps.forEach((name, index) => {
      const creep = Game.creeps[name];

      if (!creep || !this.source) return;

      if (index < this.maxCreeps) {
        setCreepBehavior(creep, harvest.new(this.source));
      } else {
        const replaceIdx = index - this.maxCreeps;
        const target = Game.creeps[this.mem.creeps[replaceIdx]];
        setCreepBehavior(creep, relieve.new(target));
      }
    });
  }

  protected finalize(): void {
    throw new Error('Method not implemented.');
  }
}
