import {TransportMission} from 'missions/transport';

import {EnergyNode} from './energyNode';
import {NetworkEdge, NetworkEdgeMemory} from './networkEdge';

interface WalkEdgeMemory {
  transportMsn: string;
}

/**
 * Walk Edge is a Network Edge where creeps will manually haul Energy between
 * the two nodes without maintaining a road.
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
    if (this.nodeA && this.nodeB) {
      if (!this.transportMission && this.mem.flow !== 0) {
        let source: EnergyNode;
        let dest: EnergyNode;

        if (this.mem.flow > 0) {
          source = this.nodeA;
          dest = this.nodeB;
        } else {
          source = this.nodeB;
          dest = this.nodeA;
        }
        // Start a new transport mission
        this.transportMission = new TransportMission(this.name + '_transport');
        this.transportMission.setSource(source);
        this.transportMission.setDestination(dest);
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
    if (this.transportMission) {
      console.log('retiring edge ' + this.name);
      // TODO: Do something with the orphaned creeps
      TransportMission.cleanup(this.transportMission.name);
    }
    return;
  }
}
