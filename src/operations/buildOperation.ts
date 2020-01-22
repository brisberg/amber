import {EnergyNode, registerEnergyNode, unregisterEnergyNode} from '../energy-network/energyNode';
// tslint:disable-next-line: max-line-length
import {CORE_ENERGY_NODE_FLAG, ENERGY_NODE_FLAG, SOURCE_BUILD_TARGET_FLAG, TEMP_ENERGY_NODE_FLAG, TRANSPORT_MISSION_FLAG} from '../flagConstants';
import {BuildMission} from '../missions/build';
import {TransportMission} from '../missions/transport';

/**
 * Building Operation
 *
 * This Operation will facilitate construction of a single structure.
 *
 * It will perform ConstructionAnalysis on a ConstructionSite, designate where
 * the energy should come from. It will decide if it should run a transport
 * missions to supply the builders or if the builders should scavenge
 * themselves.
 *
 * Retires itself when the construction is complete.
 */

export interface BuildOperationMemory {
  buildMsn: string|null;
  handoffFlag: string|null;  // Used by transport mission
  transportMsn: string|null;
  targetSiteID: Id<ConstructionSite>|null;
  eNodeFlag: string|null;     // Cached Energy Node as Operation source
  sourceID: Id<Source>|null;  // Cached ID of a raw Source
}

export class BuildOperation {
  public readonly name: string;

  private readonly flag: Flag;
  private readonly room: Room|undefined;
  private readonly mem: BuildOperationMemory;

  private target: ConstructionSite|null = null;
  private buildMsn: BuildMission|null = null;
  private transportMsn: TransportMission|null = null;
  private node: EnergyNode|null = null;
  private handoff: EnergyNode|null = null;
  private source: Source|null = null;

  constructor(flag: Flag) {
    this.name = flag.name;
    this.flag = flag;
    this.room = flag.room;

    // Init memory
    if (!Memory.operations[this.name]) {
      const mem: BuildOperationMemory = {
        buildMsn: null,
        eNodeFlag: null,
        handoffFlag: null,
        sourceID: null,
        targetSiteID: null,
        transportMsn: null,
      };
      Memory.operations[this.name] = mem;
    }
    this.mem = Memory.operations[this.name] as BuildOperationMemory;
  }

  public init(): boolean {
    // Validate missions cache
    if (this.mem.buildMsn) {
      if (!Game.flags[this.mem.buildMsn]) {
        this.mem.buildMsn = null;
      } else {
        this.buildMsn = new BuildMission(Game.flags[this.mem.buildMsn]);
      }
    }
    if (this.mem.transportMsn) {
      if (!Game.flags[this.mem.transportMsn]) {
        this.mem.transportMsn = null;
        console.log(
            'Build Operation: Transport mission flag not found. Clearing it');
      } else {
        this.transportMsn =
            new TransportMission(Game.flags[this.mem.transportMsn]);
      }
    }

    // Validate ENode cache. Non blocking as we can look for a new one
    if (this.mem.eNodeFlag) {
      const flag = Game.flags[this.mem.eNodeFlag];
      if (!flag) {
        console.log('Build Operation: ENode no longer exists. Clearing cache.');
        this.mem.eNodeFlag = null;
      } else {
        this.node = new EnergyNode(flag);
      }
    }

    // Validate Handoff ENode cache. Non blocking as we can register a new one
    if (this.mem.handoffFlag) {
      const flag = Game.flags[this.mem.handoffFlag];
      if (!flag) {
        console.log(
            'Build Operation: Handoff ENode no longer exists. Clearing cache.');
        this.mem.handoffFlag = null;
      } else {
        this.handoff = new EnergyNode(flag);
      }
    }

    // Validate Source cache. Non blocking as we can look for a new one
    if (this.mem.sourceID) {
      const source = Game.getObjectById(this.mem.sourceID);
      // TODO: Add a range=1 check here to limit it to direct sources
      if (!source) {
        console.log(
            'Build Operation: Raw Source no longer exists. Clearing cache.');
        this.mem.sourceID = null;
      } else {
        this.source = source;
      }
    }

    if (!this.node && !this.source) {
      // Search for the closest Energy node or Source
      // First look for an adjacent source to harvest from directly
      const source = this.flag.pos.findClosestByPath(FIND_SOURCES);
      if (!source || !this.flag.pos.isNearTo(source)) {
        // No Source, look for Core Energy Node first
        const coreNode = this.flag.pos.findClosestByPath(
            FIND_FLAGS, {filter: CORE_ENERGY_NODE_FLAG});

        if (!coreNode) {
          // No Core Not Yet, Look for a fringe Energy Node
          const eNode = this.flag.pos.findClosestByPath(
              FIND_FLAGS, {filter: ENERGY_NODE_FLAG});

          if (!eNode) {
            console.log(
                'Build Operation could not find an Energy Node or Source to draw from');
            return false;
          } else {
            // Drawing from Fringe Node
            this.node = new EnergyNode(eNode);
            this.mem.eNodeFlag = eNode.name;
          }
        } else {
          // Drawing from Core Node
          this.node = new EnergyNode(coreNode);
          this.mem.eNodeFlag = coreNode.name;
        }
      } else {
        // Drawing from Source
        this.source = source;
        this.mem.sourceID = source.id;
      }
    }

    // Validate the status of our specific site
    if (this.mem.targetSiteID) {
      const target = Game.getObjectById(this.mem.targetSiteID);
      if (!target) {
        console.log(
            'Build Operation: ConstructionSite no longer exists. Retiring');
        return false;
      } else {
        this.target = target;
        return true;
      }
    }

    // No specific site in memory, lets look for one at the flag
    const sites = this.flag.pos.lookFor(LOOK_CONSTRUCTION_SITES);
    if (sites.length === 0) {
      console.log(
          'Build Operation: No construction sites at target location. Retiring');
      return false;
    }

    this.target = sites[0];
    this.mem.targetSiteID = this.target.id;
    return true;
  }

