import {Registerable} from 'v2/registry/registerable';
import {Request} from './request';

export interface NetworkMemory {
  requests: Request[];
  transportMsn: string;
}

/**
 * The Logistics network is the subsystem coordinating Hauler creeps to move
 * Resources around the room.
 *
 * Other systems and Operations will register LogisticsRequests with the system,
 * saving their details to memory. The Network will maintain a set of Hauler
 * creeps which will fulfil each request as best they can.
 *
 * For now, there will be a single network for each Owned Room.
 */
export default class Network implements Registerable {
  private mem: NetworkMemory;
  /**
   * Total throughput required by the logistics system
   * TODO: Replace this with a calculation based on Requests
   */
  private throughput = 20;

  constructor(public name: string) {}

  refresh(): void {
    throw new Error('Method not implemented.');
  }

  public run(): void {
    if (!this.mem.transportMsn) {
      // launch TransportMsn
    }
  }
}

/** Helper to fetch the Memory of a Logistics.Network */
export function getMemory(network: Network): NetworkMemory {
  return Memory.rooms[network.name].network;
}
