---
title: 'Performance Up ~33%'
date: 2024-03-20
category: New Stuff
description: The latest Kinopio release brings ~33% faster interaction performance
image: 'https://updates.kinopio.club/porsche-overhead-small.webp'
---

The latest Kinopio release brings ~33% faster interaction performance on actions like selecting, moving, and editing cards, and scrolling through big spaces. This results in a smoother and more responsive feeling experience.

<img src="https://updates.kinopio.club/porsche-overhead.jpeg" class="wide"/>

Continuing from the last big [performance improvement](https://kinopio.club/blog/card-dragging-performance-up), the new speed is a result of going through the code behind the most common interactions with a fine tooth comb and an eye towards reducing, delaying, and batching expensive Vuex state updates.

Kinda like boring out and tuning an engine, to squeeze those precious last horsepowers out of it. It's meditative work, but I'm looking forward to picking up the pace.
