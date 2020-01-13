import {ENERGY_NODE_FLAG_COLOR} from 'flagConstants';

import {EnergyNode} from './energyNode';
import {analyzeEnergyNetwork, EnergyNetworkAnalysis} from './networkAnalysis';
import {NetworkEdge, NetworkEdgeMemory} from './networkEdge';
import {WalkEdge} from './walkEdge';

interface RoomEnergyNetworkMemory {
  room: string;
  nodes: string[];  // Array of flag names
  edges: NetworkEdgeMemory[];
  _cache?: EnergyNetworkAnalysis;
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
  private readonly _nodes: EnergyNode[];
  private readonly edges: NetworkEdge[];

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

    this._nodes =
        this.mem.nodes.map((flag) => new EnergyNode(Game.flags[flag]));
    this.edges = this.mem.edges.map(initNetworkEdgeByType);
  }

  public discardAnalysisCache() {
    delete this.mem._cache;
  }

  public get nodes() {
    return this._nodes;
  }

  public run() {
    // TODO: Sync node memory with the flags that exist
    this.syncNodesFromFlags();

    if (!this.mem._cache) {
      this.mem._cache = analyzeEnergyNetwork(this);

      for (const edge of this.edges) {
        edge.retire();
      }

      for (const edge of this.mem._cache.mst) {
        const edgeName = edge.startV + '-' + edge.endV;
        const edgeMem: NetworkEdgeMemory<any> = {
          dest: this.nodes.find((node) => node.flag.name === edge.endV)!.mem,
          name: edgeName,
          source:
              this.nodes.find((node) => node.flag.name === edge.startV)!.mem,
          state: {},
          type: 'walk',
        };
        this.mem.edges.push(edgeMem);
        const newEdge = new WalkEdge(edgeName, edgeMem);
        this.edges.push(newEdge);
      }
    }

    for (const edge of this.edges) {
      edge.run();
    }
  }

  public hasSource(): boolean {
    return this.nodes.some((node) => node.mem.polarity === 'source');
  }

  public registerEnergyNode(flag: Flag) {
    this.mem.nodes.push(flag.name);
    this.nodes.push(new EnergyNode(flag));
    this.discardAnalysisCache();
    return;
  }

  public unregisterEnergyNode(name: string) {
    // Prune the name from our list of nodes
    this.mem.nodes = this.mem.nodes.filter((node) => node !== name);
    const obsoliteEdges = this.edges.filter((edge) => {
      return edge.source.flag === name || edge.dest.flag === name;
    });
    obsoliteEdges.forEach((edge) => edge.retire());
    this.mem.edges = this.edges.filter((edge) => !obsoliteEdges.includes(edge))
                         .map((edge) => edge.mem);
    this.discardAnalysisCache();
    return;
  }

  /** Looks at all flags in the room and use them to update our node list  */
  private syncNodesFromFlags() {
    const flags =
        this.room.find(FIND_FLAGS, {filter: {color: ENERGY_NODE_FLAG_COLOR}});

    for (const flag of flags) {
      if (this.mem.nodes.indexOf(flag.name) === -1) {
        // New flag found
        this.registerEnergyNode(flag);
      }
    }

    for (const name of this.mem.nodes) {
      if (flags.findIndex((flag) => flag.name === name) === -1) {
        // Flag was removed, delete the node
        this.unregisterEnergyNode(name);
      }
    }
  }
}
