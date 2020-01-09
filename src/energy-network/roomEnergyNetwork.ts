import {EnergyNode} from './energyNode';
import {NetworkEdge, NetworkEdgeMemory} from './networkEdge';
import {WalkEdge} from './walkEdge';

interface RoomEnergyNetworkMemory {
  room: string;
  nodes: EnergyNode[];
  edges: NetworkEdgeMemory[];
}

function initNetworkEdgeByType(mem: NetworkEdgeMemory): NetworkEdge {
  // const edgeLookup: {[type: string]: WalkEdge} = {
  //   walk: WalkEdge.prototype,
  // };

  const edgeClassByType: {[type: string]: string} = {
    walk: 'WalkEdge',
  };

  // const con = edgeLookup[type];
  // return Object.create(con);
  const cls = edgeClassByType[mem.type];
  return new (global as any)[cls]('walkedge', mem);
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

    this.nodes = this.mem.nodes;
    this.edges = this.mem.edges.map(initNetworkEdgeByType);
  }

  public run() {
    if (this.nodes.length >= 2) {
      // HACK, add links between each successive nodes
      for (let i = 1; i < this.nodes.length; i++) {
        const edgeName = (i - 1) + '-' + i;
        if (!this.edges.some((edge) => edge.name === edgeName)) {
          const edgeMem: NetworkEdgeMemory<any> = {
            dest: this.nodes[i],
            name: edgeName,
            source: this.nodes[i - 1],
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
