import {WORKER} from 'spawn-system/bodyTypes';
import {setCreepBehavior} from 'v2/behaviors/behavior';
import CHarvestBehavior from 'v2/behaviors/c-harvest';
import HarvestBehavior from 'v2/behaviors/harvest';
import RelieveBehavior from 'v2/behaviors/relieve';
import {Point} from 'v2/types';

import Mission, {GetBodyTypeResult} from '../mission';

interface HarvestMsnData {
  sourceIdx: number;       // Target source index in room.sources
  containerId?: string;    // ID of the harvest Container
  positions: Point[];      // Mining positions, Ordered Primary first
  [key: string]: unknown;  // TODO: Remove this
}

export interface HarvestMsnConfig {
  sourceIdx: number;       // Target source index in room.sources
  containerId?: string;    // ID of the harvest Container
  positions: Point[];      // Mining positions
  [key: string]: unknown;  // TODO: Remove this
}

/**
 * HarvestMsn is a general mission to maintain creeps harvesting from a single
 * source.
 *
 * Works at any RCL and with or without a Container.
 *
 * TODO: Expand creep capacity with a Link, and add Link mining
 */
export default class HarvestMsn extends
    Mission<HarvestMsnData, HarvestMsnConfig> {
  private source: Source|null = null;
  private container: StructureContainer|null = null;

  protected initialize(): void {
    return;
  }

  protected getBodyType(): GetBodyTypeResult {
    const room = Game.rooms[this.mem.colony];
    if (room.energyCapacityAvailable <= 300) {
      // RCL1
      return {ratio: WORKER, options: {max: {work: 2}}};
    } else if (room.energyCapacityAvailable <= 550) {
      // RCL2
      return {ratio: WORKER, options: {max: {work: 4}}};
    } else {
      // RCL3
      return {ratio: WORKER, options: {max: {work: 6}}};
    }
  }

  protected get maxCreeps(): number {
    const room = Game.rooms[this.mem.colony];
    const harvestPositions = this.mem.data.positions.length;
    if (room.energyCapacityAvailable <= 300) {
      // RCL1
      return Math.min(3, harvestPositions);
    } else if (room.energyCapacityAvailable <= 550) {
      // RCL2
      return Math.min(2, harvestPositions);
    } else {
      // RCL3
      return Math.min(1, harvestPositions);
    }
  }

  protected reconcile(): void {
    const room = Game.rooms[this.mem.colony];
    const sources = room.find(FIND_SOURCES);
    this.source = sources[this.mem.data.sourceIdx];
    if (this.mem.data.containerId) {
      this.container = Game.getObjectById(this.mem.data.containerId);
    }
  }

  protected initMemory(config: HarvestMsnConfig): HarvestMsnData {
    const data: HarvestMsnData = {
      sourceIdx: config.sourceIdx,
      positions: config.positions,
    };
    if (config.containerId) {
      data.containerId = config.containerId;
    }
    return data;
  }

  protected creepActions(): void {
    if (!this.source) return;

    const harvest = global.behaviorsMap['harvest'] as HarvestBehavior;
    const charvest = global.behaviorsMap['c-harvest'] as CHarvestBehavior;
    const relieve = global.behaviorsMap['relieve'] as RelieveBehavior;

    this.mem.creeps.forEach((name, index) => {
      const creep = Game.creeps[name];

      if (!creep || !this.source) return;

      if (index < this.maxCreeps) {
        if (!this.container || creep.pos.isEqualTo(this.container)) {
          setCreepBehavior(creep, harvest.new(this.source));
        } else {
          setCreepBehavior(
              creep,
              charvest.new(this.source, {}, {containerId: this.container.id}));
        }
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
