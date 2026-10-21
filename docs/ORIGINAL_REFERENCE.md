# Original reference: Stick City RPG (2015)

## Identity and scope

This project targets **Stick City RPG**, the 2015 iPhone game by **Thomas Bizal**, App Store ID `1003767328`. Developer identity and title are confirmed by the archived AppsHunter and TouchArcade listings. It does **not** target XGen Studios' Stick RPG or Stick RPG 2. The contemporary 148Apps review describes Stick City RPG as a sequel to Stick Town RPG; that relationship does not make their artwork interchangeable.

## Research and source access

Research began before implementation on 21 October 2026. Initial requests to all five supplied references received proxy `403 Forbidden`. After network configuration was updated, **all five reference HTML pages loaded successfully**. Five authentic promotional screenshots embedded in the developer's MacRumors announcement were then downloaded through that site's image proxy and visually inspected. This supersedes the initial reference-access limitation.

| Reference | Evidence inspected |
| --- | --- |
| [AppsHunter archived listing](https://appshunter.io/ios/app/stick-city-rpg/id1003767328) | Title, developer, descriptions and exact screenshot URLs; its separate image CDN remained blocked during research |
| [AppStorio original iPhone listing](https://stick-city-rpg.appstor.io/) | Original listing and screenshot URLs; Apple image CDN was not needed because the developer's images were accessible |
| [MacRumors developer announcement](https://forums.macrumors.com/threads/stick-city-rpg-free-a-stick-figure-rpg-game-with-a-lot-of-depth-to-it-set-in-a-massive-city.1920414/) | 24 September 2015 post by `tbiz5270`; original feature list; five authentic 322 × 572 portrait promotional screenshots, including two city views, slots, statistics and world overview |
| [148Apps review](https://www.148apps.com/stick-town-rpg/stick-city-rpg-review/) | Jennifer Allen's 1 October 2015 review: block-shaped city and stick people, Mayor/Gang Leader missions as optional tutorial/direction, work/crime/gym and mini-games |
| [TouchArcade listing](https://toucharcade.com/games/stick-city-rpg) | Thomas Bizal credit, original descriptive copy and detailed advertised features |

Reference images were retained for local research at `/tmp/stick-reference/macrumors-0.jpg` through `macrumors-4.jpg`. They are not copied into game assets or the public site. A temporary reference download is not a durable repository asset.

## Direct visual observations

The following observations come from the authentic MacRumors images, rather than inferred appearance from the brief:

### Portrait city views (images 0 and 1)

- The screen is 322 × 572 in the archived promotional images, close to a 9:16 portrait ratio. A compact HUD fills roughly the upper 95 pixels, approximately one sixth of the image. Promotional banners cover the lower portion and are not game UI.
- Roads are flat medium-dark grey, approximately `#565656`, with a thin **white** dashed centre line. A visible vertical street is approximately 125 pixels wide; adjacent square-slab grey pavements are about 29 pixels wide.
- Pavement slabs use thin darker grey divisions. Grass and tree areas are saturated bright greens; trees show simple darker outline/shading. The world overview shows connected rectangular blocks, roads, water and small distinct facilities.
- Characters are tiny overhead marks: cyan or coloured outlined circular heads/bodies, tiny black arm dots/strokes and short black stick limbs. Some motion/direction poses place the stick portion above or below the circle. They do not use a flesh-coloured human head plus detailed hair on a coloured torso.
- Vehicles use saturated colours and black outlines, black/dark windows, distinctive windscreens and roofs. A red and a yellow car are roughly 40 pixels wide and 90 pixels long in these close city views. A green aircraft is also visible in one promotional image, but aircraft are outside this version's scope.
- Buildings are simple grey geometric forms with bright cyan/white rectangular windows, strong dark outlines, dark trim and brown doors. Close-up building façades include diagonal edges or a slight oblique wall drawing. The user specifically requires a strictly overhead implementation, so this project's roof/wall detailing follows that constraint rather than copying an oblique façade wholesale.
- The visual language is simple and high contrast, not muted painterly artwork or modern pixel art.

### HUD (images 0, 1 and 3)

- Semi-transparent dark grey panels, thin light outlines and bold white labels sit over the city.
- White player icon and outlined envelope are at top left. Yellow star and `Level 7` are near upper centre, with a horizontal grey XP track below and **green** XP fill.
- Blue/cyan clock and `06:00 AM` appear below on the left, with money and a banknote icon below that.
- Yellow lightning and energy fraction, then red heart and health fraction, sit in the centre/right portion.
- White globe and gear icons are at upper right. A white/black outlined bar-chart statistics icon appears below them.
- The original uses plain bold sans-serif text, compact iconography and hard-edged boxes rather than large rounded cards.

### Statistics (image 3)

- A light grey modal with thick dark outlines is titled `Stats`, with a large outlined `X` close control at the upper right.
- Stacked medium-grey bordered panels show `Character`, `Efficiency`, `Charm` and `Intelligence` in large bold white text, level labels, brief effects and horizontal green XP bars.
- Yellow star, green chevrons, yellow smiling face and yellow lightbulb differentiate rows.
- Readable text states that each character level raises maximum energy by 15; Efficiency reduces activity time/energy; Charm reduces purchase costs and increases work earnings. Exact remaining formulas are not visible and must not be claimed recovered.

### Slots (image 2)

- Plain white background around a dark grey, thick black-bordered machine.
- Bright green `Slot Machine`, bet, money and winnings captions.
- A 3 × 3 white reel grid uses large coloured card-style symbols: fleur-de-lis, Q, A, dollar signs, J, K and 10. The middle winning row has a blue outline/payline.
- This version may use a smaller original reel implementation, but the source is clearly a straightforward arcade panel, not a photorealistic casino machine.

## Directly confirmed original scope

The developer's MacRumors post and TouchArcade listing advertise nearly 100 unique buildings, over 20 mini-games, 10 skills, **25 Mayor missions and 25 Gang Leader missions**, items/outfits/weapons/body armour, NPC interaction, crime, casino games, stock market, property income and multiple vehicle types. These are advertised features, not a claim that every original feature was tested personally.

The 148Apps review confirms optional Mayor/Gang Leader tasks, free exploration, jobs, gym activities and many mini-games. Its verdict describes the original as varied and flexible despite simple block/stick artwork. Those observations support a compact district with genuine activities rather than a static visual mock-up.

## Project interpretation and approximations

All project artwork is newly drawn. Original screenshots are reference material only. The starting district, building footprints, street layout, names/dialogue, mission objectives, economy, XP thresholds, skill formulas, animation speed and timing challenges are original approximations. They should not be represented as extracted original game data.

The user's strict overhead viewpoint, tap-to-walk controls, portrait viewport, collisions, compact original-style HUD, grey activity panels and smaller complete playable district govern the implementation. Exact historical fidelity remains limited by the promotional images' small resolution and lack of an executable original build. No original gameplay video was viewed during this session.

## Visual comparison checklist

Compare the generated gameplay capture against MacRumors images 0/1 and the stats panel against image 3:

1. Preserve the portrait composition and compact upper HUD.
2. Prefer grey/cyan/high-contrast city colours, bright greens and saturated vehicle colours.
3. Keep thin white dashed roads, visible pavement slabs and strong geometric building/window detail.
4. Use small bright circular characters with tiny black limbs; avoid detailed hair/flesh portraits for world sprites.
5. Check character/car/road scale and city scrolling; a larger version-one roof-based district will not reproduce the original full map.
6. Use bold labels, dark grey or grey activity panels, clear borders and green progress bars where practical.

The final implementation comparison and any remaining visual differences belong in the project's test report. This document records the authentic sources and the observations available to make that comparison honest.
