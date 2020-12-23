/**
 * This file is a temporary solution to create a one-way transfer of SCORE from
 * Terminal to terminal of 'E1S29'.
 */

const RESOURCE_SCORE = 'score' as ResourceConstant;

/**
 * operateTerminals takes a room, pushes score from the Terminal to the Terminal
 * in 'E1S29'.
 */
export function operateTerminals(room: Room): void {
  if (!room.terminal || room.name === 'E1S29') {
    return;
  }

  const destT = Game.rooms['E1S29'].terminal;

  if (!destT) {
    return;
  }

  // Add a buffer (Limit transfers to 15k)
  const amount = Math.min(room.terminal.store[RESOURCE_SCORE], 15000);
  if (amount >= 10000) {
    room.terminal.send(RESOURCE_SCORE, amount, 'E1S29');
  }
}
