import {ENERGY_NODE_FLAG_COLOR} from 'flagConstants';
import {hashCode} from 'utils/hash';

import {EnergyNode} from './energyNode';
import {analyzeEnergyNetwork, EnergyNetworkAnalysis} from './networkAnalysis';
import {NetworkEdge, NetworkEdgeMemory} from './networkEdge';
import {WalkEdge} from './walkEdge';

interface RoomEnergyNetworkMemory {
  room: string;
  nodes: string[];  // Array of flag names
  nodesHash: number;
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
  private _nodes: EnergyNode[] = [];
  private edges: NetworkEdge[] = [];

  private readonly mem: RoomEnergyNetworkMemory;

  constructor(room: Room) {
    this.room = room;

    if (!Memory.rooms[room.name].network) {
      const mem: RoomEnergyNetworkMemory = {
        edges: [],
        nodes: [],
        nodesHash: 0,
        room: room.name,
      };
      Memory.rooms[room.name].network = mem;
    }
    this.mem = Memory.rooms[room.name].network;

    this.syncNodesFromFlags();
  }

  public discardAnalysisCache() {
    delete this.mem._cache;
  }

  public get nodes() {
    return this._nodes;
  }

  public run() {
    for (const edge of this.edges) {
      edge.run();
    }
  }

  private generateNetworkAnalysis() {
    if (!this.mem._cache) {
      this.mem._cache = analyzeEnergyNetwork(this);

      for (const edge of this.edges) {
        edge.retire();
      }
      this.edges = [];
      this.mem.edges = [];

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
    const flagNames = flags.map((flag) => flag.name);
    this._nodes = flags.map((flag) => new EnergyNode(flag));

    const newNodeHash = hashCode(flagNames.join(','));
    if (newNodeHash !== this.mem.nodesHash) {
      this.discardAnalysisCache();
      this.mem.nodes = flagNames;
      this.mem.nodesHash = newNodeHash;
      this.generateNetworkAnalysis();
    }
    this.edges = this.mem.edges.map(initNetworkEdgeByType);
  }
}
