import {EnergyNodeMemory} from './energyNode';

export interface NetworkEdgeMemory<T = any> {
  name: string;
  type: string;
  source: EnergyNodeMemory;
  dest: EnergyNodeMemory;
  state: T;
}

export abstract class NetworkEdge<T = any> {
  public readonly name: string;
  public readonly source: EnergyNodeMemory;
  public readonly dest: EnergyNodeMemory;
  protected readonly _mem: NetworkEdgeMemory<T>;

  constructor(name: string, mem: NetworkEdgeMemory<T>) {
    this.name = name;
    this.source = mem.source;
    this.dest = mem.dest;
    this._mem = mem;
  }

  public abstract run(): void;

  /** Removes all sub tasks of this edge. Edge can then be safely removed */
  public abstract retire(): void;

  public get mem() {
    return this._mem;
  }
}
