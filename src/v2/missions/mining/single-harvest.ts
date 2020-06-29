import {WORKER} from 'spawn-system/bodyTypes';
import {setCreepBehavior} from 'v2/behaviors/behavior';
import HarvestBehavior from 'v2/behaviors/harvest';

import Mission from '../mission';

interface SingleHarvestMsnData {
  sourceIdx: number;  // Target source index in room.sources
  pos: number[];      // Standing position, [x, y]
}

interface SingleHarvestConfig {
  sourceIdx: number;  // Target source index in room.sources
  pos: number[];      // Standing position
}

/**
 * SingleHarvestMsn is a specialized mission to maintain a single harvest creep
 * on a source at a specific location. Utilizing drop mining.
 *
 * If the position contains a container, the creep will repair it when damaged.
 */
export default class SingleHarvestMsn extends
    Mission<SingleHarvestMsnData, SingleHarvestConfig> {
  private source: Source|null = null;

  protected bodyType = WORKER;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected initialize(config: SingleHarvestConfig): void {
    return;
  }

  protected reconcile(): void {
    throw new Error('Method not implemented.');
  }

  protected initMemory(config: SingleHarvestConfig): SingleHarvestMsnData {
    return {
      sourceIdx: config.sourceIdx,
      pos: config.pos,
    };
  }

  protected get maxCreeps(): number {
    return 1;
  }

  protected creepActions(): void {
    const room = Game.rooms[this.mem.colony];
    const sources = room.find(FIND_SOURCES);

    for (const name of this.mem.creeps) {
      const creep = Game.creeps[name];

      if (!creep) continue;

      const behavior = new HarvestBehavior();
      const harvestPosition = this.mem.data.pos;
      const overridePos =
          new RoomPosition(harvestPosition[0], harvestPosition[1], room.name);
      setCreepBehavior(
          creep,
          behavior.new(sources[this.mem.data.sourceIdx], {}, {overridePos}));
    }
  }

  protected finalize(): void {
    throw new Error('Method not implemented.');
  }
}
