# Work Organization


Freeform:

I need to devise a system for managing the spawning/respawning of worker screeps, delegating tasks for them to complete various objectives, and potentially swapping screeps between tasks on the fly as needed.

BonzAI uses an interesting system for this which I can likely adapt. He uses a couple of useful abstractions:

SpawnGroup - It seems to be a set of spawners which can be requested to produce creeps of specific sizes.

Operation - Large scale operation such as RemoteMining, LocalMining, Buliding/Paving Roads. Each of these operations is tied to a Flag placed in a specific room, and the memory for the operation is placed on the flag.

Mission - Small scale task, many of these are associated with each Operation. These could be MineASource, BuildAStructure, etc.
