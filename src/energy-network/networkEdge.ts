import {EnergyNode, EnergyNodeMemory} from './energyNode';

export interface NetworkEdgeMemory<T = any> {
  name: string;
  type: string;
  flow: number;  // TODO remove
  nodeA: string;
  nodeB: string;
  dist: number;
  state: T;
}

export abstract class NetworkEdge<T = any> {
  public readonly name: string;
  public readonly nodeA: EnergyNode;
  public readonly nodeB: EnergyNode;
  protected readonly _mem: NetworkEdgeMemory<T>;

  constructor(name: string, mem: NetworkEdgeMemory<T>) {
    this.name = name;
    this.nodeA = new EnergyNode(Game.flags[mem.nodeA]);
    this.nodeB = new EnergyNode(Game.flags[mem.nodeB]);
    this._mem = mem;
  }

  public abstract run(): void;

  /** Removes all sub tasks of this edge. Edge can then be safely removed */
  public abstract retire(): void;

  public get mem() {
    return this._mem;
  }
}
