import {WORKER} from 'spawn-system/bodyTypes';
import Mission from '../mission';

interface SingleHarvestMsnData {
  sourceIdx: number;  // Target source index in room.sources
}

/**
 * SingleHarvestMsn is a specialized mission to maintain a single harvest creep
 * on a source at a specific location. Utilizing drop mining.
 *
 * If the position contains a container, the creep will repair it when damaged.
 */
export default class SingleHarvestMsn extends
    Mission<SingleHarvestMsnData, {}> {
  private source: Source|null = null;

  protected bodyType = WORKER;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected initialize(config: {}): void {
    throw new Error('Method not implemented.');
  }

  protected reconcile(): void {
    throw new Error('Method not implemented.');
  }

  protected initMemory(): SingleHarvestMsnData {
    throw new Error('Method not implemented.');
  }

  protected get maxCreeps(): number {
    throw new Error('Method not implemented.');
  }

  protected creepActions(): void {
    throw new Error('Method not implemented.');
  }

  protected finalize(): void {
    throw new Error('Method not implemented.');
  }
}
