import {layout} from './townSquareLayout';

/**
 * TownSquare is an abstraction around the core group of structures which make
 * up the heart of a base.
 *
 * The Square is a 6x7 layout, centered around the Storage in the center of
 * town. It includes all three spawns, and the Storage, Link, Terminal, Factory,
 * and Power Spawn centrally located so they can be exchanged by a single
 * transfer creep.
 *
 * The 6x7 Layout is like so:
 *
 *  `-`: Road, `S`: Spawn, `G`: Storage, `L`: Link, `F`: Factory, `T`: Terminal,
 * `P`: Power Spawn, `C`: Operator Creep, `R`: Tower
 *
 *  -  R  -  -  -  R  -
 *  R  -  -  F  L  -  R
 *  -  -  P  C  T  -  -
 *  R  -  -  G  -  -  R
 *  -  S  -  -  -  S  -
 *    -  -  S  -  -
 *
 * This construct is used by the Spawn System for base layout, and by the
 * Distribution Mission for resource transfers.
 */
export class TownSquare {
  private static config = layout;
  public readonly flag: Flag;

  private readonly structs: Structure[] = [];
  private readonly sites: Array<ConstructionSite<BuildableStructureConstant>> =
      [];

  constructor(flag: Flag) {
    this.flag = flag;
  }

  /**
   * Initializes an TownSquare from existing flags, structures, and
   * construction sites
   */
  public init(): boolean {
    if (this.flag.room) {
      // Need to be careful about Xs and Ys with this API
      const matrix = this.flag.room.lookAtArea(
          this.flag.pos.y - 3, this.flag.pos.x - 3, this.flag.pos.y + 2,
          this.flag.pos.x + 3);
      for (let y = -3; y <= 2; y++) {
        for (let x = -3; x <= 3; x++) {
          const results = matrix[this.flag.pos.y + y][this.flag.pos.x + x];
          for (const result of results) {
            if (result.structure &&
                result.structure.structureType ===
                    TownSquare.config[y + 3][x + 3]) {
              // Found the expected structure
              this.structs.push(result.structure);
              // TODO: validate it is the correct structure?
            } else if (
                result.constructionSite &&
                result.constructionSite.structureType ===
                    TownSquare.config[y + 3][x + 3]) {
              // Found the expected Construction Site
              this.sites.push(result.constructionSite);
            }
          }
        }
      }
      return true;
    } else {
      console.log('No vision of a TownSquare. Removing flag');
      return false;
    }
  }

  /**
   * If any Structures are missing, place a Construction Site at the missing
   * coordinates.
   */
  public replaceMissingStructures() {
    if ((this.structs.length + this.sites.length) >= 42) {  // 6x7
      return;
    }

    let spawns = 0;
    const maxSpawns =
        CONTROLLER_STRUCTURES.spawn[this.flag.room!.controller!.level];
    let towers = 0;
    const maxTowers =
        CONTROLLER_STRUCTURES.tower[this.flag.room!.controller!.level];

    for (let x = -3; x <= 3; x++) {
      for (let y = -3; y <= 2; y++) {
        const struct = TownSquare.config[y + 3][x + 3];

        // Limit spawns
        if (struct === STRUCTURE_SPAWN) {
          if (spawns < maxSpawns) {
            spawns++;
          } else {
            continue;
          }
        }

        // Limit towers
        if (struct === STRUCTURE_TOWER) {
          if (towers < maxTowers) {
            towers++;
          } else {
            continue;
          }
        }

        this.flag.room!.createConstructionSite(
            this.flag.pos.x + x, this.flag.pos.y + y, struct);
      }
    }
  }

  public retire() {
    this.sites.forEach((site) => site.remove);
    this.flag.remove();
  }
}
