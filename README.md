CodeDefense
============

TODO:
	- Grid
	- Tower
		- XP per # enemies died during life-time
		- Upgrades unlocked with XP
	- Levels
		- Level 1:
			# monsters counter
			+shoot
		- Ability to select level
		- Waves
			- Initial levels: All monsters are visible right away
		- Provides all already unlocked tools
		- Rewards
			- The less shots fired, the more Reward Points (RPs)
			- Time (# game ticks (?))
			- Base-line amount for finishing any level
	- Coding
		- Variables
			- monsterCount
			- ammoCount{AmmoType}
		- Functions
			- shoot(ammo)
			- monster = aimNext(monsterTypes)
				if (monster = findNext(monsterTypes))
					faceImmediately(monster);
			- repeat(n, fun)
			- item = findNextItem()
			- pickUp(item)
			- if then else
			
		- Enums
			- MonsterType
				- Canonn fodder (C)
				- Fast (F)
				- Shielded (S)
				- Ninja (N)
			- AmmoType
		- Objects
			- Monster
				- pos
				- speed
				- type
				- health
				- GUI
					- Health bar
			- Tower
			- Krane + search light
				- item = findItem
				- pickUp(item)