import {TransportMission} from 'missions/transport';

import {EnergyNode} from './energyNode';
import {NetworkEdge, NetworkEdgeMemory} from './networkEdge';

interface WalkEdgeMemory {
  transportMsn: string;
}

/**
 * Walk Edge is a Network Edge where creeps will manually haul Energy from the
 * source to destination without maintaining a road.
 */
export class WalkEdge extends NetworkEdge<WalkEdgeMemory> {
  private transportMission: TransportMission|null = null;

  constructor(name: string, mem: NetworkEdgeMemory<WalkEdgeMemory>) {
    super(name, mem);
    if (mem.state.transportMsn) {
      this.transportMission = new TransportMission(mem.state.transportMsn);
    }
  }

  public run() {
    if (this.source && this.dest) {
      if (!this.transportMission) {
        // Start a new transport mission
        this.transportMission = new TransportMission(this.name + '_transport');
        this.transportMission.setSource(
            new EnergyNode(Game.flags[this.source.flag]));
        this.transportMission.setDestination(
            new EnergyNode(Game.flags[this.dest.flag]));
        this.mem.state.transportMsn = this.transportMission.name;
      }

      if (this.transportMission) {
        this.transportMission.run();
      }
    }
    return;
  }

  public retire() {
    // Unimplemented
    return;
  }
}
