import {ENET_BUILDER, ENetBuilder} from 'behaviors/eNetBuilder';
import {IDLER, Idler} from 'behaviors/idler';
import {SOURCE_BUILDER, SourceBuilder} from 'behaviors/sourceBuilder';
import {EnergyNode, registerEnergyNode} from 'energy-network/energyNode';
import {declareOrphan} from 'spawn-system/orphans';
import {SpawnReservation} from 'spawn-system/spawnQueue';
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
  private static spawnPriority = 3;

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

  public setEnergyNode(node: EnergyNode) {
    this.eNode = node;
    this.mem.eNodeFlag = node.flag.name;
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
        if (creep.memory.behavior !== SOURCE_BUILDER) {
          creep.memory = {
            behavior: SOURCE_BUILDER,
            bodyType: 'worker',
            mem: SourceBuilder.initMemory(this.target!, this.rawSource),
            mission: this.name,
          };
        }
      }

      if (this.eNode) {
        // Gather the energy from the energy network
        if (creep.memory.behavior !== ENET_BUILDER) {
          // Get settled and start building from the network
          creep.memory = {
            behavior: ENET_BUILDER,
            bodyType: 'worker',
            mem: ENetBuilder.initMemory(this.target!, this.eNode),
            mission: this.name,
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
      bodyType: 'worker',
      name,
      priority: BuildMission.spawnPriority,
    });
    if (res instanceof Creep) {
      res.memory.mission = this.name;
      this.builders.push(res);
    } else {
      this.mem.reservations.push(res);
    }
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
    builders.forEach((cName) => declareOrphan(Game.creeps[cName]));
    delete Memory.missions[name];
    return builders;
  }
}
