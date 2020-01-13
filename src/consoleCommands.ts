import {registerEnergyNode, unregisterEnergyNode} from 'energy-network/energyNode';

/**
 * Installs all Console Commands to the global scope. Can be accessed by:
 * `cc.command()`
 */
export function installConsoleCommands() {
  global.cc = CONSOLE_COMMANDS;
}

const CONSOLE_COMMANDS = {
  addENode: (containerID: Id<StructureContainer>, polarity = 0) => {
    const room = Game.spawns.Spawn1.room;
    const container = Game.getObjectById(containerID);

    if (!container) {
      return;
    }

    const flag = registerEnergyNode(room, [container.pos.x, container.pos.y], {
      persistant: true,
      polarity,
      structureID: container.id,
      type: 'structure',
    });

    return flag.name;
  },

  removeENode: (flagName: string) => {
    const flag = Game.flags[flagName];

    if (!flag) {
      return;
    }

    unregisterEnergyNode(flag);

    return 'done';
  },
};
