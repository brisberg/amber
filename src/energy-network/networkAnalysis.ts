import {hashCode} from 'utils/hash';

import {RoomEnergyNetwork} from './roomEnergyNetwork';

/**
 * Analysis result of Analyzing the optimal network topology of a set of Energy
 * Nodes
 */
export interface EnergyNetworkAnalysis {
  mst: Edge[];
  // Hash of the names of the nodes used to compute this analysis
  hashKey: number;
}

interface Edge {
  startV: string;
  endV: string;
  dist: number;
}

/** Cost mapping between two verticies: [A][B] = Cost */
interface AdjacencyMatrix {
  [vertexA: string]: {[vertexB: string]: number};
}

function calculateCostMatrix(network: RoomEnergyNetwork): AdjacencyMatrix {
  const matrix: AdjacencyMatrix = {};

  const numNodes = network.nodes.length;
  for (let i = 0; i < numNodes; i++) {
    const vertexA = network.nodes[i];
    if (!matrix[vertexA.flag.name]) {
      matrix[vertexA.flag.name] = {};
    }
    for (let j = 0; j < numNodes; j++) {
      const vertexB = network.nodes[j];
      if (!matrix[vertexB.flag.name]) {
        matrix[vertexB.flag.name] = {};
      }

      const path = vertexA.flag.pos.findPathTo(vertexB.flag.pos, {
        ignoreCreeps: true,
        maxRooms: 1,
        swampCost: 2,
      });
      const cost = path.length;

      matrix[vertexA.flag.name][vertexB.flag.name] = cost;
      matrix[vertexB.flag.name][vertexA.flag.name] = cost;
    }
  }

  return matrix;
}


/**
 * Analyzes an EnergyNetwork and returns an analysis of the optimal transport
 * paths to connect the network.
 *
 * Used Prim's Minimum Spanning Tree algorithm. Currently an ineificcient
 * implementation as it could use a Heap based priority queue.
 */
export function analyzeEnergyNetwork(network: RoomEnergyNetwork):
    EnergyNetworkAnalysis {
  // Need atleast 2 nodes to make a MST
  const hashKey =
      hashCode(network.nodes.map((node) => node.flag.name).join(','));
  if (network.nodes.length < 2) {
    return {hashKey, mst: []};
  }

  const costMatrix: AdjacencyMatrix = calculateCostMatrix(network);
  const mst: Edge[] = [];
  const visitedVerts: {[name: string]: boolean} = {};
  const startVertex = network.nodes[0];
  const startV = startVertex.flag.name;
  const edgeQueue: Edge[] = [];  // TODO: Upgrade to a heap based priority queue
  visitedVerts[startV] = true;
  for (const vertexB in costMatrix[startV]) {
    if ({}.hasOwnProperty.call(costMatrix[startV], vertexB)) {
      edgeQueue.push({
        dist: costMatrix[startV][vertexB],
        endV: vertexB,
        startV,
      });
    }
  }
  edgeQueue.sort((a, b) => a.dist - b.dist);

  while (edgeQueue.length > 0) {
    const nextEdge = edgeQueue.shift();

    if (!nextEdge) {
      break;
    }

    // Find out the next unvisited minimal vertex to traverse.
    let nextMinVertex = null;
    if (!visitedVerts[nextEdge.startV]) {
      nextMinVertex = nextEdge.startV;
    } else if (!visitedVerts[nextEdge.endV]) {
      nextMinVertex = nextEdge.endV;
    }

    // If all vertices of current edge has been already visited then skip this
    // round.
    if (nextMinVertex) {
      // Add current min edge to MST.
      mst.push(nextEdge);

      // Add vertex to the set of visited ones.
      visitedVerts[nextMinVertex] = true;

      for (const vertexB in costMatrix[nextMinVertex]) {
        if ({}.hasOwnProperty.call(costMatrix[startV], vertexB)) {
          if (!visitedVerts[vertexB]) {
            edgeQueue.push({
              dist: costMatrix[nextMinVertex][vertexB],
              endV: vertexB,
              startV: nextMinVertex,
            });
          }
          edgeQueue.sort((a, b) => a.dist - b.dist);
        }
      }
    }
  }

  return {
    hashKey,
    mst,
  };
}
