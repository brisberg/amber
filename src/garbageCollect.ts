/**
 * Garbage Collection phase. Clears memory that is no longer relevant to the
 * game state.
 */
export function garbageCollection() {
  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  // Automatically deallocation missing/disabled missions
  for (const name in Memory.flags) {
    if (!(name in Memory.missions)) {
      delete Memory.missions[name];
    }
  }
}
