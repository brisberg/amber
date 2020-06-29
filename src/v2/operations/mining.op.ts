import Operation from './operation';
import {getMemory} from './utils';

export interface MiningOperationMemory {
  sourceIdx: number;
  type: 'drop'|'cont'|'link';
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
    Operation<MiningOperationMemory, Record<string, unknown>> {
  constructor(readonly name: string) {
    super(name);
    this.mem = getMemory(this);
  }

  protected initialize(config: Record<string, unknown>): void {
    throw new Error('Method not implemented.');
  }
  protected reconcile(): void {
    throw new Error('Method not implemented.');
  }
  protected initMemory(config: Record<string, unknown>): MiningOperationMemory {
    throw new Error('Method not implemented.');
  }
  public run(): void {
    throw new Error('Method not implemented.');
  }
  protected finalize(): void {
    throw new Error('Method not implemented.');
  }
}
