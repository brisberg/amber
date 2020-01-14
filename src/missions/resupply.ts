import {ENET_DEPOSITER, ENetDepositer} from 'behaviors/eNetDepositer';
import {ENET_FETCHER, ENetFetcher} from 'behaviors/eNetFetcher';
import {IDLER} from 'behaviors/idler';
import {EnergyNode, EnergyNodeMemory} from 'energy-network/energyNode';
import {HAULER_1} from 'spawn-system/bodyTypes';
import {declareOrphan} from 'spawn-system/orphans';

interface ResupplyMissionMemory {
  haulers: string[];
  nextCreep?: string;
  source: EnergyNodeMemory|null;
  dest: EnergyNodeMemory|null;
  throughput: number;  // Desired throughput
  _path?: string;      // TODO: still unused
}

/**
 * Mission construct to facilitate hauling energy from an Energy Node to a
 * creep handoff Energy Node.
 *
 * This mission will coordinate requesting hauler creeps.
 */
export class ResupplyMission {
  private static spawnPriority = 2;
  private static maxHaulers = 2;

  public name: string;
  public source: EnergyNode|null = null;
  public dest: EnergyNode|null = null;

  private haulers: Creep[] = [];
  private mem: ResupplyMissionMemory;

  constructor(name: string) {
    this.name = name;

    // Init memory
    if (!Memory.missions[name]) {
      const mem: ResupplyMissionMemory = {
        dest: null,
        haulers: [],
        source: null,
        throughput: 0,
      };
      Memory.missions[name] = mem;
    }
    this.mem = Memory.missions[name] as ResupplyMissionMemory;

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

    // Claim reserved creep if it exists
    if (this.mem.nextCreep && Game.creeps[this.mem.nextCreep]) {
      const hauler = Game.creeps[this.mem.nextCreep];
      this.mem.haulers.push(hauler.name);
      this.haulers.push(hauler);
      delete this.mem.nextCreep;
    } else {
      // Oh well, it wasn't spawned afterall
      delete this.mem.nextCreep;
    }

    // Check for creep allocation
    if (this.needMoreHaulers()) {
      this.requestHauler();
    }

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
            bodyType: HAULER_1,
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
          // Fetch more energy
          creep.memory = {
            behavior: ENET_FETCHER,
            bodyType: HAULER_1,
            mem: ENetFetcher.initMemory(this.source!),
            mission: this.name,
          };
        }
      }
    });
  }

  /**
   * Returns true if we need another Harvester.
   *
   * Takes into account total WORK parts of existing harvesters and max
   * harvesters from Source Analysis.
   */
  private needMoreHaulers(): boolean {
    if (this.haulers.length < ResupplyMission.maxHaulers) {
      return true;
    }

    return false;
  }

  private requestHauler() {
    // Request another Hauler
    this.mem.nextCreep = global.spawnQueue.requestCreep({
      bodyType: HAULER_1,
      mission: this.name,
      priority: ResupplyMission.spawnPriority,
    });
  }

  /**
   * Cleans up the memory associated with this missions, returns the list names
   * of orphaned creeps.
   */
  public static cleanup(name: string): string[] {
    const haulers: string[] = Memory.missions[name].haulers;
    haulers.forEach((cName) => declareOrphan(Game.creeps[cName]));
    delete Memory.missions[name];
    return haulers;
  }
}
