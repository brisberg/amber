/**
 * Installs all Console Commands to the global scope. Can be accessed by:
 * `cc.command()`
 */
export function installConsoleCommands() {
  global.cc = CONSOLE_COMMANDS;
}

const CONSOLE_COMMANDS = {
  spawnCreep: () => {
    const spawn = 'Spawn1';
    return Game.spawns[spawn].spawnCreep([MOVE, CARRY], 'creep1');
  },
};
