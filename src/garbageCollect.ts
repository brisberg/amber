/* eslint-disable no-restricted-syntax */
/**
 * Garbage Collection phase. Clears memory that is no longer relevant to the
 * game state.
 */
export default function garbageCollection(): void {
  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  // Automatically deallocation missing/disabled missions
  for (const name in Memory.missions) {
    if (!(name in Game.flags)) {
      delete Memory.missions[name];
    }
  }

  // Automatically deallocation missing/disabled operations
  for (const name in Memory.operations) {
    if (!(name in Game.flags)) {
      delete Memory.operations[name];
    }
  }

  // Automatically deallocation missing/disabled energy nodes
  for (const name in Memory.flags) {
    if (!(name in Game.flags)) {
      delete Memory.flags[name];
    }
  }
}
