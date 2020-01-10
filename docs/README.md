# Introduction

Amber AI for Screeps was generated from screeps [screeps-typescript-starter](https://github.com/screepers/screeps-typescript-starter). View their [docs](https://screepers.gitbook.io/screeps-typescript-starter/) for in-depth information about tooling and development decisions.


Philisophical idea: Treat the world as the source of truth.

This means reconcile the structures/creeps/flags in the game world with our representation in Memory, and update the Memory if anything is a miss. Design the control systems to adjust based on this.

This will make the systems resiliant to outside interferance (hostil creeps, sudden creep death, Memory crruption).

This also supports using Flags as a permanent storage layer for organizational objectives. For example put a flag on each source we plan to mine, not just put a Mission in memory. That way we can always rebuild the memory from the Flags left in the world.
