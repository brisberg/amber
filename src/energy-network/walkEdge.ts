import {TRANSPORT_MISSION_FLAG} from 'flagConstants';
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
    if (mem.state.transportMsn && Game.flags[mem.state.transportMsn]) {
      this.transportMission =
          new TransportMission(Game.flags[mem.state.transportMsn]);
    }
  }

  public run() {
    if (this.nodeA && this.nodeB) {
      if (this.mem.flow !== 0) {
        if (!this.transportMission) {
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
          this.transportMission =
              this.setUpTransportMission(this.name + '_transport');
          this.transportMission.setSource(source);
          this.transportMission.setDestination(dest);
          this.mem.state.transportMsn = this.transportMission.name;
        }

        this.transportMission.setThroughput(this.mem.flow);
        this.transportMission.run();
      } else {
        // No flow on this lane, we can remove the mission
        if (this.transportMission) {
          this.transportMission.retire();
        }
      }
    }
    return;
  }

  private setUpTransportMission(name: string) {
    this.nodeA.flag.pos.createFlag(
        name, TRANSPORT_MISSION_FLAG.color,
        TRANSPORT_MISSION_FLAG.secondaryColor);
    const flag = Game.flags[name];
    return new TransportMission(flag);
  }

  public retire() {
    if (this.transportMission) {
      console.log('retiring edge ' + this.name);
      // TODO: Do something with the orphaned creeps
      this.transportMission.retire();
    }
    return;
  }
}
