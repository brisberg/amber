import {setCreepBehavior} from 'behaviors/behavior';
import {PIONEER, Pioneer} from 'behaviors/pioneer';
import {CARRY_WORKER} from 'spawn-system/bodyTypes';

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
 *
 * Idea: Once we have Critical vs Performance spawning, we should be able to
 * report we should be able to report if the Colony is "Operation" or not
 * (meaning that basic harvesting / transport / distribution is possible).
 *
 * Once the colony is operational, we can have the Pioneer Mission exhaust by
 * recycling all of its creeps. This will require changes to the distributor to
 * pick up energy left around the spawn.
 *
 * Another posibility is to move the Core Container to be next to the spawn as a
 * Drop Pan. When the storge is constructed later we can remove and relocate the
 * Energy Network to the Storage.
 */
export class PioneerMission extends Mission<PioneerMissionMemory> {
  protected readonly spawnPriority = 0;
  protected readonly bodyType = CARRY_WORKER;
  protected readonly bodyOptions = {max: {work: 1, carry: 1, move: 2}};

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
      // Phase out at RCL2. Pioneers will survive long enough for
      // mining/transport to be up.
      // if (this.controller.level >= 2) {
      //   this.mem.exhaust = true;
      // }

      // Phase out once we have built 6. These should live long enough to get
      // initial spawning of harvesters and transporters up and running.
      if (this.creeps.length === this.maxPioneers) {
        this.mem.exhaust = true;
      }

      // Once all creeps have expired, retire the mission
      if (this.mem.exhaust && this.creeps.length === 0) {
        this.retire();
        return;
      }

      // Direct each creep to act as a pioneer
      this.creeps.forEach((creep) => {
        if (creep.memory.behavior !== PIONEER) {
          // Become a Pioneer!
          setCreepBehavior(
              creep,
              PIONEER,
              Pioneer.initMemory(
                  this.controller!,
                  this.sources[this.mem.nextSource],
                  ),
          );
          creep.memory.mission = this.name;

          // Cycle the next index
          this.mem.nextSource = (this.mem.nextSource + 1) % this.sources.length;
        }
      });
    }
  }

  private get maxPioneers() {
    return this.sources.length * 2;
  }

  /**
   * @override
   * Returns true if we need another Pioneer.
   *
   * Stops requesting if we have exhausted. This will let the pioneers slowly
   * die off.
   */
  protected needMoreCreeps(): boolean {
    if (this.getYoungCreeps().length >= this.maxPioneers) {
      return false;
    }

    if (this.mem.exhaust) {
      return false;
    }

    return true;
  }

  /** @override */
  /** This mission is never critical */
  protected needMoreCreepsCritical(): boolean {
    return false;
  }
}
