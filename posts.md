---
title: My Posts
layout: page
description: List of my posts
---

Hi, I am Sepehr. Here I write what I think. If you're interested to know who I am, read this page. If you feel so hungry, here's my [Atom Feed](/feed.xml).

<div id="post-widgets-container">
    {% for post in site.posts %}
        <li>
             {% include post-widget.html post=post %}
        </li>
    {% endfor %}
</div>
