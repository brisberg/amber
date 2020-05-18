import {ENERGY_NODE_FLAG} from 'flagConstants';
import {TransportMission} from 'missions/logistics/transport';

import {EnergyNode} from './energyNode';
import {NetworkEdge, NetworkEdgeMemory} from './networkEdge';
import {WalkEdge} from './walkEdge';

interface EnergyNetworkMemory {
  edges: {[node: string]: NetworkEdgeMemory};
}

/**
 * RoomEnergyNetwork
 *
 * This network is attached to a particular room. It uses a list of Energy
 * Source and Energy Sinks and maintains a set of Routes which allow energy to
 * flow through the network.
 *
 * The network will be rooted on a Core Energy Node placed on the room Storage
 * (or Container pre RCL4). All energy nodes in the room will create transport
 * links between themselves and the the Core Node.
 *
 * This only deals with intra-room energy linkages, roads and links for remote
 * mining neighboring rooms will not interact with this network.
 *
 * See docs/EnergyTransportNetworks for more.
 */
export class RoomEnergyNetwork {
  private readonly name: string;
  private readonly flag: Flag;
  private readonly room: Room;
  private readonly mem: EnergyNetworkMemory;

  private coreNode: EnergyNode|null = null;
  private _nodes: EnergyNode[] = [];
  private edges: NetworkEdge[] = [];

  constructor(flag: Flag) {
    this.name = flag.name;
    this.flag = flag;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.room = flag.room!;

    if (!Memory.rooms[this.room.name].network) {
      const mem: EnergyNetworkMemory = {
        edges: {},
      };
      Memory.rooms[this.room.name].network = mem;
    }
    this.mem = Memory.rooms[this.room.name].network;
  }

  /**
   * Initialize the Network from exiting Energy Node Flags. Returns false if it
   * could not be initialized and it should be removed.
   */
  public init(): boolean {
    if (!EnergyNode.validateNode(this.flag)) {
      console.log(
          'ENetwork ' + this.name + ': Could not validate Core Node. Removing');
      return false;
    }

    this.coreNode = new EnergyNode(this.flag);

    // Look up all Energy Node Flags
    let flags = this.room.find(FIND_FLAGS, {
      filter: ENERGY_NODE_FLAG,
    });
    // Validate flags, pruning derelict nodes
    flags = flags.filter((flag) => {
      if (EnergyNode.validateNode(flag)) {
        return true;
      } else {
        flag.remove();
        return false;
      }
    });
    const nodeNames = flags.map((flag) => flag.name);
    for (const node in this.mem.edges) {
      if (nodeNames.indexOf(node) === -1) {
        // Hack, for when an ENode was removed
        if (this.mem.edges[node] && this.mem.edges[node].state.transportMsn) {
          const flag = Game.flags[this.mem.edges[node].state.transportMsn];
          const msn = new TransportMission(flag);
          msn.retire();
        }
        delete this.mem.edges[node];
      }
    }
    for (const flag of flags) {
      // Init missing memory
      if (!this.mem.edges[flag.name]) {
        this.mem.edges[flag.name] = {type: 'noop', state: {}};
      }
    }
    this._nodes = flags.map((flag) => new EnergyNode(flag));
    this.edges = this._nodes.map((node) => this.initNetworkEdgeByType(node));
    return true;
  }

  public get nodes(): EnergyNode[] {
    return this._nodes;
  }

  public run(): void {
    for (const edge of this.edges) {
      edge.run();
    }
  }

  public retire(): void {
    this.edges.forEach((edge) => edge.retire());
    delete Memory.rooms[this.room.name].network;
    this.flag.remove();
  }

  private initNetworkEdgeByType(node: EnergyNode): NetworkEdge {
    switch (node.mem.type) {
      case 'structure': {
        // Initialize edge from target -> core
        return new WalkEdge(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.coreNode!, node, this.mem.edges[node.flag.name]);
      }
      default: { throw Error('Unknown Network Edge Type'); }
    }
  }

  public isHealthy(): boolean {
    if (this.coreNode === null) {
      return false;
    }

    if (this.edges.length === 0) {
      return false;
    }

    if (this.edges.some((edge) => !edge.isHealthy())) {
      return false;
    }

    return true;
  }
}
