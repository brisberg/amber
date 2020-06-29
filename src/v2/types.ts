/**
 * Serialized Room Position
 *
 * TODO: Move this to shared types.
 */
export interface ProtoPos {
  x: number;
  y: number;
  room: string;
}

/**
 * Abstract interface for Behavior Memory. All behavior memories should
 * implement this. Mainly for standardizing sub-behaviors.
 */
export interface BehaviorMemory {
  name: string;             // Identifier of this behavior
  parent?: BehaviorMemory;  // Optional memory of the parent task
  target: {
    id: string;     // ID of the target
    pos: ProtoPos;  // Position of target in case vision is lost
  };
  tick: number;              // Tick when task was assigned
  options: BehaviorOptions;  // Options for a specific behavior instance
  data: BehaviorData;
}

/**
 * Settings that apply to all behaviors, but are shared by all instances of a
 * particular behavior.
 *
 * Not serialized to memory.
 */
export interface BehaviorSettings {
  timeout: number;  // Behavior valid for this many ticks
  range: number;    // Can perform the behavior from this range
  blind: boolean;   // Unimplemented. Behavior does not require vision
}

/**
 * Options to apply to a specific Behavior.
 */
export interface BehaviorOptions {
  blind?: boolean;  // Unimplemented. Don't need vision for the task.
  // Target Position override. [x, y]. Creeps work from this exact position.
  overridePos?: RoomPosition;
}

/**
 * Base Interface for Data specific to a Behavior instance, structure depends on
 * each Behavior subclass.
 */
export interface BehaviorData {
  [key: string]: unknown;
}
