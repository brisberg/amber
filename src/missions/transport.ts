import {setCreepBehavior} from 'behaviors/behavior';
import {ENET_DEPOSITER, ENetDepositer} from 'behaviors/eNetDepositer';
import {ENET_FETCHER, ENetFetcher} from 'behaviors/eNetFetcher';
import {IDLER} from 'behaviors/idler';
import {EnergyNode, EnergyNodeMemory} from 'energy-network/energyNode';
import {GenerateCreepBodyOptions, HAULER} from 'spawn-system/bodyTypes';
import {declareOrphan} from 'spawn-system/orphans';

import {Mission, MissionMemory} from './mission';

interface TransportMissionMemory extends MissionMemory {
  source: EnergyNodeMemory|null;
  buffer: number;
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
export class TransportMission extends Mission<TransportMissionMemory> {
  protected readonly spawnPriority = 3;
  protected readonly bodyType = HAULER;
  // Hack: Limited size to optimal for the longest transport lane on Prod
  protected readonly bodyOptions: GenerateCreepBodyOptions = {max: {carry: 12}};

  public source: EnergyNode|null = null;
  public dest: EnergyNode|null = null;

  constructor(flag: Flag) {
    super(flag);
  }

  /** @override */
  protected initialMemory(): TransportMissionMemory {
    return {
      buffer: 0,
      creeps: [],
      dest: null,
      source: null,
      throughput: 0,
    };
  }

  /** @override */
  public init(): boolean {
    if (!this.mem.source || !Game.flags[this.mem.source.flag]) {
      console.log(`Transport Mission ${this.name}: Could not find Source Node ${
          this.mem.source!.flag}. Retiring`);
      return false;
    }

    if (!this.mem.dest || !Game.flags[this.mem.dest.flag]) {
      console.log(`Transport Mission ${this.name}: Could not find Dest Node ${
          this.mem.dest!.flag}. Retiring`);
      return false;
    }

    this.dest = new EnergyNode(Game.flags[this.mem.dest.flag]);
    this.source = new EnergyNode(Game.flags[this.mem.source.flag]);

    // Cache a path for the route to follow
    if (!this.mem._path) {
      this.mem._path = Room.serializePath(
          this.source.flag.pos.findPathTo(this.dest.flag.pos));
    }

    return true;
  }

  public setSource(source: EnergyNode) {
    this.mem.source = source.mem;
    this.source = source;
  }

  public setBuffer(buffer: number) {
    this.mem.buffer = buffer;
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

    /**
     * If they are fetching
     *    and source is not correct, fixit
     *    and they are full, swap
     * If they are depositing
     *    and dest is wrong, fix it
     *    and they are empty, swap
     */

    // Direct each creep to pick up or dropoff
    this.creeps.forEach((creep) => {
      if (creep.memory.behavior === IDLER) {
        // Pickup newly spawned idle creeps
        creep.memory.behavior = ENET_FETCHER;
        creep.memory.mission = this.name;
      }

      if (creep.memory.behavior === ENET_FETCHER) {
        if (ENetFetcher.getTarget(creep.memory.mem) !==
            this.source!.flag.name) {
          // Update fetch target
          setCreepBehavior(
              creep,
              ENET_FETCHER,
              ENetFetcher.initMemory(this.source!, this.mem.buffer),
          );
        }

        if (creep.store.getFreeCapacity() === 0) {
          // Have energy, travel to destination
          setCreepBehavior(
              creep,
              ENET_DEPOSITER,
              ENetDepositer.initMemory(this.dest!),
          );
          creep.memory.mission = this.name;
        }
      } else if (creep.memory.behavior === ENET_DEPOSITER) {
        if (ENetDepositer.getTarget(creep.memory.mem) !==
            this.dest!.flag.name) {
          // Update fetch target
          creep.memory.mem = ENetDepositer.initMemory(this.dest!);
        }

        if (creep.store.energy === 0) {
          if ((creep.ticksToLive || 100) < 100) {
            // Decommission this hauler after it has delivered its payload
            console.log(
                'Transport ' + this.name + ' decommissioning a hauler ' +
                creep.name);
            declareOrphan(creep);
            this.mem.creeps =
                this.mem.creeps.filter((name) => name !== creep.name);
          } else {
            // Fetch more energy
            setCreepBehavior(
                creep,
                ENET_FETCHER,
                ENetFetcher.initMemory(this.source!, this.mem.buffer),
            );
            creep.memory.mission = this.name;
          }
        }
      }
    });
  }

  /**
   * Calculates the number of CARRY parts required to maintain this transit
   * line
   */
  private get maxCarryPartsForLane() {
    const path = this.mem._path;
    const distance = path ? path.length : 10;
    // TODO: Harcoding 66 for now, the static E/Tick/Cell for 4C2M Haulers
    // This should be dependant on the size of the Hauler creeps available.
    const byThroughput = (Math.abs(this.mem.throughput) * distance) / 17;
    return Math.floor(byThroughput);
  }

  /** Calculate max number of haulers for this lane */
  private get maxCongestionForLane() {
    const path = this.mem._path;
    const distance = path ? path.length : 10;
    return Math.floor(distance / 7);
  }

  /**
   * @override
   * Returns true if we need another Hauler.
   *
   * Takes into account total CARRY parts of existing haulers and max
   * hauler congestion based on lane distance.
   */
  protected needMoreCreeps(): boolean {
    const creeps = this.getYoungCreeps();
    if (creeps.length >= this.maxCongestionForLane) {
      return false;
    }

    let totalWorkParts = 0;
    for (const hauler of creeps) {
      totalWorkParts += hauler.getActiveBodyparts(CARRY);
    }
    if (totalWorkParts < this.maxCarryPartsForLane) {
      return true;
    }

    return false;
  }

  /** @override */
  /** Returns true if we REALLY need another Hauler. */
  protected needMoreCreepsCritical(): boolean {
    return this.creeps.length < 1;
  }

  /** Returns true if we have more than enough Haulers working this line. */
  private tooManyHaulers(): boolean {
    if (this.creeps.length === 1) {
      return false;
    }

    let totalWorkParts = 0;
    for (const hauler of this.creeps) {
      totalWorkParts += hauler.getActiveBodyparts(CARRY);
    }
    return totalWorkParts > this.maxCarryPartsForLane;
  }

  public static isHealthy(name: string): boolean {
    const mem = Memory.missions[name] as TransportMissionMemory;

    if (!mem) {
      return false;
    }

    if (mem.creeps.length === 0) {
      return false;
    }

    return true;
  }
}
