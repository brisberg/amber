import {RoomEnergyNetwork} from './roomEnergyNetwork';

export interface EnergyNetworkAnalysis {
  mst: Edge[];
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

/**
 * Analyzes an EnergyNetwork and returns an analysis of the optimal transport
 * paths to connect the network.
 *
 * Used Prim's Minimum Spanning Tree algorithm. Currently an ineificcient
 * implementation as it could use a Heap based priority queue.
 */
export function analyzeEnergyNetwork(network: RoomEnergyNetwork) {
  // Need atleast 2 nodes to make a MST
  if (network.nodes.length < 2) {
    return {mst: []};
  }

  const costMatrix: AdjacencyMatrix = calculateCostMatrix(network);
  const mst: Edge[] = [];
  const visitedVerts: {[name: string]: boolean} = {};
  const startVertex = network.nodes[0];
  const startV = startVertex.flag.name;
  const edgeQueue: Edge[] = [];  // TODO: Upgrade to a heap based priority queue
  visitedVerts[startV] = true;
  for (const vertexB in costMatrix[startV]) {
    edgeQueue.push({
      dist: costMatrix[startV][vertexB],
      endV: vertexB,
      startV,
    });
  }
  edgeQueue.sort((a, b) => b.dist - a.dist);

  while (mst.length < network.nodes.length - 1) {
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

      for (const vertexB in costMatrix[nextEdge.endV]) {
        if (!visitedVerts[vertexB]) {
          edgeQueue.push({
            dist: costMatrix[startV][vertexB],
            endV: vertexB,
            startV: nextEdge.endV,
          });
        }
        edgeQueue.sort((a, b) => b.dist - a.dist);
      }
    }
  }

  return {mst};
}

function calculateCostMatrix(network: RoomEnergyNetwork): AdjacencyMatrix {
  const matrix: AdjacencyMatrix = {};

  const numNodes = network.nodes.length;
  for (let i = 0; i < numNodes; i++) {
    const vertexA = network.nodes[i];
    matrix[vertexA.flag.name] = {};
    for (let j = 0; j < numNodes - i; j++) {
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
