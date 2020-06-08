import {constructMissionFromFlag} from '.';
import Mission from './mission';

/**
 * Mission Registry is map which holds references to all initialized Mission
 * Objects.
 *
 * It is stored on the global scope, meaning it will persist between ticks to
 * avoid rebuilding the Mission Objects.
 */
export class MissionRegistry {
  private missionMap: {[name: string]: Mission} = {}

  /**
   * Initialize the Mission Registry from scratch.
   *
   * Usually called after a Global Reset
   * @param flags List of Flags to initialize missions
   */
  public init(flags: Flag[]): void {
    this.missionMap = {};

    flags.forEach((flag) => {
      const msn = constructMissionFromFlag(flag);

      if (msn) {
        this.register(msn);
      }
    });
  }

  /**
   * Refresh the Mission Registry from the world once per tick.
   */
  public refresh(): void {
    throw new Error('Unimplemented');
  }

  /**
   * Registers a new mission into the Global Registry.
   * @param mission Mission to register
   */
  public register(mission: Mission): Mission {
    this.missionMap[mission.name] = mission;
    return mission;
  }

  /** Removes the specified Mission or mission name from the Global Registry */
  public unregister(msnOrName: Mission|string): boolean {
    const key = msnOrName instanceof Mission ? msnOrName.name : msnOrName;

    if (this.missionMap[key]) {
      delete this.missionMap[key];
      return true;
    }

    return false;
  }

  public get(name: string): Mission|null {
    return this.missionMap[name] || null;
  }
}
