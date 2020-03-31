import {EXTENSION_GROUP_A_FLAG, EXTENSION_GROUP_B_FLAG} from '../flagConstants';

/**
 * Base Layout controller is a sub-system which will distribute base layout
 * flags from a central TownSquare flag.
 *
 * For now, this system is hardcoded to automatically place the Extension Groups
 * above and below the Town Square, regardless of available terrain.
 *
 * Passed a TownSquare flag.
 *
 * DEPRECATED: For the moment, I am going to forgo base autolayout until
 * flexible refilling/spawning is completed.
 */
export class BaseLayoutController {
  private static extendOffsets = [[-2, 4], [2, 4], [-5, 1], [5, 1]];

  private readonly flag: Flag;
  private readonly room: Room;

  constructor(flag: Flag) {
    this.flag = flag;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.room = flag.room!;
  }

  public layoutFlags(): void {
    const aFlags = this.room.find(FIND_FLAGS, {filter: EXTENSION_GROUP_A_FLAG});
    const bFlags = this.room.find(FIND_FLAGS, {filter: EXTENSION_GROUP_B_FLAG});

    const maxExtensions =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        CONTROLLER_STRUCTURES.extension[this.room.controller!.level];
    const maxGroups = Math.ceil(maxExtensions / 6);

    if ((aFlags.length + bFlags.length) < maxGroups) {
      const debugMax = Math.min(maxGroups, 4);  // Limit to 4 for now
      for (let i = 0; i < debugMax; i++) {
        // Create an Extension Group flag for each hardcoded flag.
        const pos = BaseLayoutController.extendOffsets[i];
        this.room.createFlag(
            this.flag.pos.x + pos[0], this.flag.pos.y + pos[1],
            this.flag.name + '_' + i, EXTENSION_GROUP_A_FLAG.color,
            EXTENSION_GROUP_A_FLAG.secondaryColor);
      }
    }
  }
}
