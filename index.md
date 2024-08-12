---
title: OverShifted's blog
description: My blog's homepage

layout: page
# hide_title: true
---

Hi, I am Sepehr. Here I write what I think. If you're interested to know who I am, read [this page](/about). If you feel so hungry, here's the [Atom Feed](/feed.xml) for [my blog](/posts).

<div>
    <label style="margin-bottom: 0"><input type="checkbox" id="backfire-toggle"/>Spice it up 🔥</label>
    <br>
    <span class="muted">(Requires JS and canvas. Might not be as pleasing on touch devices!)</span>
    <br>
    <div id="spice-settings" class="hidden">
        <span class="muted"># of particles: <span id="spice-particle-count">0</span></span>
        <br>
        <label style="margin-top: 0.6em"><input type="checkbox" id="backfire-pixelate-toggle"/>Pixelate the spice 👾</label>
        <br>
        <label><input type="checkbox" id="backfire-massive-toggle"/>I have so many resources to waste ⛽</label>
    </div>
</div>
<!-- <input type = "range" min="0" max="150" value="120" step="1" id="backfire-max-particle-count"/> -->

Here you can find:
- [My Posts](/posts)
- [My Projects](/projects)
- [A little biography](/about)
<!-- - [My neighbours](/neighbours) -->

### Links:
- Email: [prowidgs@gmail.com](mailto:prowidgs@gmail.com)
- Discord: @OverShifted
- Github: [@OverShifted](https://github.com/OverShifted)

<canvas id="backfire-canvas"></canvas>
<script src="/assets/js/backfire.js"></script>

This website was built using [Jekyll](https://jekyllrb.com/) and a custom theme utilizing [Water.css](https://watercss.kognise.dev/).
