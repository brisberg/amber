import {EnergyNode, EnergyNodeMemory} from './energyNode';
import {NetworkEdge, NetworkEdgeMemory} from './networkEdge';
import {WalkEdge} from './walkEdge';

interface RoomEnergyNetworkMemory {
  room: string;
  nodes: string[];  // Array of flag names
  edges: NetworkEdgeMemory[];
}

function initNetworkEdgeByType(mem: NetworkEdgeMemory): NetworkEdge {
  switch (mem.type) {
    case 'walk': {
      return new WalkEdge(mem.name, mem);
    }
    default: { throw Error('Unknown Network Edge Type'); }
  }
}

/**
 * RoomEnergyNetwork
 *
 * This network is attached to a particular room. It uses a list of Energy
 * Source and Energy Sinks and maintains a set of Routes which allow energy to
 * flow through the network.
 *
 * See docs/EnergyTransportNetworks for more.
 */
export class RoomEnergyNetwork {
  private readonly room: Room;
  private readonly nodes: EnergyNode[];
  private readonly edges: NetworkEdge[];  // TODO abstract to NetworkEdge

  private readonly mem: RoomEnergyNetworkMemory;

  constructor(room: Room) {
    this.room = room;

    if (!Memory.rooms[room.name].network) {
      const mem: RoomEnergyNetworkMemory = {
        edges: [],
        nodes: [],
        room: room.name,
      };
      Memory.rooms[room.name].network = mem;
    }
    this.mem = Memory.rooms[room.name].network;

    this.nodes = this.mem.nodes.map((flag) => new EnergyNode(Game.flags[flag]));
    this.edges = this.mem.edges.map(initNetworkEdgeByType);
  }

  public run() {
    // TODO: Sync node memory with the flags that exist

    if (this.nodes.length >= 2) {
      // HACK, add links between each successive nodes
      for (let i = 1; i < this.nodes.length; i++) {
        const edgeName = (i - 1) + '-' + i;
        const edgeExists = this.edges.length > 0;
        if (!edgeExists) {
          const edgeMem: NetworkEdgeMemory<any> = {
            dest: this.nodes[i].mem,
            name: edgeName,
            source: this.nodes[i - 1].mem,
            state: {},
            type: 'walk',
          };
          this.mem.edges.push(edgeMem);
          const edge = new WalkEdge(edgeName, edgeMem);
          this.edges.push(edge);
        }
      }
    }

    for (const edge of this.edges) {
      edge.run();
    }
  }
}
