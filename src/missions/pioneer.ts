import {PIONEER, Pioneer} from 'behaviors/pioneer';
import {CARRY_WORKER_1} from 'spawn-system/bodyTypes';

import {Mission, MissionMemory} from './mission';

interface PioneerMissionMemory extends MissionMemory {
  sourceIDs: Array<Id<Source>>;
  nextSource:
      number;  // Index of the source we should assign our next pioneer to
  controllerID: Id<StructureController>|null;
  exhaust: boolean;  // Should this mission stop requesting new creeps
}

/**
 * Pioner Mission is a general purpose bootstrapping missions for new rooms. It
 * is primarily used for rooms under RCL3.
 *
 * It will spawn a large number of Pioneer Creeps which will harvest energy
 * directly from the nodes and transport it back to the spawn.
 *
 * They will also construct Extensions and other structures.
 *
 * Finally they will Upgrade the Controller.
 *
 * The mission should be phased out once Harvesting is operational at RCL3.
 */
export class PioneerMission extends Mission<PioneerMissionMemory> {
  protected readonly spawnPriority = 0;
  protected readonly bodyType = CARRY_WORKER_1;

  private controller: StructureController|null = null;
  private sources: Source[] = [];

  constructor(flag: Flag) {
    super(flag);
  }

  protected initialMemory(): PioneerMissionMemory {
    return {
      controllerID: null,
      creeps: [],
      exhaust: false,
      nextSource: 0,
      sourceIDs: [],
    };
  }

  public init(): boolean {
    if (!this.mem.controllerID || !Game.getObjectById(this.mem.controllerID)) {
      console.log('Upgrade Mission: Controller Missing. Retiring');
      return false;
    }

    if (this.mem.sourceIDs.length === 0) {
      console.log('Pioneer Mission: Given no Sources on which to draw');
      return false;
    }

    for (const sourceId of this.mem.sourceIDs) {
      const source = Game.getObjectById(sourceId);
      if (source) {
        this.sources.push(source);
      }
    }
    if (this.sources.length !== this.mem.sourceIDs.length) {
      console.log(
          'Pioneer Mission: Could not find a source for all given sourceIDs');
      return false;
    }

    this.controller = Game.getObjectById(this.mem.controllerID);
    return true;
  }

  public setController(controller: StructureController) {
    this.controller = controller;
    this.mem.controllerID = controller.id;
  }

  public setSources(sources: Source[]) {
    this.sources = sources;
    this.mem.sourceIDs = sources.map((source) => source.id);
  }

  /** Executes one update tick for this mission */
  public run() {
    if (this.controller) {
      // Phase out at RCL3
      if (this.controller.level >= 3) {
        this.mem.exhaust = true;
      }

      // Once all creeps have expired, retire the mission
      if (this.mem.exhaust && this.creeps.length === 0) {
        this.retire();
        return;
      }

      // Direct each creep to upgrade from the sourceNode
      this.creeps.forEach((creep) => {
        if (creep.memory.behavior !== PIONEER) {
          // Upgrade controller
          creep.memory = {
            behavior: PIONEER,
            bodyType: CARRY_WORKER_1,
            mem: Pioneer.initMemory(
                this.controller!,
                this.sources[this.mem.nextSource],
                ),
            mission: this.name,
          };
          // Cycle the next index
          this.mem.nextSource = (this.mem.nextSource + 1) % this.sources.length;
        }
      });
    }
  }

  private get maxPioneers() {
    return this.sources.length * 4;
  }

  /**
   * @override
   * Returns true if we need another Pioneer.
   *
   * Stops requesting if we have exhausted. This will let the pioneers slowly
   * die off.
   */
  protected needMoreCreeps(): boolean {
    if (this.creeps.length >= this.maxPioneers) {
      return false;
    }

    if (this.mem.exhaust) {
      return false;
    }

    return true;
  }
}
