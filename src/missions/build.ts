import {EnergyNode, registerEnergyNode} from 'energy-network/energyNode';
import {SpawnReservation} from 'spawnQueue';
import {createWorkerBody} from 'utils/workerUtils';

interface BuildMissionMemory {
  builders: string[];
  reservations: SpawnReservation[];
  eNodeFlag: string|null;
  rawSourceID: Id<Source>|null;  // Only set for harvest/build missions
  targetSiteID: Id<ConstructionSite>|null;
}

/**
 * Mission construct to facilitate constructing a single building.
 *
 * This mission will coordinate requesting builder creeps, and can specify
 * several sources for the energy.
 */
export class BuildMission {
  private static spawnPriority = 1;

  public name: string;
  public room: Room|null = null;
  public target: ConstructionSite|null = null;

  private rawSource: Source|null = null;
  private eNode: EnergyNode|null = null;
  private builders: Creep[] = [];
  private mem: BuildMissionMemory;

  constructor(name: string) {
    this.name = name;

    // Init memory
    if (!Memory.missions[name]) {
      const mem: BuildMissionMemory = {
        builders: [],
        eNodeFlag: null,
        rawSourceID: null,
        reservations: [],
        targetSiteID: null,
      };
      Memory.missions[name] = mem;
    }
    this.mem = Memory.missions[name] as BuildMissionMemory;

    if (this.mem.targetSiteID) {
      const target = Game.getObjectById(this.mem.targetSiteID);
      // TODO: handle blind construction
      this.room = target ? target.room! : null;
      this.target = target;
    }

    if (this.mem.rawSourceID) {
      this.rawSource = Game.getObjectById(this.mem.rawSourceID);
    }

    if (this.mem.eNodeFlag) {
      this.eNode = new EnergyNode(Game.flags[this.mem.eNodeFlag]);
    }

    // Purge names of dead/expired creeps
    this.mem.builders = this.mem.builders.filter((cName) => Game.creeps[cName]);
    this.builders = this.mem.builders.map((cName) => Game.creeps[cName]);
  }

  public setTargetSite(target: ConstructionSite) {
    this.target = target;
    this.mem.targetSiteID = target.id;
  }

  public useRawSource(source: Source) {
    this.mem.rawSourceID = source.id;
  }

  /** Executes one update tick for this mission */
  public run() {
    if (this.mem.targetSiteID && !Game.getObjectById(this.mem.targetSiteID)) {
      // Construction complete
      // Remove this mission and deallocate all of the creeps
    }

    // Connect to Energy Network for source
    if (!this.rawSource && !this.eNode) {
      // Hack, just create the node below the target
      const flag = registerEnergyNode(
          this.room!, [this.target!.pos.x, this.target!.pos.y + 2], {
            persistant: false,
            polarity: 'sink',
            type: 'creep',
          });
      this.mem.eNodeFlag = flag.name;
      this.eNode = new EnergyNode(flag);
    }

    // Check for creep allocation
    if (this.needMoreBuilders()) {
      this.requestBuilder();
    }

    // Claim reserved creeps
    this.mem.reservations = this.mem.reservations.filter((reserve) => {
      const creep = Game.creeps[reserve.name];
      if (creep) {
        this.mem.builders.push(reserve.name);
        this.builders.push(creep);
        return false;
      }
      return true;
    });

    // Direct each creep to mine or build
    this.builders.forEach((creep) => {
      if (this.rawSource) {
        // Harvest the energy ourselves right from the source
        if (creep.memory.role === 'builder' && creep.store.energy === 0) {
          // Fetch more energy
          creep.memory = {
            role: 'miner',
            sourceID: this.rawSource.id,
          };
        } else if (
            creep.memory.role === 'miner' &&
            creep.store.getFreeCapacity() === 0) {
          // Have energy, build the structure
          creep.memory = {
            role: 'builder',
            targetSiteID: this.mem.targetSiteID!,
          };
        }
      }

      if (this.eNode) {
        // Gather the energy from the energy network
        if (creep.memory.role !== 'builder') {
          // Get settled and start building from the network
          creep.memory = {
            eNodeFlag: this.mem.eNodeFlag!,
            role: 'builder',
            targetSiteID: this.mem.targetSiteID!,
          };
        }
      }
    });
  }

  private get maxBuilders() {
    return 1;
  }

  /**
   * Returns true if we need another Harvester.
   *
   * Takes into account total WORK parts of existing harvesters and max
   * harvesters from Source Analysis.
   */
  private needMoreBuilders(): boolean {
    if (this.builders.length + this.mem.reservations.length >=
        this.maxBuilders) {
      return false;
    }

    return true;
  }

  private requestBuilder() {
    // Request another Builder
    const name = this.name + Game.time;
    const res = global.spawnQueue.requestCreep({
      body: this.createBuilderBody(),
      name,
      priority: BuildMission.spawnPriority,
    });
    this.mem.reservations.push(res);
  }

  private createBuilderBody() {
    return createWorkerBody(2, 1, 1);
  }

  /**
   * Cleans up the memory associated with this missions, returns the list names
   * of orphaned creeps.
   */
  public static cleanup(name: string): string[] {
    const builders: string[] = Memory.missions[name].builders;
    builders.forEach((cName) => delete Memory.creeps[cName]);
    delete Memory.missions[name];
    return builders;
  }
}
