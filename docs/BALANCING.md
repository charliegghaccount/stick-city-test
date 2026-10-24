# Version 3 balance and instant actions

V3 deliberately removes V2's real-time pacing target and every ordinary activity timer. It retains the V2 character/skill XP curves, existing salaries, energy costs, education prices and recovery values. It does not compensate with arbitrary new penalties. Progression is measured through choices, prerequisites, money, energy and **in-game time**, not forced real-world waiting.

## Transactions and time

Work, education, training, recovery, purchases and crime outcomes apply all costs, game-time changes, XP, items/qualifications and saves synchronously. One call pays once; successive intentional calls are allowed. Sleep/rest grants no XP. Timing minigames pay at the player's STOP input; slots pay on the click, and their short feedback animation never locks controls.

Walking, traffic, NPCs and the requested police pursuit remain live simulations. A pursuit lasts 30 active seconds unless the player is taken down first. It is an escape challenge with incoming shots and cover, not an activity-completion delay. Background tabs pause its simulation. Ordinary work, building entry and banking are unavailable while wanted; healing items remain usable. Developer pause/clear controls are explicit marked cheats.

The old activity countdown, reserved-cost queue, activity footer and delayed completion methods have been removed. V2 pending records are read only during migration, settled immediately once without charging reserved costs again, then saved as V3. The only `setTimeout` calls left are non-blocking toast dismissal and releasing an exported download URL.

## XP and education

Character level L needs `120 + 70*(L-1) + 30*(L-1)^2` XP to advance: 120, 220, 380 and 600 for the first four levels. Skill level S needs `60 + 40*(S-1) + 10*(S-1)^2`: initially 60, 110, 180 and 270. Skill XP carries over; one basic action does not grant a whole level. These formulas also apply to **Thieving**.

Higher-level training retains V2's `1 + 0.2*(skillLevel-1)` scaling of tuition and game minutes. It adds no real-time delay. Existing earned levels and skill XP remain intact. A study guide adds 20% intelligence skill XP before integer rounding; the menu displays the actual resulting XP.

A fresh kitchen worker still needs 74 shifts to reach character level 5. That is roughly eleven in-game days including sleep, not a promise of 74 real minutes. Choices and advanced jobs change this. There is no V3 wall-clock levelling claim.

## Careers: 18 functional roles

| Path | Roles, in progression order |
| --- | --- |
| Hospitality | Kitchen assistant → Waiter → **Hospitality supervisor** → Restaurant manager |
| Retail | Shop assistant → Store manager |
| Corporate | Office assistant → **Administrator** → Analyst → Executive |
| Healthcare | Hospital assistant → **Medical technician** → Registered nurse → **Doctor** |
| Public services | Postal courier → **Public services inspector** |
| Trades | Workshop assistant → **Electrician** |

Bold roles are new. Their per-shift values are:

| New role | Cash | Game minutes | Energy | Character XP | Qualification |
| --- | ---: | ---: | ---: | ---: | --- |
| Hospitality supervisor | $78 | 180 | 28 | 32 | Service certificate; level 3, efficiency/charm 3 |
| Administrator | $72 | 210 | 27 | 31 | Office certificate; level 3, intelligence 3/efficiency 2 |
| Medical technician | $68 | 180 | 26 | 28 | Medical technology; level 3, intelligence 3/efficiency 2 |
| Doctor | $240 | 300 | 44 | 70 | Medical degree; level 7, intelligence 6/charm 4/strength 3 |
| Public inspector | $120 | 240 | 30 | 42 | Public administration; level 4, intelligence/charm 3 |
| Electrician | $135 | 240 | 34 | 44 | Electrical license; level 4, intelligence/strength 3 |

Current employment persists. Taking a job or choosing its shift is explicit; increasing a skill or completing shifts does not automatically promote the player. **Stats → Careers & education** shows all positions, salary, hours, costs and individual unlock conditions, with links to existing workplaces and college.

The original six qualifications remain. Four new qualifications complete instantly while charging their stated in-game commitments:

| New qualification | Cost | Game minutes | Prerequisites |
| --- | ---: | ---: | --- |
| Medical technology | $360 | 240 | Intelligence 3, first aid |
| Medical degree | $1,800 | 1,440 | Intelligence 6, strength 3, nursing + medical technology |
| Public administration | $550 | 300 | Intelligence/charm 3, office certificate |
| Electrical trade license | $700 | 360 | Intelligence/strength 3, first aid |

## Thieving and crime

See [the research and robbery table](THIEVING_REFERENCE.md). Practice at the Gang hideout costs $10, 12 energy and 45 game minutes, granting 8 Thieving XP before higher-level training scaling. Gang courier work pays $18, consumes 18 energy/90 game minutes and awards 4 Thieving XP. Pickpocketing resolves instantly, awards 6 Thieving XP on success or 2 on failure, and carries fines/health losses. A recently targeted NPC remains alert for one in-game hour.

Eight building targets range from the café (Thieving 1, $25–45) to the bank (Thieving 10 and character level 5, $600–950). Higher skill improves displayed success odds; lockpicks add six percentage points. Chance is capped at 92%, so failure remains possible. Failure starts armed police pursuit; defeat loses health, money and game time, while bank savings remain safe. Target security resets after a stated amount of **game time**; instant ordinary work/rest can advance that clock. This is not a real-time cooldown.

## Purchases, missions and safety

Six new functional items: meal box ($28, +65 energy/+8 health); trauma kit ($60, +85 health); lockpicks ($180, +6 percentage points robbery odds); running shoes ($120, +10% walking speed); protective vest ($240, 25% less police damage); study guide ($80, +20% intelligence XP before rounding). Equipment is passive while owned and cannot be stacked by buying duplicates. Existing food, medical items and banking remain functional; takeaway coffee can now be bought for the bag.

Four additional Mayor/Gang tasks use ordinary earnings, purchases, unique conversations, skill milestones and successful robberies. Rewards are paid once. Existing mission rewards are preserved. Developers can clear active missions or reset their progress for testing; this marks the save.

All permanent cheat edits/imports remain marked DEV-ALTERED. Temporary resource, speed, noclip and simulation-pause flags reset on reload or via one developer button. Save schema 3 adds Thieving, employment, crime alerts, unique contacts and persistent wanted status without changing the browser's storage key or public URL.
