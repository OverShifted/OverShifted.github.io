---
title: Cracking River Raid with Stella emulator
desc: I went through cracking an old Atari game with the help of an emulator
date: 2021-08-28 11:23 AM

layout: post
---

River Raid is an old Atari game where you should fly over a river without hitting hills, ships and other aircrafts, without running out of fuel.
And this is how I managed to crack the game by changing its assembly code, in a way that I will never lose the game.

## Getting started
To follow this guide, you are going to need the Stella emulator and the River Raid ROM. Which you can find [here](https://stella-emu.github.io/downloads.html) and [here](http://www.atarimania.com/game-atari-2600-vcs-river-raid_s6826.html).

Now, run Stella and find the downloaded ROM file (It is probably a `.zip` file), you should see something like this:

> **_NOTE:_** If you are using an older version of Stella, you might need to manually unzip the file and look for the `.bin` file inside it.

{% include themed-img.html
    alt="stella_home"
    light="/assets/cracking_river_raid/new-images/1l.png"
    dark="/assets/cracking_river_raid/new-images/1d.png" %}

Then, load the ROM by double-clicking on it. The game should start running:

![stella_running_river_raid](/assets/cracking_river_raid/new-images/2.png)

But, to *really* start the game on a real Atari, you need to press the `reset` button. On Stella, this key is mapped to `F2` by default. So press it and start playing the game. Right and left arrows will move the player and space will fire some missiles.

![playing_river_raid_on_stella](/assets/cracking_river_raid/new-images/3.png)

There are three ways to lose the game:
1. Colliding with ships, aircrafts and bridges 🚁
2. Colliding with hills 🌲 (green parts)
3. Running out of fuel ⛽

Two first "ways" of losing are pretty similar, but are handled quite differently in the game.

## Collision detection
Unlike modern games which usually use seprated systems for rendering and physics, older games detected collisions between different objects while rendering.
Atari lets you define a limited number of sprites, with limited sizes. Then you can tell the system where to render these sprites. During rendering, when the scanline "scans" the screen, the system also checks for collision between those sprites and changes some registers accordingly. To explore this, press the `~` key (next to `1`) to enter Stella's debug mode. the game will be paused automatically.

{% include themed-img.html
    alt="stella_debug_mode"
    light="/assets/cracking_river_raid/new-images/4l.png"
    dark="/assets/cracking_river_raid/new-images/4d.png" %}

Head over to `TIA` tab to see graphics and collision information. Then, check the `Debug Colors` option. It will allow us to detect where sprites are rendered on the screen. To see the changes, click the `Frame +1` button to render the next frame with debug colors.

{% include themed-img.html
    alt="tia_tab"
    light="/assets/cracking_river_raid/new-images/5l-overlay.png"
    dark="/assets/cracking_river_raid/new-images/5d-overlay.png" %}

It will show us a weird looking image. As you can see:

1. Player is rendered in red.
2. Enemies and fuel (gas) stations are rendered in yellow.
3. Hills are rendered in purple.

By looking at the colors under the `Debug Colors` checkbox, You can see which *sprite code* is associated with each part of the screen.

{% include themed-img.html
    alt="color_codes"
    light="/assets/cracking_river_raid/new-images/6l-cropped.png"
    dark="/assets/cracking_river_raid/new-images/6d-cropped.png" %}


| Object Name      | Atari Sprite ID                                               |
|------------------|---------------------------------------------------------------|
| Player           | P0                                                            |
| Enemies and fuel | P1 (Who cares if it's got "player" in it's name?)             |
| Hills            | PF                                                            |

We can use the sprite ID of each object to check for collisions of that object.
For example to check for collisions between `Player` and `Enemies`, you can check for collision between `P0` and `P1`.

### Collision Registers
There are a [few registers which store collision information](https://www.masswerk.at/rc2018/04/08.html).
And here they are:

| Reg. name | Reg. address | 7th bit | 6th bit      |
|--------------------------|---------|--------------|
| `CXM0P`   | `0x0`        | `M0-P1` | `M0-P0`      |
| `CXM1P`   | `0x1`        | `M1-P0` | `M1-P1`      |
| `CXP0FB`  | `0x2`        | `P0-PF` | `P0-LB`      |
| `CXP1FB`  | `0x3`        | `P1-PF` | `P1-BL`      |
| `CXM0FB`  | `0x4`        | `M0-PF` | `M0-BL`      |
| `CXM1FB`  | `0x5`        | `M1-PF` | `M1-BL`      |
| `CXBLPF`  | `0x6`        | `BL-PF` | ***unused*** |
| `CXPPMM`  | `0x7`        | `P0-P1` | `M0-M1`      |

This table shows what is stored in each bit of each register.
For example, if `P0` and `P1` are colliding, 7th (last) bit of the `CXPPMM` register will be set to `1`.

## Passing through enemies
Now that we know which register stores `P0-P1` collision; We can search the disassembly to see when it is read.

Unfortunately I couldn't find a way to do that automatically in Stella (like the "find" operation in many text editors). But there are two other ways for doing that:
1. Scrolling throw the disassembly section of the Stella and look for `CXPPMM` (It actually works because the program is pretty small)
2. Write a code to do that for us

First way is pretty straight forward. But second one is *a bit* harder. Because if you want to search for a bit with value of `0x7` (`0x7` is the address of `CXPPMM`); You will get alot of matches which do not *actually* mean `CXPPMM`. Like this one:

{% include themed-img.html
    alt="color_codes"
    light="/assets/cracking_river_raid/new-images/7l-cropped.png"
    dark="/assets/cracking_river_raid/new-images/7d-cropped.png" %}

Here, `0x07` is interpreted as `COLUP1` instead of `CXPPMM`.

By following first way, you will find the first match at address `0x2f3` (aka `f2f3`):

{% include themed-img.html
    alt="color_codes"
    light="/assets/cracking_river_raid/new-images/8l-cropped.png"
    dark="/assets/cracking_river_raid/new-images/8d-cropped.png" %}

Great! But what does it mean?

Looking at [here](https://www.c64-wiki.com/wiki/BIT_(assembler)), it says:
> Bit 7 (...) is transferred directly into the negative flag.

Did you notice that?!

`bit CXPPMM` will do alot of stuff. One of which is moving 7th bit of the `CXPPMM` register to proccessor's negative flag.

So if the value stored in the negative flag is `1`, then `P0` is colliding with `P1`!

The next instruction is `bpl Lf2f9`. `bpl` means "jump if positive". Being positive means that the negative flag is set to `0`.
So if the negative flag is set to `0`, it will jump to the instruction at location `0x2f9`.

These two instructions can roughly be translated to plain English as:
> If `P0` and `P1` are not colliding, jump to `0x2f9` and continue execution from there.

Doing the jumps means skipping the code between `0x2f5` and `0x2f9` (Which happens to be only a single instruction: `stx ram_E8`). So it is probably where increasing fuel and/or losing the game by hitting enemies is handled. (Remember, both enemies and fuel *stations(?)* as rendered as `P1`) So we probably need to remove that code!

But we can't just delete those two bytes, because it will mess up code layout and jump locations. So we should replace them with something which does nothing.

Hopefully, there is a `nop` instruction which means "No Operation". It does nothing. We can change `stx ram_E8` to `nop nop`. (Instructions can have different sizes. `stx ...` needs 2 bytes but `nop` can be stored in a single byte. It means we need two of them to fill the entire 2 bytes of the previous `stx`.)

You can't directly write assembly code in Stella, as it only allows you to modify the assembly directly in hex. But I've got you covered! The hex equivalent to `nop` is `0xEA`. So just double click on the hex on the right side and replace `86 e8` with `ea ea`. (Why don't we have a Valve instruction? 🤔)

Similarly, repeat the same replacement at location `0x487`.

Now hit the `Run` button (or the `Exit` button on older versions) at the top-right corner and enjoy playing game without ever losing by hitting enemies!

## Passing through hills
Likewise, you can tell that collision between the player and hills (`P0-PF`) is stored in the 7th bit of the `CXP0FB` register.
After searching for `bit CXP0FB`, you can find two matches at `0x2E7` and `0x462`. Both are followed by a `bpl` instruction; So replacing next two bytes after the `bpl` instructions with `ea ea` will make us fly through hills as well.

## Endless fuel
By tracking values stored in the RAM, you will be able to guess where the fuel level is stored. Test your guesses by modifying that value (try double-clicking!) and observing what happens next.

So here is my try (spoiler alert!):

After trail and error, it tured out that byte `0xb7` is the correct address.
Now by searching the code for that ram address, I found a `dec ram_B7` instruction at address `0x64c`. It basically decrements the value stored at the RAM at address `0xb7`. Replace that with `ea ea` and we are done.

## Summary
Overriding the 2 bytes these address are pointing to with `ea ea`:
1. `0x2eb`  (for hills)
2. `0x2f7`  (for enemies)
3. `0x466`  (for hills)
4. `0x487`  (for enemies)
5. `0x64c` (for fuel)

Will eventually turn one of the most iconic and popular games of the 1980s to a boring, possibly [zero-player](https://en.wikipedia.org/wiki/Zero-player_game) game. Bye!
