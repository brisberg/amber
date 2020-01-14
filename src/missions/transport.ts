import {ENET_DEPOSITER, ENetDepositer} from 'behaviors/eNetDepositer';
import {ENET_FETCHER, ENetFetcher} from 'behaviors/eNetFetcher';
import {IDLER} from 'behaviors/idler';
import {EnergyNode, EnergyNodeMemory} from 'energy-network/energyNode';
import {declareOrphan} from 'spawn-system/orphans';
import {SpawnReservation} from 'spawn-system/spawnQueue';
import {createWorkerBody} from 'utils/workerUtils';

interface TransportMissionMemory {
  haulers: string[];
  reservations: SpawnReservation[];
  source: EnergyNodeMemory|null;
  dest: EnergyNodeMemory|null;
  throughput: number;  // Desired throughput
  _path?: string;      // TODO: still unused
}

/**
 * Mission construct to facilitate hauling energy from a source to a
 * destination.
 *
 * This mission will coordinate requesting hauler creeps.
 */
export class TransportMission {
  private static spawnPriority = 2;

  public name: string;
  public source: EnergyNode|null = null;
  public dest: EnergyNode|null = null;

  private haulers: Creep[] = [];
  private mem: TransportMissionMemory;

  constructor(name: string) {
    this.name = name;

    // Init memory
    if (!Memory.missions[name]) {
      const mem: TransportMissionMemory = {
        dest: null,
        haulers: [],
        reservations: [],
        source: null,
        throughput: 0,
      };
      Memory.missions[name] = mem;
    }
    this.mem = Memory.missions[name] as TransportMissionMemory;

    if (this.mem.source) {
      this.source = new EnergyNode(Game.flags[this.mem.source.flag]);
    }

    if (this.mem.dest) {
      this.dest = new EnergyNode(Game.flags[this.mem.dest.flag]);
    }

    // Cache a path for the route to follow
    if (this.source && this.dest && !this.mem._path) {
      this.mem._path = Room.serializePath(
          this.source.flag.pos.findPathTo(this.dest.flag.pos));
    }

    // Purge names of dead/expired creeps
    this.mem.haulers = this.mem.haulers.filter((cName) => Game.creeps[cName]);
    this.haulers = this.mem.haulers.map((cName) => Game.creeps[cName]);
  }

  public setSource(source: EnergyNode) {
    this.mem.source = source.mem;
    this.source = source;
  }

  public setDestination(dest: EnergyNode) {
    this.mem.dest = dest.mem;
    this.dest = dest;
  }

  public setThroughput(throughput: number) {
    this.mem.throughput = throughput;
  }

  /** Executes one update tick for this mission */
  public run() {
    if (!this.source || !this.dest) {
      return;
    }

    // Check for creep allocation
    if (this.needMoreHaulers()) {
      this.requestHauler();
    }

    // Claim reserved creeps
    this.mem.reservations = this.mem.reservations.filter((reserve) => {
      const creep = Game.creeps[reserve.name];
      if (creep) {
        this.mem.haulers.push(reserve.name);
        this.haulers.push(creep);
        return false;
      }
      return true;
    });

    /**
     * If they are fetching
     *    and source is not correct, fixit
     *    and they are full, swap
     * If they are depositing
     *    and dest is wrong, fix it
     *    and they are empty, swap
     */

    // Direct each creep to pick up or dropoff
    this.haulers.forEach((creep) => {
      if (creep.memory.behavior === IDLER) {
        // Pickup newly spawned idle creeps
        creep.memory.behavior = ENET_FETCHER;
      }

      if (creep.memory.behavior === ENET_FETCHER) {
        if (ENetFetcher.getTarget(creep.memory.mem) !==
            this.source!.flag.name) {
          // Update fetch target
          creep.memory.mem = ENetFetcher.initMemory(this.source!);
        }

        if (creep.store.getFreeCapacity() === 0) {
          // Have energy, travel to destination
          creep.memory = {
            behavior: ENET_DEPOSITER,
            bodyType: 'hauler',
            mem: ENetDepositer.initMemory(this.dest!),
            mission: this.name,
          };
        }
      } else if (creep.memory.behavior === ENET_DEPOSITER) {
        if (ENetDepositer.getTarget(creep.memory.mem) !==
            this.dest!.flag.name) {
          // Update fetch target
          creep.memory.mem = ENetDepositer.initMemory(this.dest!);
        }

        if (creep.store.energy === 0) {
          if (this.tooManyHaulers()) {
            // Decommission this hauler after it has delivered its payload
            console.log('transport missions decommissioning a hauler');
            declareOrphan(creep);
            this.mem.haulers =
                this.mem.haulers.filter((name) => name !== creep.name);
          } else {
            // Fetch more energy
            creep.memory = {
              behavior: ENET_FETCHER,
              bodyType: 'hauler',
              mem: ENetFetcher.initMemory(this.source!),
              mission: this.name,
            };
          }
        }
      }
    });
  }

  /** Calculates the number of haulers required to maintain this transit line */
  private get maxhaulers() {
    const distance = this.mem._path ?.length || 10;
    // TODO: Harcoding 7 for now, this should be dependant on the size of the
    // Hauler creeps available.
    return Math.abs(this.mem.throughput) * distance / 7;
  }

  /**
   * Returns true if we need another Harvester.
   *
   * Takes into account total WORK parts of existing harvesters and max
   * harvesters from Source Analysis.
   */
  private needMoreHaulers(): boolean {
    if (this.haulers.length + this.mem.reservations.length >= this.maxhaulers) {
      return false;
    }

    return true;
  }

  /** Returns true if we have more than enough Haulers working this line. */
  private tooManyHaulers(): boolean {
    return this.haulers.length > this.maxhaulers;
  }

  private requestHauler() {
    // Request another Hauler
    const name = this.name + Game.time;
    const res = global.spawnQueue.requestCreep({
      body: this.createHaulerBody(),
      bodyType: 'hauler',
      name,
      priority: TransportMission.spawnPriority,
    });

    if (res instanceof Creep) {
      res.memory.mission = this.name;
      this.haulers.push(res);
    } else {
      this.mem.reservations.push(res);
    }
  }

  private createHaulerBody() {
    return createWorkerBody(0, 4, 2);
  }

  /**
   * Cleans up the memory associated with this missions, returns the list names
   * of orphaned creeps.
   */
  public static cleanup(name: string): string[] {
    const haulers: string[] = Memory.missions[name].haulers;
    haulers.forEach((cName) => declareOrphan(Game.creeps[cName]));
    const reservations: SpawnReservation[] = Memory.missions[name].reservations;
    reservations.forEach(
        (res) => global.spawnQueue.cancelReservation(res.name));
    delete Memory.missions[name];
    return haulers;
  }
}
