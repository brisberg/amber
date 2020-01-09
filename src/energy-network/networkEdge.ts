import {EnergyNode} from './roomEnergyNetwork';

export interface NetworkEdgeMemory {
  type: string;
  source: EnergyNode;
  dest: EnergyNode;
}