  public run() {
    if (!this.target) {
      return;
    }

    if (this.source) {
      if (!this.mem.buildMsn) {
        this.buildMsn = this.setUpBuildMission(this.name + '_build');
        this.buildMsn.useRawSource(this.source);
        this.buildMsn.setTargetSite(this.target);
        this.buildMsn.setMaxBuilders(2);
      }
    } else if (this.node) {
      // Special case for construction sites close to spawn
      if (this.node.flag.pos.inRangeTo(
              this.target.pos.x, this.target.pos.y, 6)) {
        if (!this.mem.buildMsn) {
          // Set up the build mission to construct the structure
          this.buildMsn = this.setUpBuildMission(this.name + '_build');
          this.buildMsn.setTargetSite(this.target);
          this.buildMsn.setEnergyNode(this.node);
          this.buildMsn.setMaxBuilders(2);
          this.mem.buildMsn = this.buildMsn.name;
        }
      } else {
        // Energy node is far, use a Handoff point
        if (!this.handoff) {
          // We don't have a midway handoff, lets create one
          const path = this.node.flag.pos.findPathTo(this.target);
          const dropPoint =
              path[path.length - 3];  // Handoff two steps from target
          const flag = registerEnergyNode(
              this.room!,
              [dropPoint.x, dropPoint.y],
              {
                color: TEMP_ENERGY_NODE_FLAG,
                persistant: false,
                polarity: -10,
                type: 'creep',
              },
          );
          this.mem.handoffFlag = flag.name;
          const handoffFlag = Game.flags[this.mem.handoffFlag];
          this.handoff = new EnergyNode(handoffFlag);
        }

        if (!this.mem.buildMsn) {
          // Set up the build mission to construct the structure
          this.buildMsn = this.setUpBuildMission(this.name + '_build');
          this.buildMsn.setTargetSite(this.target);
          this.buildMsn.setEnergyNode(this.handoff);
          this.buildMsn.setMaxBuilders(3);
          this.mem.buildMsn = this.buildMsn.name;
        }

        if (!this.mem.transportMsn) {
          // Set up a transport mission to bring energy to us
          const transportMsn =
              this.setUpTransportMission(this.name + '_supply');
          transportMsn.setSource(this.node);
          transportMsn.setDestination(this.handoff);
          transportMsn.setThroughput(6);
          transportMsn.init();
          this.mem.transportMsn = transportMsn.name;
        }
      }
    }
  }

  private setUpBuildMission(name: string) {
    this.target!.pos.createFlag(
        name, SOURCE_BUILD_TARGET_FLAG.color,
        SOURCE_BUILD_TARGET_FLAG.secondaryColor);
    const flag = Game.flags[name];
    return new BuildMission(flag);
  }

  private setUpTransportMission(name: string) {
    this.target!.pos.createFlag(
        name, TRANSPORT_MISSION_FLAG.color,
        TRANSPORT_MISSION_FLAG.secondaryColor);
    const flag = Game.flags[name];
    return new TransportMission(flag);
  }

  public setTargetSite(site: ConstructionSite) {
    this.target = site;
    this.mem.targetSiteID = site.id;
  }

  public retire() {
    console.log('Retiring buildOp: ' + this.name);
    if (this.buildMsn) {
      this.buildMsn.retire();
    }
    if (this.transportMsn) {
      this.transportMsn.retire();
    }
    if (this.mem.handoffFlag) {
      const flag = Game.flags[this.mem.handoffFlag];
      unregisterEnergyNode(flag);
    }
    this.flag.remove();
    delete Memory.operations[this.name];
  }
}
