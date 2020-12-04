/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {setCreepBehavior} from 'behaviors/behavior';
import {
  CONTAINER_UPGRADER,
  ContainerUpgrader,
} from 'behaviors/containerUpgrader';
import {
  LINK_UPGRADER,
  LinkUpgrader,
} from 'behaviors/linkUpgrader';
import {
  GenerateCreepBodyOptions,
  WORKER,
  zeroRatio,
} from 'spawn-system/bodyTypes';

import {Mission, MissionMemory} from '../mission';

interface UpgradeMissionMemory extends MissionMemory {
  containerID: Id<StructureContainer>|null;
  controllerID: Id<StructureController>|null;
  linkID: Id<StructureLink>|null;
}

/**
 * Mission construct to facilitate upgrading a single Room Controller.
 *
 * Requires an appropriate Container to exist near the Controller.
 *
 * This mission will coordinate requesting upgrader creeps.
 */
export class UpgradeMission extends Mission<UpgradeMissionMemory> {
  protected readonly spawnPriority = 5;
  protected readonly bodyType = WORKER;
  protected readonly bodyOptions: GenerateCreepBodyOptions = {
    max: {work: 16},
    min: {...zeroRatio, carry: 1},
  };

  private container: StructureContainer|null = null;
  private controller: StructureController|null = null;
  private link: StructureLink|null = null;

  constructor(flag: Flag) {
    super(flag);
  }

  protected initialMemory(): UpgradeMissionMemory {
    return {
      containerID: null,
      controllerID: null,
      linkID: null,
      creeps: [],
    };
  }

  public init(): boolean {
    if (!this.mem.linkID && !this.mem.containerID) return false;

    if (this.mem.linkID && !Game.getObjectById(this.mem.linkID)) {
      console.log('Upgrade Mission: Link Missing. Retiring');
      return false;
    } else if (
        this.mem.containerID && !Game.getObjectById(this.mem.containerID)) {
      console.log('Upgrade Mission: Container Missing. Retiring');
      return false;
    }

    if (!this.mem.controllerID || !Game.getObjectById(this.mem.controllerID)) {
      console.log('Upgrade Mission: Controller Missing. Retiring');
      return false;
    }

    // TODO: Unify this with container portion
    if (this.mem.linkID) {
      this.link = Game.getObjectById(this.mem.linkID);
    }
    if (this.mem.containerID) {
      this.container = Game.getObjectById(this.mem.containerID);
    }
    this.controller = Game.getObjectById(this.mem.controllerID);
    return true;
  }

  public setController(controller: StructureController): void {
    this.controller = controller;
    this.mem.controllerID = controller.id;
  }

  public setContainer(container: StructureContainer): void {
    this.container = container;
    this.mem.containerID = container.id;
  }

  public setLink(link: StructureLink): void {
    this.link = link;
    this.mem.linkID = link.id;
  }

  /** Executes one update tick for this mission */
  public run(): void {
    if (this.mem.controllerID && !Game.getObjectById(this.mem.controllerID)) {
      // Construction complete
      // Remove this mission and deallocate all of the creeps
    }

    if ((this.container || this.link) && this.controller) {
      // TODO: Unify this with container upgrade path
      if (this.link) {
        // Direct each creep to upgrade from the link
        this.creeps.forEach((creep) => {
          if (creep.memory.behavior !== LINK_UPGRADER) {
            // Upgrade controller
            setCreepBehavior(
                creep,
                LINK_UPGRADER,
                LinkUpgrader.initMemory(
                    this.controller!,
                    this.link!,
                    ),
            );
            creep.memory.mission = this.name;
          }
        });
      } else {
        // Direct each creep to upgrade from the container
        this.creeps.forEach((creep) => {
          if (creep.memory.behavior !== CONTAINER_UPGRADER) {
            // Upgrade controller
            setCreepBehavior(
                creep,
                CONTAINER_UPGRADER,
                ContainerUpgrader.initMemory(
                    this.controller!,
                    this.container!,
                    ),
            );
            creep.memory.mission = this.name;
          }
        });
      }
    }
  }

  private get maxUpgraders(): number {
    return 6;
  }

  /**
   * @override
   * Returns true if we need another Upgrader.
   *
   * Takes into account total WORK parts of existing upgraders.
   */
  protected needMoreCreeps(): boolean {
    const creeps = this.getYoungCreeps();
    if (creeps.length >= this.maxUpgraders) {
      return false;
    }

    let totalWorkParts = 0;
    for (const upgrader of creeps) {
      totalWorkParts += upgrader.getActiveBodyparts(WORK);
    }
    if (totalWorkParts >= 15) {
      return false;
    }

    return true;
  }

  /** @override */
  /** This mission is never critical. */
  protected needMoreCreepsCritical(): boolean {
    return false;
  }
}
