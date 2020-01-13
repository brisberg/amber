import {ENERGY_NODE_FLAG_COLOR} from 'flagConstants';
import {TransportMission} from 'missions/transport';
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
  }

  public get nodes() {
    return this._nodes;
  }

  public run() {
    if (Game.time % 100 === 0) {
      // Every 100 ticks or so re-evaulate flow analysis. This may cause some
      // edges to reverse polarity
      this.generateFlowAnalysis();
    }

    for (const edge of this.edges) {
      edge.run();
    }
  }

  /** Initialize the network from exiting Energy Node Flags */
  public initNetwork() {
    // Look up all Energy Node Flags
    let flags = this.room.find(FIND_FLAGS, {
      filter: {color: ENERGY_NODE_FLAG_COLOR},
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
    this._nodes = flags.map((flag) => new EnergyNode(flag));
    const flagNames = flags.map((flag) => flag.name);

    const newNodeHash = hashCode(flagNames.join(','));
    if (newNodeHash !== this.mem._cache?.hashKey) {
      // Nodes have changed since the last time we ran Network Analysis
      this.discardAnalysisCache();
      this.mem.nodes = flagNames;
      this.generateNetworkAnalysis();
      this.mem.edges = this.regenerateEdgesFromAnalysis(this.mem._cache!.mst);
      this.generateFlowAnalysis();
    }
    // Initilize edges from the latest Network Analysis
    this.edges = this.mem.edges.map(initNetworkEdgeByType);
  }

  /** Discards the NetworkAnlysis cache for this EnergyNetwork */
  private discardAnalysisCache() {
    delete this.mem._cache;
  }

  /**
   * Runs NetworkAnalysis on this EnergyNetwork if there is not a cached
   * version
   */
  private generateNetworkAnalysis() {
    if (!this.mem._cache) {
      this.mem._cache = analyzeEnergyNetwork(this);
    }
  }

  /**
   * Given a MST from a NetworkAnalysis, generate a list of NetworkEdgeMemory
   * objects for use in the Network.
   *
   * Assumes that NetworkAnlysis is up to date, and that all edges in the given
   * MST consitute real edges between real nodes.
   */
  private regenerateEdgesFromAnalysis(mst: EnergyNetworkAnalysis['mst']):
      NetworkEdgeMemory[] {
    for (const edge of this.mem.edges) {
      // Hack
      TransportMission.cleanup(edge.state.transportMsn);
    }
    const edges: NetworkEdgeMemory[] = [];

    for (const edge of mst) {
      const edgeName = edge.startV + '-' + edge.endV;
      const edgeMem: NetworkEdgeMemory<any> = {
        dist: edge.dist,
        flow: 0,
        name: edgeName,
        nodeA: edge.startV,
        nodeB: edge.endV,
        state: {},
        type: 'walk',
      };
      edges.push(edgeMem);
    }

    return edges;
  }

  /**
   * Iterates through the network and balances the flow, sets desired polarity
   * numbers on each node
   */
  private generateFlowAnalysis() {
    // Clear the cache by resetting the polarities
    for (const node of this.nodes) {
      node.mem._cache.netBalance = node.mem.polarity;
    }

    // Run the loop once for each edge we have.
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < this.edges.length; i++) {
      for (const edge of this.edges) {
        // For each edge, attempt to push the polarity towards the lower end
        const nodeAPol = edge.nodeA.mem._cache.netBalance;
        const nodeBPol = edge.nodeB.mem._cache.netBalance;
        if (nodeAPol > 0 && nodeAPol > nodeBPol) {
          edge.mem.flow = Math.min(nodeAPol, nodeAPol - nodeBPol);
          edge.nodeB.mem._cache.netBalance += edge.mem.flow;
        } else if (nodeBPol > 0 && nodeBPol > nodeAPol) {
          edge.mem.flow = -Math.min(nodeBPol, nodeBPol - nodeAPol);
          edge.nodeB.mem._cache.netBalance += edge.mem.flow;
        }
      }
    }
  }

  public hasSource(): boolean {
    return this.nodes.some((node) => node.mem.polarity >= 0);
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
      return edge.nodeA.flag.name === name || edge.nodeB.flag.name === name;
    });
    obsoliteEdges.forEach((edge) => edge.retire());
    this.mem.edges = this.edges.filter((edge) => !obsoliteEdges.includes(edge))
                         .map((edge) => edge.mem);
    this.discardAnalysisCache();
    return;
  }
}
