/* eslint-disable @typescript-eslint/no-explicit-any */
import {EnergyNode} from './energyNode';

export interface NetworkEdgeMemory<T = any> {
  type: string;
  state: T;
}

export abstract class NetworkEdge<T = any> {
  public readonly core: EnergyNode;
  public readonly node: EnergyNode;
  protected readonly _mem: NetworkEdgeMemory<T>;

  constructor(core: EnergyNode, node: EnergyNode, mem: NetworkEdgeMemory<T>) {
    this.core = core;
    this.node = node;
    this._mem = mem;
  }

  public abstract run(): void;

  /** Removes all sub tasks of this edge. Edge can then be safely removed */
  public abstract retire(): void;

  /** Returns true if this edge has valid connections and at least one Hauler */
  public abstract isHealthy(): boolean;

  public get mem(): NetworkEdgeMemory<T> {
    return this._mem;
  }
}
