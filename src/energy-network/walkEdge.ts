import {TRANSPORT_MISSION_FLAG} from 'flagConstants';
import {TransportMission} from 'missions/transport';

import {EnergyNode} from './energyNode';
import {NetworkEdge, NetworkEdgeMemory} from './networkEdge';

interface WalkEdgeMemory {
  transportMsn: string|null;
}

/**
 * Walk Edge is a Network Edge where creeps will manually haul Energy between
 * the two nodes without maintaining a road.
 */
export class WalkEdge extends NetworkEdge<WalkEdgeMemory> {
  private transportMission: TransportMission|null = null;

  constructor(
      core: EnergyNode, node: EnergyNode,
      mem: NetworkEdgeMemory<WalkEdgeMemory>) {
    super(core, node, mem);
  }

  public init() {
    if (this.mem.state.transportMsn) {
      if (Game.flags[this.mem.state.transportMsn]) {
        this.transportMission =
            new TransportMission(Game.flags[this.mem.state.transportMsn]);
      } else {
        this.mem.state.transportMsn = null;
      }
    }
  }

  public run() {
    if (this.core && this.node) {
      if (!this.transportMission) {
        // Start a new transport mission
        this.transportMission =
            this.setUpTransportMission(this.node.flag.name + '_transport');
        if (this.node.getPolarity() > 0) {
          // Init target -> core
          this.transportMission.setSource(this.node);
          this.transportMission.setDestination(this.core);
        } else {
          // Init core -> target
          this.transportMission.setSource(this.core);
          this.transportMission.setDestination(this.node);
        }
        this.mem.state.transportMsn = this.transportMission.name;

        this.transportMission.setThroughput(this.node.getPolarity());
      } else {
        // Update throughput in case it changed
        this.transportMission.setThroughput(this.node.getPolarity());
      }
    }
    return;
  }

  private setUpTransportMission(name: string) {
    this.node.flag.pos.createFlag(
        name, TRANSPORT_MISSION_FLAG.color,
        TRANSPORT_MISSION_FLAG.secondaryColor);
    const flag = Game.flags[name];
    return new TransportMission(flag);
  }

  public retire() {
    if (this.transportMission) {
      this.transportMission.retire();
    }
    return;
  }

  /** @override */
  public isHealthy(): boolean {
    if (!this.mem.state.transportMsn) {
      return false;
    }

    if (!TransportMission.isHealthy(this.mem.state.transportMsn)) {
      return false;
    }

    return true;
  }
}
