---
title: Cracking River Raid with Stella emulator
desc: I went through cracking an old Atari game with the help of an emulator
date: 2021-08-28 11:23 AM

layout: post
---

```python
class Player:
    def update():
        print(self)

player = Player()
player.update()
```

River Raid is an old Atari game where you should fly over a river without hitting hills, ships and other aircrafts, and not running out of fuel.
And this is how I managed to crack the game by changing its assembly code, in a way that I will never lose the game.

### Getting started
To follow this guide, you are going to need the Stella emulator and River Raid ROM. Which you can find [here](https://stella-emu.github.io/downloads.html) and [here](http://www.atarimania.com/game-atari-2600-vcs-river-raid_s6826.html).

After installing and running Stella, you should see something like this:

![stella_home](/assets/cracking_river_raid/stella_home.png)

To load the ROM, open the downloaded zip file or the `.bin` file inside it, in Stella.

![stella_running_river_raid](/assets/cracking_river_raid/stella_running_river_raid.png)

To start the game on a real Atari, you need to press the `reset` button. On Stella, this key is mapped to the `F2` key by default. So press it and start playing the game. Right and left arrows will move the player and the space key will shoot some missiles.

![playing_river_raid_on_stella](/assets/cracking_river_raid/playing_river_raid_on_stella.png)

There are three ways to lose the game:
1. Colliding with ships, aircrafts and bridges 🚁
2. Colliding with hills 🌲 (green parts)
3. Running out of fuel ⛽

Two first "ways" of losing are pretty similar, but are handled diffrently in the game.

## Collision detection
Unlike modern games which use seprated systems for rendering and physics, older games detected collisions between diffrent objects while rendering.
Atari lets you define a ***limited number*** of sprites, with ***limited sizes***. Then you can tell the system where to render these sprites. During rendering, when the scanline "scans" the screen, the system also checks for collision between those sprites and change some registers accordingly. To explore this, press the `~` key (next to `1`) to enter Stella's debug mode. the game will be paused automatically.

![stella_debug_mode](/assets/cracking_river_raid/stella_debug_mode.png)

Head over to `TIA` tab to see graphics and collision information. Then enable `Debug Colors` option. It will allow us to detect where sprites are rendered on the screen. To see changes; click `Frame +1` key to render another frame with debug colors.

![tia_tab](/assets/cracking_river_raid/tia_tab.png)

It will give us a weird looking image.
Lets forget about the in-game-GUI for now and focus on the color of the rest of the screen.

1. Player is rendered in red.
2. Enemies and fuel (gas) stations are rendered in yellow.
3. Hills are rendered in purple.

By looking at the colors under the `Debug Colors` checkbox, You can see which sprite is associated with each part of the screen.

![color_codes](/assets/cracking_river_raid/color_codes.png)


| Object Name      | Atari Sprite ID |
|------------------|-----------------|
| Player           | P0              |
| Enemies and fuel | P1              |
| Hills            | PF              |

We can use the sprite ID of each object to check for collisions of that object.
For example to check for collisions between `Player` and `Enemies`, you can check for collision between `P0` and `P1`.

### Collision Registers
There are a [few registers which store collision information](https://www.masswerk.at/rc2018/04/08.html).
And here they are:

| Register name and address| 7th bit | 6th bit      |
|--------------------------|---------|--------------|
| `CXM0P`  `0x0`           | `M0-P1` | `M0-P0`      |
| `CXM1P`  `0x1`           | `M1-P0` | `M1-P1`      |
| `CXP0FB` `0x2`           | `P0-PF` | `P0-LB`      |
| `CXP1FB` `0x3`           | `P1-PF` | `P1-BL`      |
| `CXM0FB` `0x4`           | `M0-PF` | `M0-BL`      |
| `CXM1FB` `0x5`           | `M1-PF` | `M1-BL`      |
| `CXBLPF` `0x6`           | `BL-PF` | ***unused*** |
| `CXPPMM` `0x7`           | `P0-P1` | `M0-M1`      |

This table shows what is stored in each bit of each register.
For example, if `P0` and `P1` are colliding, 7th (last) bit of the `CXPPMM` register will be set to `1`.

## Passing through enemies
Now that we know which register stores `P0-P1` collision; We can search the disassembly to see when it is used.

Unfortunately I couldn't find a way to do that automatically in Stella (like "find" operation in many text editors). But there are two other ways for doing that:
1. Scrolling throw the disassembly section of the Stella and look for `CXPPMM` (It actually works because the code is very small)
2. Write a code to do that for us

First way is pretty straight forward. But second one is harder. Because if you want to search for a bit with value of `0x7` (`0x7` is address of `CXPPMM`); You will get alot of matches which do not mean `CXPPMM`. Like this one:

![invalid_0x07_match](/assets/cracking_river_raid/invalid_0x07_match.png)

Here, `0x07` means `COLUP1` instead of `CXPPMM`.

After following first way, you will find a first match at `0x2f3` (aka `f2f3`):

![first_CXPPMM_match.png](/assets/cracking_river_raid/first_CXPPMM_match.png)

Great! But what does it mean?

Looking at [here](https://www.c64-wiki.com/wiki/BIT_(assembler)), you will see that:
> Bit 7 (...) is transferred directly into the negative flag.

Did you noticed that?!

`bit CXPPMM` will do alot of stuff. One of them is moving 7th bit of the `CXPPMM` register to proccessor's negative flag.

So if the value stored in the negative flag is `1`, then `P0` is colliding with `P1`!

The next instruction is `bpl Lf2f9`. `bpl` means "Jump if positive". Being positive means negative flag is set to `0`.
So if the negative flag is set to `0`, it will jump to the instruction at location `Lf2f9`. Which means ***if `P0` and `P1` are not colliding, jump to `Lf2f9` and continue execution from there.***

So between `Lf2f5` and `Lf2f9`, should be where increasing fuel and/or losing the game by hitting enemies is handled. So we need to remove that code!

But we can't just delete those two bytes. Because it will mess jumping locations up. So we should replace them with something which does nothing.

Hopefully, there is a `nop` instruction which means "No Operation". It does nothing. We should change `stx ram_E8` to `nop nop`

Stella only allows you to modify the hex version of the disassembly. But I've got you covered! The hex equivalent to `nop` is `0xEA`. So just double click on the hex on the right side and replace `86 e8` with `ea ea`.

Similarly, repeat the same replacement at location `Lf487`.

Now hit the `Exit` button (or `Run` button on newer versions) under the `Frame +1` button and enjoy playing game without ever losing by hitting enemies!

## Passing through hills
Likewise, you can tell that collision between the player and hills (`P0-PF`) is stored in 7th bit of the `CXP0FB` register.
After searching for `bit CXP0FB`, you can find two at `Lf2E7` and `Lf462`. Both are followed by a `bpl` instruction; So replacing next two bytes after the `bpl` instructions with `ea ea` will make us fly through hills as well.

## Endless fuel
By tracking values stored in RAM, you will be able to guess where fuel value is stored. Test your guesses by modifying that value and observing what happens next.

After trail and error, it tured out that byte `0xb7` is the correct address.
Now, there is a `dec ram_B7` instruction at address `Lf64c`. It basically decrements the value stored at `ram_B7`. Replace that with `ea ea` and we are done.

## Summary
Override the byte these address are pointing to and the next byte that comes after it with `ea ea`:
1. `f2eb`  (for hills)
2. `f2f7`  (for enemies)
3. `f466`  (for hills)
4. `f487`  (for enemies)
5. `Lf64c` (for fuel)
