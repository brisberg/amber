/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {HAULER} from 'spawn-system/bodyTypes';

import Mission, {GetBodyTypeResult} from '../mission';
import FetchBehavior from 'v2/behaviors/fetch';
import {setCreepBehavior} from 'v2/behaviors/behavior';
import DeliverBehavior from 'v2/behaviors/deliver';

interface TransportMsnData {
  throughput: number;      // units/tick desired by the Network
  [key: string]: unknown;  // TODO: Remove this
}

export interface TransportMsnConfig {
  throughput: number;      // Target source index in room.sources
  [key: string]: unknown;  // TODO: Remove this
}

/**
 * TransportMsn is specialized creep container to supply agents for use by the
 * Logistics Network.
 */
export default class TransportMsn extends
    Mission<TransportMsnData, TransportMsnConfig> {
  /** Set the Throughput value for this mission */
  public set throughput(throughput: number) {
    this.mem.data.throughput = throughput;
  }

  public get throughput(): number {
    return this.mem.data.throughput;
  }

  public getHaulers(): Creep[] {
    return this.mem.creeps.map((name) => Game.creeps[name]);
  }

  protected initialize(): void {
    return;
  }

  protected getBodyType(): GetBodyTypeResult {
    return {ratio: HAULER};
  }

  protected get maxCreeps(): number {
    // TODO: Do a real capacity calculation
    return this.mem.data.throughput / 10;
  }

  protected reconcile(): void {
    return;
  }

  protected initMemory(config: TransportMsnConfig): TransportMsnData {
    return {
      throughput: config.throughput,
    };
  }

  protected creepActions(): void {
    const fetch = global.behaviorsMap['fetch'] as FetchBehavior;
    const deliver = global.behaviorsMap['deliver'] as DeliverBehavior;

    for (const creepname of this.mem.creeps) {
      const creep = Game.creeps[creepname];

      const network = global.netRegistry.get(this.mem.colony);
      if (network) {
        const plan = network.getPlan(creep);
        if (plan && plan.steps.length > 0) {
          const step = plan.steps[0];
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const request = network.getRequest(step.requestId)!;
          if (creep.memory.mem.stepId !== step.id) {
            // TODO: Assign correct creep behavior
            if (request.request === 'pickup') {
              setCreepBehavior(
                creep,
                fetch.new(Game.getObjectById(request.targetId)!),
              );
            } else {
              setCreepBehavior(
                creep,
                deliver.new(Game.getObjectById(request.targetId)!),
              );
            }
          }
        }
      }
    }
  }

  protected finalize(): void {
    throw new Error('Method not implemented.');
  }
}
