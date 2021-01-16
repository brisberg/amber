/**
 * This file is a temporary solution to create a one-way transfer of SCORE from
 * Terminal to terminal of 'E5S28'.
 */

import {RESOURCE_SCORE} from './types';

/**
 * operateTerminals takes a room, pushes score from the Terminal to the Terminal
 * in 'E5S28'.
 */
export function operateTerminals(room: Room): void {
  if (!room.terminal || room.name === 'E5S28') {
    return;
  }

  const destT = Game.rooms['E5S28'].terminal;

  if (!destT) {
    return;
  }

  // Add a buffer (Limit transfers to 15k)
  const amount = Math.min(room.terminal.store[RESOURCE_SCORE], 15000);
  if (amount >= 10000) {
    room.terminal.send(RESOURCE_SCORE, amount, 'E5S28');
  }
}
