import {EXTENSION_GROUP_A_FLAG, flagIsColor} from 'flagConstants';

enum ExtensionGroupConfig {
  ALPHA = 1,
  BETA,
}

export interface ExtensionGroupMemory {
  max: number;
}

/**
 * ExtensionGroup is an abstraction around a group of 6 Extension Structures.
 *
 * It provides utility methods for querying the status of the Extension Group,
 * and interacting with it as a single entity.
 *
 * This construct is used by the Spawn System for base layout, and by the
 * Distribution Mission for extension filling.
 */
export class ExtensionGroup {
  private static configA = [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, 0], [1, 1]];
  private static configB = [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0]];
  public readonly flag: Flag;

  private readonly mem: ExtensionGroupMemory;
  private readonly config: number[][];
  private readonly extensions: StructureExtension[] = [];
  private readonly sites: Array<ConstructionSite<STRUCTURE_EXTENSION>> = [];

  private maxExtensions = 6;

  constructor(flag: Flag) {
    this.flag = flag;

    if (flagIsColor(flag, EXTENSION_GROUP_A_FLAG)) {
      this.config = ExtensionGroup.configA;
    } else {
      // TODO: Add an UNKNOWN failure case?
      this.config = ExtensionGroup.configB;
    }

    // Init memory
    // TODO: Move this memory out of Memory.missions ?
    if (!Memory.missions[this.flag.name]) {
      const mem: ExtensionGroupMemory = {
        max: this.maxExtensions,
      };
      Memory.missions[this.flag.name] = mem;
    }
    this.mem = Memory.missions[this.flag.name] as ExtensionGroupMemory;
    this.maxExtensions = this.mem.max;
  }

  /**
   * Initializes an ExtensionGroup from existing flags, structures, and
   * construction sites
   */
  public init(): boolean {
    if (this.flag.room) {
      // Need to be careful about Xs and Ys with this API
      const matrix = this.flag.room.lookAtArea(
          this.flag.pos.y - 1, this.flag.pos.x - 1, this.flag.pos.y + 1,
          this.flag.pos.x + 1);
      for (const pos of this.config) {
        const results =
            matrix[this.flag.pos.y + pos[1]][this.flag.pos.x + pos[0]];
        for (const result of results) {
          if (result.structure &&
              result.structure.structureType === STRUCTURE_EXTENSION) {
            // Found an Extension
            this.extensions.push(result.structure as StructureExtension);
          } else if (
              result.constructionSite &&
              result.constructionSite.structureType === STRUCTURE_EXTENSION) {
            // Found an Extension Construction Site
            this.sites.push(
                result.constructionSite as
                ConstructionSite<STRUCTURE_EXTENSION>);
          }
        }
      }
      return true;
    } else {
      console.log('No vision of an Extension Group. Removing flag');
      return false;
    }
  }

  public setMaxExtensions(max: number) {
    this.maxExtensions = max;
  }

  /** True if all Extensions in the group are at full capacity. */
  public isFull(): boolean {
    // TODO: cache this, but how to invalidate cache?
    return this.extensions.reduce<boolean>((full, extension) => {
      return full && extension.energy === extension.energyCapacity;
    }, true);
  }

  /** Returns the total amount of energy missing from all extensions. */
  public getFreeCapacity(): number {
    // TODO: cache this, but how to invalidate cache?
    return this.extensions.reduce<number>((missing, extension) => {
      return missing + (extension.energyCapacity - extension.energy);
    }, 0);
  }

  /**
   * Return the first Extension which is not full.
   * Return null if all are full.
   */
  public getNextExtension(): StructureExtension|null {
    const extend = this.extensions.find((ex) => ex.energy < ex.energyCapacity);
    return extend || null;
  }

  /**
   * If any Extensions are missing, place a Construction Site at the missing
   * coordinates.
   */
  public replaceMissingExtension() {
    if ((this.extensions.length + this.sites.length) >= this.maxExtensions) {
      return;
    }

    this.config.forEach((offset) => {
      this.flag.room!.createConstructionSite(
          this.flag.pos.x + offset[0], this.flag.pos.y + offset[1],
          STRUCTURE_EXTENSION);
    });
  }

  public retire() {
    this.sites.forEach((site) => site.remove);
    this.flag.remove();
  }
}
