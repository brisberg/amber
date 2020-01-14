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
    const cache = this.mem._cache;
    if ((cache ? cache.hashKey : 0) !== newNodeHash) {
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
      if (edge.state.transportMsn) {
        TransportMission.cleanup(edge.state.transportMsn);
      }
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
   * Iterates through the network and balances the flow.
   *
   * Examines the actual energy stored in the network and sets polarity and
   * throughput on each edge to attempt to balance the network for the next
   * number of ticks.
   */
  private generateFlowAnalysis() {
    console.log('Running Network Flow Analysis...');
    // Clear the cache by resetting the projected level to the current amount
    console.log('currently have ' + this.nodes.length + ' nodes.');
    for (const node of this.nodes) {
      console.log(
          'setting ' + node.mem.flag + ' prodLevel to ' +
          node.getStoredEnergy());
      node.mem._cache.projLevel = node.getStoredEnergy();
    }

    // Run the loop once for each edge in the graph.
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < this.edges.length; i++) {
      for (const edge of this.edges) {
        // For each edge, attempt to push the polarity towards the lower end
        const nodeADiff = edge.nodeA.getExpectedSurplusOrDeficit();
        const nodeBDiff = edge.nodeB.getExpectedSurplusOrDeficit();
        console.log(
            edge.nodeA.flag.name + ': ' + nodeADiff + '. ' +
            edge.nodeB.flag.name + ': ' + nodeBDiff);
        if (nodeADiff > 0 && nodeADiff > nodeBDiff) {
          console.log('Node A has a larger surplus');
          edge.mem.flow = Math.min(nodeADiff, nodeADiff - nodeBDiff);
          edge.nodeA.mem._cache.projLevel! += edge.mem.flow;
          edge.nodeB.mem._cache.projLevel! -= edge.mem.flow;
        } else if (nodeBDiff > 0 && nodeBDiff > nodeADiff) {
          console.log('Node B has a larger surplus');
          edge.mem.flow = -Math.min(nodeBDiff, nodeBDiff - nodeADiff);
          edge.nodeB.mem._cache.projLevel! += edge.mem.flow;
          edge.nodeA.mem._cache.projLevel! -= edge.mem.flow;
        }
      }
    }
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
