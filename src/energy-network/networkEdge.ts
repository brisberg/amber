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
  protected readonly mem: NetworkEdgeMemory<T>;

  constructor(name: string, mem: NetworkEdgeMemory<T>) {
    this.name = name;
    this.source = mem.source;
    this.dest = mem.dest;
    this.mem = mem;
  }

  public abstract run(): void;
}
