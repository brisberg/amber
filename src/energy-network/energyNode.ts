/**
 * Energy Node is a generic representation of a Node of the Energy network. This
 * could a Structure (Container, Link, Storage, Terminal) or a Creep drop zone.
 *
 * Should represent these as a flag, so it has a persistent location and a
 * unique ID missions can uses to keep track of it.
 */

export interface EnergyNodeMemory {
  flag: string;
  polarity: 'source'|'sink';
  type: 'link'|'structure'|'creep';
  persistant: boolean;  // Unused for now
  structureID: Id<StructureStore>|null;
}

// TODO: Maybe we need to add towers to this?
/* All structures which be an Energy Node */
type StructureStore = StructureContainer|StructureLink|StructureStorage|
    StructureSpawn|StructureExtension;

export class EnergyNode {
  public readonly flag: Flag;
  public readonly mem: EnergyNodeMemory;
  protected readonly structure: StructureStore|null;

  constructor(flag: Flag) {
    if (!Memory.flags[flag.name]) {
      Memory.flags[flag.name] = {};
    }

    if (!Memory.flags[flag.name].state) {
      const mem: EnergyNodeMemory = {
        flag: flag.name,
        persistant: false,
        polarity: 'source',
        structureID: null,
        type: 'structure',
      };
      Memory.flags[flag.name].state = mem;
    }
    this.flag = flag;
    this.mem = Memory.flags[flag.name].state;
    this.structure = Game.getObjectById(this.mem.structureID!);
  }

  public transferFrom(creep: Creep) {
    if (this.structure) {
      creep.transfer(this.structure, RESOURCE_ENERGY);
    }
  }

  public transferTo(creep: Creep) {
    if (this.structure) {
      creep.withdraw(this.structure, RESOURCE_ENERGY);
    }
  }
}

interface RegisterEnergyNodeOptions {
  polarity: 'source'|'sink';
  type: 'link'|'structure'|'creep';
  persistant: boolean;
  structureID?: Id<StructureStore>;
}

export function registerEnergyNode(
    room: Room, pos: [number, number], opts: RegisterEnergyNodeOptions): Flag {
  const flagName = ['enode', room.name, pos[0], pos[1]].join('_');

  const mem: EnergyNodeMemory = {
    flag: flagName,
    persistant: opts.persistant,
    polarity: opts.polarity,
    structureID: opts.structureID || null,
    type: opts.type,
  };

  room.createFlag(pos[0], pos[1], flagName);
  // We just made this flag, guaranteed to exist
  const flag = findFlag(flagName)!;
  Memory.flags[flagName] = {state: mem};
  return flag;
}

export function unregisterEnergyNode(flag: Flag|string) {
  const name = typeof flag === 'string' ? flag : flag.name;

  findFlag(name) ?.remove();
  delete Memory.flags[name];
}

/** Finds a flag with a given name. */
function findFlag(name: string): Flag|null {
  const flag = Game.flags[name];

  if (!flag) {
    return null;
  }

  return flag;
}
