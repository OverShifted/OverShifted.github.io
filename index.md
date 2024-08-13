---
title: OverShifted's blog
description: My blog's homepage

layout: page
# hide_title: true
---

Hi, I am Sepehr. Here I write what I think. If you're interested to know who I am, read [this page](/about). If you feel so hungry, here's the [Atom Feed](/feed.xml) for [my blog](/posts).

<div>
    <label style="margin-bottom: 0"><input type="checkbox" id="spice-toggle"/>Spice it up 🔥</label>
    <br>
    <span class="muted">(Requires JS and canvas. Might not be as pleasing on touch devices!)</span>
    <br>
    <div id="spice-settings" class="hidden">
        <span class="muted"># of particles: <span id="spice-particle-count">0</span></span>
        <br>
        <label style="margin-top: 0.6em"><input type="checkbox" id="spice-pixelate-toggle"/>Pixelate the spice 👾</label>
        <br>
        <label><input type="checkbox" id="spice-massive-toggle"/>I have so many resources to waste ⛽</label>
        <br>
        <a href="/assets/js/spice.js" id="spice-souce-code-link">(Spice souce code)</a>
    </div>
</div>
<!-- <input type = "range" min="0" max="150" value="120" step="1" id="spice-max-particle-count"/> -->

Here you can find:
- [My Posts](/posts)
- [My Projects](/projects)
- [A little biography](/about)
<!-- - [My neighbours](/neighbours) -->

### Links:
- Email: [prowidgs@gmail.com](mailto:prowidgs@gmail.com)
- Discord: @OverShifted
- Github: [@OverShifted](https://github.com/OverShifted)

<canvas id="spice-canvas"></canvas>
<script src="/assets/js/spice.js"></script>

This website was built using [Jekyll](https://jekyllrb.com/) and a custom theme utilizing [Water.css](https://watercss.kognise.dev/).
