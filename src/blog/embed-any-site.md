---
title: 'Embed Any Site'
metaDate: 'Jun 22, 2023'
date: 2023-06-22
category: New Stuff
image: 'https://kinopio-blog.us-east-1.linodeobjects.com/embed-any-site-thumbnail.png'
description: Bring more of the web into your spaces by pasting in songs, albums, and document links
---

Bring more of the web into your spaces by pasting in songs, albums, and document links.

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/embed-any-site.mp4">
</video>
</p>



## Implementation Notes

This replaces the previous youtube-only embed support with a general solution that works for any site supported by [iFramely](https://iframely.com/try).

The reason you have to click play to start the embed is primarily for privacy and performance reasons. When loaded, most embeds execute dozens of tracking scripts. The last thing I want is for spaces to slowdown as you add links to them.