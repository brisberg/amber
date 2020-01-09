import {EnergyNode} from './energyNode';

export interface NetworkEdgeMemory<T = any> {
  name: string;
  type: string;
  source: EnergyNode;
  dest: EnergyNode;
  state: T;
}

export abstract class NetworkEdge<T = any> {
  public readonly name: string;
  protected readonly source: EnergyNode;
  protected readonly dest: EnergyNode;

  constructor(name: string, mem: NetworkEdgeMemory<T>) {
    this.name = name;
    this.source = mem.source;
    this.dest = mem.dest;
  }

  public abstract run(): void;
}
