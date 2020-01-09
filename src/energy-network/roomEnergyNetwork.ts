import {NetworkEdgeMemory} from './networkEdge';
import {WalkEdge} from './walkEdge';

export interface EnergyNode {
  ID: string;
  room: string;
  pos: [number, number];
  polarity: 'source'|'sink';
  type: 'link'|'structure'|'creep';
  persistant: boolean;  // Unused for now
}

interface RoomEnergyNetworkMemory {
  room: string;
  nodes: EnergyNode[];
  edges: NetworkEdgeMemory[];
}

function initNetworkEdgeByType(mem: NetworkEdgeMemory): WalkEdge {
  // const edgeLookup: {[type: string]: WalkEdge} = {
  //   walk: WalkEdge.prototype,
  // };

  const edgeClassByType: {[type: string]: string} = {
    walk: 'WalkEdge',
  };

  // const con = edgeLookup[type];
  // return Object.create(con);
  const cls = edgeClassByType[mem.type];
  return new (global as any)[cls](mem);
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
  private readonly edges: WalkEdge[];  // TODO abstract to NetworkEdge

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
}
