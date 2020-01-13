import {EnergyNodeMemory} from './energyNode';

export interface NetworkEdgeMemory<T = any> {
  name: string;
  type: string;
  nodeA: EnergyNodeMemory;
  nodeB: EnergyNodeMemory;
  flow: number;  // positive number is A -> B
  state: T;
}

export abstract class NetworkEdge<T = any> {
  public readonly name: string;
  public readonly nodeA: EnergyNodeMemory;
  public readonly nodeB: EnergyNodeMemory;
  protected readonly _mem: NetworkEdgeMemory<T>;

  constructor(name: string, mem: NetworkEdgeMemory<T>) {
    this.name = name;
    this.nodeA = mem.nodeA;
    this.nodeB = mem.nodeB;
    this._mem = mem;
  }

  public abstract run(): void;

  /** Removes all sub tasks of this edge. Edge can then be safely removed */
  public abstract retire(): void;

  public get mem() {
    return this._mem;
  }
}
