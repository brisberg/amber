import {EnergyNode, registerEnergyNode} from 'energy-network/energyNode';

/**
 * Installs all Console Commands to the global scope. Can be accessed by:
 * `cc.command()`
 */
export function installConsoleCommands() {
  global.cc = CONSOLE_COMMANDS;
}

const CONSOLE_COMMANDS = {
  addEnergySourceNode: (containerID: Id<StructureContainer>) => {
    const room = Game.spawns.Spawn1.room;
    const container = Game.getObjectById(containerID);

    if (!container) {
      return;
    }

    registerEnergyNode(room, [container.pos.x, container.pos.y], {
      persistant: true,
      polarity: 'source',
      structureID: container.id,
      type: 'structure',
    });

    return;
  },
};
