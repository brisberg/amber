import {FlagColor} from 'flagConstants';

/**
 * Energy Node is a generic representation of a Node of the Energy network. This
 * could a Structure (Container, Link, Storage, Terminal) or a Creep drop zone.
 *
 * Should represent these as a flag, so it has a persistent location and a
 * unique ID missions can uses to keep track of it.
 */

/*
Just had a very interesting idea for how to handle creep nodes. Instead of
trying to organize them into a queue or a cycle or allowing free association and
hoping a deadlock doesn't form, what about causing creeps to line up in the
path. And they will pass energy up the line to the head creep. That way they are
emptied from the back to the front, and the last ones can leave. Basically a
FILO stack of delivery creeps.
*/

export interface EnergyNodeMemory {
  flag: string;
  polarity: number;  // Expected generated/consumed per tick
  type: 'link'|'structure'|'creep';
  persistant: boolean;  // Unused for now
  coreBuffer: number;   // Amount of energy left in core node
  _cache: {
    structureID?: Id<StructureStore>;
    creep?: string;
    linkID?: Id<StructureLink>;
    projLevel?: number;
  };
}

// TODO: Maybe we need to add towers to this?
/* All structures which can be an Energy Node */
type StructureStore = StructureContainer|StructureLink|StructureStorage|
    StructureSpawn|StructureExtension;

export class EnergyNode {
  public readonly flag: Flag;
  public readonly mem: EnergyNodeMemory;
  protected readonly structure: StructureStore|null = null;
  protected readonly creep: Creep|null = null;

  constructor(flag: Flag) {
    if (!Memory.flags[flag.name]) {
      Memory.flags[flag.name] = {};
    }

    if (!Memory.flags[flag.name].state) {
      const mem: EnergyNodeMemory = {
        _cache: {},
        coreBuffer: 0,
        flag: flag.name,
        persistant: false,
        polarity: 0,
        type: 'structure',
      };
      Memory.flags[flag.name].state = mem;
    }
    this.flag = flag;
    this.mem = Memory.flags[flag.name].state;
    this.validateMemoryCache(this.mem);

    if (this.mem.type === 'structure') {
      this.structure = Game.getObjectById(this.mem._cache.structureID!);
    } else if (this.mem.type === 'creep') {
      this.creep = Game.creeps[this.mem._cache.creep!];
    }
  }

  /**
   * Validates the cache for this Energy Node. It will find the Ids of
   * Structures, Links, and Creeps which should be accessible to this node. If a
   * 'structure' or 'link' type node cannot find a Structure, it will return
   * false and should be removed as the node is compromised.
   */
  private validateMemoryCache(mem: EnergyNodeMemory): boolean {
    const cache = mem._cache;

    switch (this.mem.type) {
      case 'structure': {
        if (!cache.structureID || !Game.getObjectById(cache.structureID)) {
          const structs = this.flag.room!.lookForAt(
              LOOK_STRUCTURES, this.flag.pos.x, this.flag.pos.y);
          for (const struct of structs) {
            // This may not be a safe assumption
            if ((struct as any).store !== undefined) {
              cache.structureID = struct.id as Id<StructureStore>;
              return true;
            }
          }
          return false;
        }
        return true;
      }
      case 'creep': {
        if (!cache.creep || !Game.creeps[cache.creep]) {
          const creeps = this.flag.room!.lookForAt(
              LOOK_CREEPS, this.flag.pos.x, this.flag.pos.y);

          if (creeps.length === 0) {
            // Log a warning that the creeps aren't here yet?
            return true;
          }

          cache.creep = creeps[0].name;
          return true;
        } else {
          const creep = Game.creeps[cache.creep];
          if (!creep.pos.isEqualTo(this.flag.pos)) {
            // The creep we had left
            delete cache.creep;
            return true;
          }
        }
        return true;
      }
      case 'link': {
        // Unimplemented
        return true;
      }
    }
  }

