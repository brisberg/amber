# Task Management

An alternate idea for how to manage creep assignments for large numbers of small, descrete, ephemeral tasks.

An example would be transporting energy around a room using Haulers, or repairing disperate road segments / structures around a room, repairing/building walls/ramparts to defend a room.

Previously, I sought to split up these tasks into descrete work zones. For example, the Energy Network would define descrete linkages between points of interest and maintain a set of Haulers dedicated to each Link. The Distributor mission can be thought of as very similar, in that it is "transporting" energy from the storage throughout the core base.

This does indeed work well, as each linkage/work area can estimate the creeps they need and individually request their own. However, now that I have started to build up the base and produce larger and larger creeps, this is becoming a source of waste.

A standard base with two sources, one storage, and one controller is maintaining 4 Haulers (1 for each link, and 1 distributor). The haulers are so large they can easily move more than the energy produced by a single source and spend a large portion of time sitting idle by the containers waiting for the source to regenerate.

One possible solution is to calculate a tighter upperlimit on the size of Haulers for each of these missions. This would reduce Energy waste as the haulers we have would be utilized more. However, this does cost more in CPU costs, as numerous, smaller creeps will each usually have a constant CPU cost.

The goal of Task-based Missions is a mission will use a pool of creeps capable of completing tasks, and assign them to the small, ephemeral tasks as they arrive. There will need to be some calculation based on the number of tasks available on how many creeps we will need. This way early on we can have numberous, small haulers moving energy around. But as the RCL climbs, the mission will automatically scale down to a smaller set of much larger hauler creeps to complete the same set of tasks.

### Task Definition

The two cases I am imagining for now are Energy Transport, and Road Repair.

We could have various structures/targets register a Task to pick or deliver energy. This would obviously be on the Harvesting Containers at the Sources, but could also be on each Extenion Group. Or on Creep Tombstones if they die carrying energy. Slain enemies. Misc stray resource piles in the wild (from fallen creeps or from recycling).

Each of these tasks would have a location associated, and a volume (I am thinking in units of 50). Positive volume represents a "Pickup" task, negative volumn represents a "Deliver" task. Tasks should have priorities as well. This is were we can implement the Tower > Spawn > Build > Upgrade ordering.

This is one reason I like using ExtensionGroups. They are proxies representing 6 structures which otherwise would be their own tasks. "Highways" could work as a similar task abstraction for Roads.

### Task Allocation

The mission would review all of these objects and register a set of tasks for each.

If the mission has no available tasks, it will dismiss its creeps.

If there are tasks waiting, the mission will wait for a creep to return to the "IDLE" state. The mission will look over its set of tasks and generate a plan for the creep.

This plan is a "task queue", which the creep will execute in sequence. It will iteratively filter the list by the closest tasks. Check to see if the creep will have enough energy/free capacity/ticksToLive to take the task. If so, adds it to the queue. And then it goes again, filtering the list by distance to the latest task and tries to add another. This continues until we run out of valid tasks, or we reach a task where the Creep will have net 0 energy left over.

Once a plan is set, it is assigned to the creep and it heads off to complete them. When it starts, it references each of the tasks and registeres a reservation for the Energy / Free capacity that it's tasks require.

Generating this plan may be much harder than I suspect.

--

A simple solution to this might be a simple greedy one. Have each creep evaluate all of the available tasks by expected utilization and take the task worth the highest value.
