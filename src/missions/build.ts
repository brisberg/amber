import {ENET_BUILDER, ENetBuilder} from 'behaviors/eNetBuilder';
import {SOURCE_BUILDER, SourceBuilder} from 'behaviors/sourceBuilder';
import {EnergyNode} from 'energy-network/energyNode';
import {WORKER_1} from 'spawn-system/bodyTypes';

import {Mission, MissionMemory} from './mission';

interface BuildMissionMemory extends MissionMemory {
  maxBuilders: number;
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
export class BuildMission extends Mission<BuildMissionMemory> {
  protected readonly spawnPriority = 4;
  protected readonly bodyType = WORKER_1;

  public target: ConstructionSite|null = null;

  private rawSource: Source|null = null;
  private eNode: EnergyNode|null = null;

  constructor(flag: Flag) {
    super(flag);
  }

  /** @override */
  public init(): boolean {
    if (!this.mem.targetSiteID || !Game.getObjectById(this.mem.targetSiteID)) {
      return false;
    }

    if (this.mem.rawSourceID) {
      const source = Game.getObjectById(this.mem.rawSourceID);
      if (source) {
        this.rawSource = Game.getObjectById(this.mem.rawSourceID);
      } else {
        this.mem.rawSourceID = null;
      }
    }

    if (this.mem.eNodeFlag) {
      const flag = Game.flags[this.mem.eNodeFlag];
      if (flag) {
        this.eNode = new EnergyNode(flag);
      } else {
        this.mem.eNodeFlag = null;
      }
    }

    if (!this.eNode && !this.rawSource) {
      return false;
    }

    const target = Game.getObjectById(this.mem.targetSiteID);
    this.target = target;

    return true;
  }

  /** @override */
  protected initialMemory(): BuildMissionMemory {
    return {
      creeps: [],
      eNodeFlag: null,
      maxBuilders: 1,
      rawSourceID: null,
      targetSiteID: null,
    };
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

  public setMaxBuilders(max: number) {
    this.mem.maxBuilders = max;
  }

  /** @override */
  /** Executes one update tick for this mission */
  public run() {
    // Direct each creep to mine or build
    this.creeps.forEach((creep) => {
      if (this.rawSource) {
        // Harvest the energy ourselves right from the source
        if (creep.memory.behavior !== SOURCE_BUILDER) {
          console.log('setting ' + creep.name + ' memory to SourceBuilder');
          creep.memory = {
            ...creep.memory,
            behavior: SOURCE_BUILDER,
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
            ...creep.memory,
            behavior: ENET_BUILDER,
            mem: ENetBuilder.initMemory(this.target!, this.eNode),
            mission: this.name,
          };
        }
      }
    });
  }

  private get maxBuilders() {
    return this.mem.maxBuilders;
  }

  /** @override */
  /** Returns true if we need another Builder. */
  protected needMoreCreeps(): boolean {
    if (this.creeps.length >= this.maxBuilders) {
      return false;
    }

    return true;
  }

  /** @override */
  /** Returns true if we REALLY need another Builder. */
  protected needMoreCreepsCritical(): boolean {
    return this.creeps.length < 1;
  }
}
