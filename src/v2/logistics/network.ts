import {Registerable} from 'v2/registry/registerable';
import {Request} from './request';
import TransportMsn from 'v2/missions/logistics/transport.msn';
import {RoutePlan, newEmptyRoutePlan, appendRequestToPlan} from './route-plan';

export interface NetworkMemory {
  requests: {[id: number]: Request};
  transportMsn: string|null;
  plans: {[creepname: string]: RoutePlan};
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
  private haulers: Creep[] = [];
  private transportMsn: TransportMsn|null = null;

  constructor(public name: string) {
    this.mem = getMemory(this);
    if (this.mem === undefined) {
      // No existing memory, initialize default
      this.mem = {
        requests: {},
        transportMsn: null,
        plans: {},
      };
      setMemory(this, this.mem);
    }
  }

  private get requests() {
    return this.mem.requests;
  }

  public getPlan(creep: Creep): RoutePlan|null {
    return this.mem.plans[creep.name] || null;
  }

  public getRequest(requestId: number): Request|undefined {
    return this.requests[requestId];
  }

  refresh(): void {
    if (this.mem.transportMsn) {
      const msn = global.msnRegistry.get(this.mem.transportMsn) as TransportMsn;
      if (msn) {
        this.transportMsn = msn;
        this.haulers = this.transportMsn.getHaulers();
      }
    }
  }

  /** Hack to distribute requests sequentially across Haulers */
  private nextHauler = 0;

  /** Register a new Logistics.Request with the Network */
  public register(request: Request): void {
    // TODO: Validate the request
    this.requests[request.id] = request;

    // TODO: Calculate temporally closest creep
    const creep = this.haulers[this.nextHauler];
    this.nextHauler = (this.nextHauler + 1) % this.haulers.length;

    // TODO: Append it to their plan
    const plan = this.mem.plans[creep.name];
    appendRequestToPlan(plan, request);
  }

  public run(): void {
    if (!this.mem.transportMsn) {
      // launch TransportMsn
      const msn = new TransportMsn(`${this.name}-tsp`);
      msn.init(this.name, {
        throughput: this.throughput,
      });
      global.msnRegistry.register(msn);
      this.transportMsn = msn;
      this.mem.transportMsn = msn.name;
    }

    // Prune old Plans, add empty plans for new Haulers
    const plans: {[creepname: string]: RoutePlan} = {};
    for (const creep of this.haulers) {
      const name = creep.name;
      plans[name] = this.mem.plans[name] || newEmptyRoutePlan(creep);
    }
    this.mem.plans = plans;
  }
}

/** Helper to fetch the Memory of a Logistics.Network */
export function getMemory(network: Network): NetworkMemory {
  return Memory.networks[network.name];
}

/** Helper to set the Memory of a Logistics.Network */
export function setMemory(
  network: Network, memory: NetworkMemory): NetworkMemory {
  return Memory.networks[network.name] = memory;
}
