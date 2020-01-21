import {EXTENSION_GROUP_A_FLAG, flagIsColor} from 'flagConstants';

enum ExtensionGroupConfig {
  ALPHA = 1,
  BETA,
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
  private static configA = [[0, 0], [0, 1], [1, 0], [1, 2], [2, 1], [2, 2]];
  private static configB = [[0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1]];
  public readonly flag: Flag;

  private readonly config: number[][];
  private readonly extensions: StructureExtension[] = [];
  private readonly sites: Array<ConstructionSite<STRUCTURE_EXTENSION>> = [];

  constructor(flag: Flag) {
    this.flag = flag;

    if (flagIsColor(flag, EXTENSION_GROUP_A_FLAG)) {
      this.config = ExtensionGroup.configA;
    } else {
      // TODO: Add an UNKNOWN failure case?
      this.config = ExtensionGroup.configB;
    }
  }

  /**
   * Initializes an ExtensionGroup from existing flags, structures, and
   * construction sites
   */
  public init(): boolean {
    if (this.flag.room) {
      const matrix = this.flag.room.lookAtArea(
          this.flag.pos.x - 1, this.flag.pos.y - 1, this.flag.pos.x + 1,
          this.flag.pos.y + 1);
      for (const pos of ExtensionGroup.configA) {
        const results = matrix[pos[0]][pos[1]];
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

  /** True if all Extensions in the group are at full capacity. */
  public isFull(): boolean {
    // TODO: cache this, but how to invalidate cache?
    return this.extensions.reduce<boolean>((full, extension) => {
      return full && extension.energy === extension.energyCapacity;
    }, true);
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
   * If any Extensions are missing, place a Construction Site and the missing
   * coordinates.
   */
  public replaceMissingExtension() {
    if ((this.extensions.length + this.sites.length) === 6) {
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
