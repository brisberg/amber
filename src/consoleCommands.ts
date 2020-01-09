import {EnergyNode} from 'energy-network/energyNode';

/**
 * Installs all Console Commands to the global scope. Can be accessed by:
 * `cc.command()`
 */
export function installConsoleCommands() {
  global.cc = CONSOLE_COMMANDS;
}

const CONSOLE_COMMANDS = {
  addEnergySourceNode: (containerID: Id<StructureContainer>) => {
    const roomName = Game.spawns.Spawn1.room.name;
    const container = Game.getObjectById(containerID);

    if (!container) {
      return;
    }

    const energyNode: EnergyNode = {
      ID: 'foo',
      persistant: true,
      polarity: 'source',
      pos: [container.pos.x, container.pos.y],
      room: roomName,
      type: 'structure',
    };
    Memory.rooms[roomName].network.nodes.push(energyNode);
    return;
  },
};
