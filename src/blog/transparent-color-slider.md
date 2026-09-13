---
title: 'Transparent Color Slider'
metaDate: 'Mar 9, 2023'
date: 2023-03-09
category: New Stuff
video: 'https://updates.kinopio.club/transparent-color-slider.mp4'
description: More creative controls to get your cards looking *just* right
---

More creative controls to get your cards looking *just* right (also works with boxes, and background tint color too)

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/transparent-color-slider.mp4">
</video>
</p>

# Implementation Notes

While [building Ways to pass time inside this room](https://www.youtube.com/watch?v=j5yqp_L3pxM), I heavily relied on the secret ability to use `transparent` as the card color to improve the presentation of cards on [this space](https://kinopio.club/ways-to-pass-time-inside-this-room-ait5GV1oTkV9fu026GUWr). 

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://kinopio-blog.us-east-1.linodeobjects.com/pass-time-inside-this-room.mp4">
</video>
</p>

I figured more people would benefit knowing about this feature so I updated the color picker to add a `transparent` shortcut button

![](https://kinopio-blog.us-east-1.linodeobjects.com/transparent-color-button.png)

It was cool that more people knew about transparency, but I didn't love how the extra button seemed to make the ColorPicker dialog feel overly technical. Ben in the [Community Discord](https://discord.gg/h2sR45Nby8) suggested a slider, and I think that approach turned out great. 

In addition to a couple other color math functions, I'm using [colord](https://github.com/omgovich/colord) here to convert colors from hex to rgba and apply the alpha channel dynamically.
