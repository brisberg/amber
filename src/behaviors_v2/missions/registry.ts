import Mission from './mission';

/**
 * Mission Registry is map which holds references to all initialized Mission
 * Objects.
 *
 * It is stored on the global scope, meaning it will persist between ticks to
 * avoid rebuilding the Mission Objects.
 */
export default class MissionRegistry {
  private missionMap: {[name: string]: Mission} = {}

  /**
   * Initialize the Mission Registry from scratch.
   *
   * Usually called after a Global Reset
   */
  public init(): void {
    throw new Error('Unimplemented');
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
    throw new Error('Unimplemented');
  }

  /** Removes the specified Mission or mission name from the Global Registry */
  public unregister(msnOrName: Mission|string): boolean {
    throw new Error('Unimplemented');
  }

  public get(name: string): Mission|null {
    throw new Error('Unimplemented');
  }
}