  public getStoredEnergy(): number {
    if (this.mem.type === 'creep') {
      const creepName = this.mem._cache.creep;
      if (creepName && Game.creeps[creepName]) {
        return Game.creeps[creepName].store.energy;
      } else {
        // No creep in the cache
        return -1;
      }
    }

    const cache = this.mem._cache;
    if (!cache.structureID || !Game.getObjectById(cache.structureID)) {
      // Node is likely derelict and will be pruned soon
      return -1;
    }

    const store: StructureStore = Game.getObjectById(cache.structureID)!;
    return store.store.energy;
  }

  /**
   * Indicates to approaching creeps that this node is occupied. Only relevant
   * to 'creep' type nodes indicating there is a creep standing in the node
   * already.
   */
  public isOccupied(): boolean {
    if (this.mem.type === 'creep' && this.mem._cache.creep) {
      return true;
    }

    return false;
  }

  /** Returns the polarity (energy/tick) this node produces/consumes */
  public getPolarity(): number {
    return this.mem.polarity;
  }

  public transferFrom(creep: Creep, amount?: number) {
    if (this.structure) {
      const amt = amount ||
          Math.min(creep.store.energy, this.structure.store.getFreeCapacity());
      creep.transfer(this.structure, RESOURCE_ENERGY, amt);
    } else if (this.creep) {
      const amt = amount ||
          Math.min(creep.store.energy, this.creep.store.getFreeCapacity());
      creep.transfer(this.creep, RESOURCE_ENERGY, amt);
    }
  }

  public transferTo(creep: Creep, amount?: number) {
    if (this.structure) {
      const amt = amount ||
          Math.min(creep.store.getFreeCapacity(), this.structure.store.energy);
      creep.withdraw(this.structure, RESOURCE_ENERGY, amt);
    } else if (this.creep) {
      // Can't withdraw from creeps apparently
      const amt = amount ||
          Math.min(creep.store.getFreeCapacity(), this.creep.store.energy);
      this.creep.transfer(creep, RESOURCE_ENERGY, amt);
    }
  }

  /**
   * Examines an Energy Node flag to validate if the flag is in a valid state.
   *
   * i.e. Has a valid structure at the location, has a constructed link, etc
   *
   * Used to prune compromised nodes from the network.
   */
  public static validateNode(flag: Flag): boolean {
    if (!Memory.flags[flag.name]) {
      // No memory associated with this flag
      return false;
    }

    const mem: EnergyNodeMemory = Memory.flags[flag.name].state;

    if (!mem) {
      // Flag memory not initialized
      return false;
    }

    if (!flag.room) {
      // We have lost vision of this room, might revisit this for remote mining
      return false;
    }

    if (mem.type === 'structure') {
      const cache = mem._cache;

      if (!cache.structureID || !Game.getObjectById(cache.structureID)) {
        const structs = flag.pos.lookFor(LOOK_STRUCTURES);
        for (const struct of structs) {
          // This may not be a safe assumption
          if ((struct as any).store !== undefined) {
            cache.structureID = struct.id as Id<StructureStore>;
            return true;
          }
        }

        // No suitable storage structure was found, it may have been destroyed
        return false;
      }
    }

    return true;
  }
}

interface RegisterEnergyNodeOptions {
  type: 'link'|'structure'|'creep';
  polarity: number;
  // Amount of energy that must be in the core for this
  // Node to request Energy
  coreBuffer: number;
  persistant: boolean;
  structureID?: Id<StructureStore>;
  color: FlagColor;
}

export function registerEnergyNode(
    room: Room, pos: [number, number], opts: RegisterEnergyNodeOptions): Flag {
  const flagName = ['enode', room.name, pos[0], pos[1]].join('_');

  const mem: EnergyNodeMemory = {
    _cache: {},
    coreBuffer: opts.coreBuffer,
    flag: flagName,
    persistant: opts.persistant,
    polarity: opts.polarity,
    type: opts.type,
  };

  room.createFlag(
      pos[0], pos[1], flagName, opts.color.color, opts.color.secondaryColor);
  // We just made this flag, guaranteed to exist
  const flag = findFlag(flagName)!;
  Memory.flags[flagName] = {state: mem};
  return flag;
}

export function unregisterEnergyNode(flag: Flag|string) {
  const name = (typeof flag === 'string' ? flag : flag.name);
  console.log('Unregistering enode ' + name);

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
