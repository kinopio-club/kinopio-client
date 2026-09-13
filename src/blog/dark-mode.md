---
title: 'Dark Mode'
metaDate: 'Jan 24, 2022'
date: 2023-01-24
category: New Stuff
image: 'https://updates.kinopio.club/dark-mode-thumb-small.png'
description: Whether you're a night owl or into the mysterious and cool, dark mode is here for you
---

Whether you're a night owl or into the mysterious and cool, dark mode is here for you.

`User → Settings → Theme Colors`

Or press `t` to switch themes

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/dark-mode.mp4">
</video>
</p>

# Implementation Notes

I've made dark themes for apps [in the past](https://twitter.com/pketh/status/1616945831357353984), but it's another level of complexity when card/connection/tag colors and backgrounds can be completely customized.

## Dark Mode Principles

1. User customizations are respected first. If the user sets a color for something (cards, boxes, tags etc.) then that color (or a dark tinted variant thereof) is used. This keeps the spirit of personalized spaces intact.
2. Default colors are based on current theme. so if you're in dark mode then by default the colorpicker , new connection, new tag, and new box colors will be dark colors. The assumption is that if you're using the dark theme you'll most likely prefer using dark colors for things, and vice versa.
3. In cases where a color creates legibility issues, (primarily the paint select dialog when you're in dark mode but have a really light user color), then slightly darken that color where needed.
