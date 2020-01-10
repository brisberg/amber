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
  protected readonly source: EnergyNodeMemory;
  protected readonly dest: EnergyNodeMemory;
  protected readonly mem: NetworkEdgeMemory<T>;

  constructor(name: string, mem: NetworkEdgeMemory<T>) {
    this.name = name;
    this.source = mem.source;
    this.dest = mem.dest;
    this.mem = mem;
  }

  public abstract run(): void;
}
