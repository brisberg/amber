import {HAULER} from 'spawn-system/bodyTypes';

import Mission, {GetBodyTypeResult} from '../mission';

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
    throw new Error('Method not implemented.');
  }

  protected finalize(): void {
    throw new Error('Method not implemented.');
  }
}
