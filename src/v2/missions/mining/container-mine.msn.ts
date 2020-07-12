import {WORKER} from 'spawn-system/bodyTypes';
import {setCreepBehavior} from 'v2/behaviors/behavior';
import CHarvestBehavior from 'v2/behaviors/c-harvest';
import HarvestBehavior from 'v2/behaviors/harvest';
import RelieveBehavior from 'v2/behaviors/relieve';
import {Point} from 'v2/types';

import Mission, {GetBodyTypeResult} from '../mission';

interface ContMineMsnData {
  sourceIdx: number;       // Target source index in room.sources
  containerId: string;     // ID of the harvest Container
  positions: Point[];      // Mining positions, Ordered Primary first
  [key: string]: unknown;  // TODO: Remove this
}

export interface ContMineMsnConfig {
  sourceIdx: number;       // Target source index in room.sources
  containerId: string;     // ID of the harvest Container
  positions: Point[];      // Mining positions
  [key: string]: unknown;  // TODO: Remove this
}

/**
 * ContMineMsn is a general mission to maintain creeps harvesting from a single
 * source and storing the harvest material in a Container.
 *
 * Creeps will prioritize standing in the supplied position to utilize "Drop
 * Mining". Creeps in other positions will transfer their contents into the
 * container.
 */
export default class ContMineMsn extends
    Mission<ContMineMsnData, ContMineMsnConfig> {
  private source: Source|null = null;
  private container: StructureContainer|null = null;

  protected initialize(): void {
    return;
  }

  protected getBodyType(): GetBodyTypeResult {
    return {ratio: WORKER};
  }

  protected reconcile(): void {
    const room = Game.rooms[this.mem.colony];
    const sources = room.find(FIND_SOURCES);
    this.source = sources[this.mem.data.sourceIdx];

    this.container = Game.getObjectById(this.mem.data.containerId);
  }

  protected initMemory(config: ContMineMsnConfig): ContMineMsnData {
    return {
      sourceIdx: config.sourceIdx,
      containerId: config.containerId,
      positions: config.positions,
    };
  }

  protected get maxCreeps(): number {
    // TODO: Limit creep total to 6 work parts
    return this.mem.data.positions.length;
  }

  protected creepActions(): void {
    if (!this.source) return;

    const harvest = global.behaviorsMap['harvest'] as HarvestBehavior;
    const charvest = global.behaviorsMap['c-harvest'] as CHarvestBehavior;
    const relieve = global.behaviorsMap['relieve'] as RelieveBehavior;

    this.mem.creeps.forEach((name, index) => {
      const creep = Game.creeps[name];

      if (!creep || !this.source || !this.container) return;

      if (index === 0) {
        // Position first harvester above container
        setCreepBehavior(
            creep,
            harvest.new(this.source, {overridePos: this.container.pos}),
        );
      } else if (index < this.maxCreeps) {
        const pos = this.mem.data.positions[index];
        setCreepBehavior(
            creep,
            charvest.new(
                this.source, {
                  overridePos: new RoomPosition(
                      pos[0],
                      pos[1],
                      this.source.room.name,
                      ),
                },
                {containerId: this.container.id}));
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
