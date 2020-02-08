# Statistics Tracking

I would like to begin tracking some statistics for my rooms/creeps. These could just be interesting metrics to keep track of various things. But also performance metrics, such as Energy cost per tick of all creeps in a mission. I could keep an eye on these and see how my different optimizations are turning out.

It would also be useful to track Total Energy Harvested from a room, as this would help me predict when invasions would arrive.

It will be difficult to do very much data slicing spending my CPU in the game, but I can record some general numbers and possibly export them for outside processing?

---

Stats to track:

CPU Utilization:
- CPU used per tick
- CPU used for different phases / missions
- IVM Heap stats (I'll have to look into which of those matter)

Per Creep:
- Idle ticks (determined by the creep behavior) - This means ticks where the creep was unable to push forward it's task, or it had no task.
- Cargo Utilization - Average fullness of the creeps CARRY parts. Mainly relevant for logistics.

Per Room:
- Total Energy Harvested
- Energy Harvested since last invasion
