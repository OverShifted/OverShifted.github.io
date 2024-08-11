---
title: My Posts
layout: page
description: List of my posts
---

This is where I write stuff. An [Atom feed](/feed.xml) is also available.

<div id="post-widgets-container">
    {% for post in site.posts %}
        <li>
             {% include post-widget.html post=post %}
        </li>
    {% endfor %}
</div>
