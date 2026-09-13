---
title: 'Import/Export JSON Canvas'
metaDate: 'Mar 14, 2024'
date: 2024-03-14
category: New Stuff
description: Import and Export spaces in the open JSON Canvas format
image: 'https://updates.kinopio.club/import-json-canvas.webp'
---

Kinopio is the first app to support the open [JSON Canvas format](https://jsoncanvas.org), so you can easily import/export spaces between a growing number of spatial apps like Obsidian.

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/import-json-canvas.mp4">
</video>
</p>

## Backstory

I've been following progress on the `.canvas` file spec from a distance for a while. In the past people have requested `.opml` support for similar reasons. But while `.opml` is great for outliners and simple mindmaps, it falls apart when you use it to represent multiple trees that can share child nodes.

The canvas spec is a much better fit because it can represent these structures. I think it'll function a lot better as a unified open base for people to build their own converters for other spatial tools too.

While not every feature is supported by .canvas, the core content of cards, connections, and directions are. Some people would prefer the spec to support everything, but IMO they might not be considering that:

1. Specs work best when they're simple and easy to understand and implement. Most people adding .canvas support right now are doing so altruistically, so it's important that those devs have a good time.
2. There's a huge delta between tools in terms of feature sets and personalization capabilities, so focusing on the parts that they all share is a lot more productive.

If you're curious here's a [code snippet](https://gist.github.com/pketh/fecfb9644abdd663006933fc95173520) showing how the app converts `.canvas` files into kinopio's json space format.
