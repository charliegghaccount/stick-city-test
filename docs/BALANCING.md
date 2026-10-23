# Version 2 balance model

These are initial remake tuning choices, not recovered formulas from the original iPhone game. All core numbers are in `src/balance.ts`; careers and course prerequisites are data in `src/careers.ts`.

## Character progression and active time

The XP cost from level L to L+1 is `120 + 70*(L-1) + 30*(L-1)^2`. The first four costs are **120, 220, 380 and 600 XP**: a fresh player needs **1,320 XP to reach level 5**. XP carries across levels.

An instant-action game cannot provide a credible real-playtime target without thousands of repetitive clicks. V2 therefore gives activities visible, persistent timers. One game minute normally takes **0.45 active real seconds**. A two-hour kitchen shift takes 54 seconds. Costs are reserved when an activity starts; cash, XP, skill XP, items, qualifications and game-time advancement arrive once on completion. Only one activity can run at a time. Background tabs pause progress, and reloading restores the remaining timer without an offline reward. Changing the in-game clock does not finish work.

Free eight-hour sleep is a deliberate 30-real-second recovery exception; park rest takes 18 seconds. Both award **zero XP**. This avoids a sleep-XP exploit and prevents recovery from making an early session unnecessarily long. Players can browse menus and explore while an activity runs.

The deterministic fresh-worker test repeats kitchen shifts, sleeping when energy is insufficient. It reaches level 5 after **74 shifts and about 73.6 active minutes**, including recovery but excluding travel and menu time. This is a model, not a timed human playthrough. Courses, exploration and different career choices change the result; the 45–90 minute target remains provisional.

Every repeatable activity available below level 5 is bounded at **0.4 character XP per real second or less**, including timing challenges. All three one-time missions together award only 50 character XP. Even subtracting those rewards up front gives a conservative minimum of **52.9 active minutes** to level 5 at that rate, before recovery or travel. Tests check the bound so an accidental high-XP/short-duration activity cannot silently create a fast repetition exploit.

## Skills

Skills have separate XP. The cost from skill level S to S+1 is `60 + 40*(S-1) + 10*(S-1)^2`: initially 60, 110, 180 and 270 XP. Work grants 6–14 skill XP; training generally grants 5–14. A kitchen shift grants 6 efficiency XP, so the first efficiency level takes ten shifts rather than one click.

Training duration and tuition scale by `1 + 0.2*(skillLevel-1)`. Higher-level books remain free but take longer; paid study and gym sessions become more expensive too. The UI quotes the actual cost and duration before starting. Skill bars show XP towards the next level, with explicit numeric progress. New training caps at level 50; existing legacy levels above that are retained.

Efficiency unlocks delivery and management work. Charm unlocks service/management roles and improves pickpocket odds. Intelligence gates qualifications and specialist careers. Strength gates workshop and nursing work. These are explicit requirements rather than hidden salary multipliers, so advertised payments remain accurate.

## Jobs

All payments below are per completed shift; time is in game minutes. The UI also displays real seconds.

| Path | Role | Cash | Minutes | Energy | Character XP | Main requirements |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Hospitality | Kitchen assistant | $24 | 120 | 18 | 18 | Available immediately |
| Hospitality | Waiter | $42 | 150 | 23 | 21 | Level 2, efficiency 2, charm 2, service certificate |
| Hospitality | Restaurant manager | $135 | 240 | 36 | 50 | Level 5, efficiency 4, charm 4, management diploma |
| Corporate | Office assistant | $52 | 180 | 24 | 24 | Level 2, intelligence 2, office certificate |
| Corporate | Analyst | $100 | 240 | 31 | 40 | Level 4, intelligence 4, efficiency 3, data certificate |
| Corporate | Executive | $220 | 300 | 40 | 65 | Level 7, intelligence 6, charm 5, data + management qualifications |
| Healthcare | Hospital assistant | $30 | 150 | 20 | 20 | Available immediately |
| Healthcare | Registered nurse | $110 | 240 | 34 | 40 | Level 4, intelligence 4, strength 2, nursing diploma |
| Retail | Shop assistant | $23 | 120 | 16 | 16 | Available immediately |
| Retail | Store manager | $105 | 240 | 32 | 40 | Level 4, efficiency 4, charm 3, management diploma |
| Postal | Postal courier | $38 | 150 | 22 | 20 | Level 2, efficiency 2 |
| Workshop | Workshop assistant | $46 | 180 | 26 | 24 | Strength 2 |

These are 12 functioning roles, not promises of future job buttons. Healthcare currently stops at nurse; more tiers can be added to the same data later.

## Education

| Qualification | Cost | Game minutes | Prerequisites | Unlocks |
| --- | ---: | ---: | --- | --- |
| Service certificate | $100 | 120 | Charm 2 | Waiter |
| Office certificate | $180 | 180 | Intelligence 2 | Office assistant, further data study |
| First aid | $120 | 120 | Intelligence 2 | Nursing study |
| Data analysis | $450 | 240 | Intelligence 3, office certificate | Analyst |
| Nursing diploma | $650 | 360 | Intelligence 4, first aid | Registered nurse |
| Management diploma | $600 | 300 | Efficiency 3, charm 3 | Hospitality/retail management and executive work |

Qualifications persist. An earned course cannot be repurchased for duplicate XP. Basic paid study and free library reading build intelligence before qualifications are available.

## Living costs, rewards and minigames

Starter cash remains $120. Coffee costs $9 for 22 energy; lunch $18 for 40 energy; a hot meal $20 for 45 energy and 10 health. Bag items cost $6 for an apple (12 energy/5 health), $14 for a sandwich (35 energy), and $30 for first aid (40 health). Clinic treatment costs $40. Free home/park recovery keeps a broke player from becoming permanently unable to work. V2 adds no rent or stock/property system.

The first Mayor mission pays $45 and 14 XP; the second pays $75 and 20 XP; the Gang mission pays $60 and 16 XP. Central mission multipliers are 0.75 cash and 0.4 XP relative to V1. Already claimed rewards are not clawed back.

The precision shift pays $3–$8 according to timing, costs 8 energy, and needs a 13.5-second activity timer after the interactive stop. It grants 3 character XP and 2 efficiency XP, not a whole skill level. Pickpocketing also takes that time, has a real chance of losing $25 and 10 health, and grants only 3 character XP on success. Slots grant no XP. Their existing paytable has a theoretical 89.6% return with five uniformly sampled symbols: it is a cash risk rather than guaranteed income.

## Saves and developer testing

The original `stick-city-v1` key is retained. Automatic migration backs up the raw V1 save under `stick-city-v1.backup-pre-v2`, preserves assets, clock, missions, visits and earned character/skill levels, and converts partial character XP to the same fraction of the new threshold. Existing skills start with zero partial skill XP. Qualifications are initially empty. New pending timers survive saving and loading.

Settings → **DEV**, or **F2**, opens testing tools. Money/XP/level/skill/qualification/time changes, imports, resource bypasses and movement cheats mark the save **DEV-ALTERED**. Temporary infinite-resource, speed, noclip and simulation-pause flags are never serialized and reset on reload. The explicit developer **Finish current activity** button bypasses the timer and marks the save; normal time controls do not. Resetting a save requires confirmation. Import uses JSON parsing and schema validation, never code evaluation, and leaves the current state unchanged on invalid data.
