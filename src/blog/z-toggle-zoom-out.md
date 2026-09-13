---
title: 'Z-Toggle Zoom Out'
metaDate: 'Jan 7, 2022'
date: 2023-01-07
category: New Stuff
image: 'https://kinopio-blog.us-east-1.linodeobjects.com/z-toggle-zoom-out-thumbnail.png'
description: Press Z to instantly zoom all the way out or in. A little feature that gives you big perspective
---

Press Z to instantly zoom all the way out or in. A little feature that gives you big perspective

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/z-toggle-zoom-out.mp4">
</video>
</p>

# Implementation Notes

This replaces the previous minimap feature which was implemented by drawing a representation of the cards and connections to a single `<canvas>`. It was a totally seperate renderer optimized for high speed and low interactivity, basically like a micro-Figma inside of Kinopio.

<p>
<video class="" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/minimap-small.mp4">
</video>
</p>

While the minimap demo-ed really well, I decided to remove it because:

- It would have required significant work to get it working with recent performance optimizations
- Development of the minimap predated zooming, and a fully zoomed out space does basically the same thing
- The minimap wasn't actually used much by people IRL
- It's one less button/mode and less code to maintain

I guess the lesson to myself for the future: It's feels bad saying no, but it feels worse building cool-looking big features that very few people very rarely use
