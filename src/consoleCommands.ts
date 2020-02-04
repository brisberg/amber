/**
 * Installs all Console Commands to the global scope. Can be accessed by:
 * `cc.command()`
 */
export function installConsoleCommands() {
  global.cc = CONSOLE_COMMANDS;
}

const CONSOLE_COMMANDS = {
  /** Pause Script execution for a number of Game ticks */
  pauseFor(ticks: number = 100) {
    Memory.pauseUtil = Game.time + ticks;
    console.log('Script suspended until ' + Memory.pauseUtil);
  },
  /** Resume Script execution */
  unpause() {
    delete Memory.pauseUtil;
    console.log('Script resumed.');
  },

  reassignCreep(creepName: string, mission: string) {
    const creep = Game.creeps[creepName];
    const mem = Memory.creeps[creepName];

    // Validate inputs
    if (!creep) {
      console.log('No Creep found for name: ' + creepName);
      return false;
    }

    const newMsn = global.missions(Game.flags[mission]);
    if (!newMsn) {
      console.log('No Mission flag found for: ' + mission);
      return false;
    }

    // Un-assign creep from previous mission
    if (mem && mem.mission && Game.flags[mem.mission]) {
      const msn = global.missions(Game.flags[mem.mission]);

      if (msn) {
        msn.releaseCreep(creep);
      }
    }

    // Assign creep to new Mission
    newMsn.assignCreep(creep);
    return true;
  },
};
