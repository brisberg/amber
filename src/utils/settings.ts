/**
 * Obtain the username of the player
 *
 * Copied from
 * https://github.com/bencbartlett/Overmind/blob/master/src/utilities/utils.ts
 */
export function getUsername(): string {
  for (const i in Game.rooms) {
    if ({}.hasOwnProperty.call(Game.rooms, i)) {
      const room = Game.rooms[i];
      if (room.controller && room.controller.owner && room.controller.my) {
        return room.controller.owner.username;
      }
    }
  }
  for (const i in Game.creeps) {
    if ({}.hasOwnProperty.call(Game.creeps, i)) {
      const creep = Game.creeps[i];
      if (creep.owner) {
        return creep.owner.username;
      }
    }
  }
  console.log(
      'ERROR: Could not determine username. ' +
      'You can set this manually in src/settings/settings_user');
  return 'ERROR: Could not determine username.';
}
