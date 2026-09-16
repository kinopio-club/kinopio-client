---
title: 'Positional Zoom'
date: 2023-01-02
category: New Stuff
video: 'https://updates.kinopio.club/positional-zoom-thumbnail.mp4'
description: Drag the zoom slider or hold cmd/ctrl while scrolling to zoom out for perspective on large spaces
---

Drag the zoom slider or hold cmd/ctrl while scrolling to zoom out for perspective on large spaces.

And of course, you can still comfortably add and edit cards while zoomed out – no squinting required.

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/positional-zoom.mp4">
</video>
</p>


## Implementation Notes

> From now on this blog is the canonical place where new feature announcements live (before it was Twitter). This'll make it easier to add additional notes for the technically curious and inclined.

Regarding zoom,

While this update is a big improvement on the previous zoom system, there's still a lot of kinks to iron out.

But you might wonder, why is zoom so hard? There's plenty of other apps that have zoom afterall. The short version is that there's different styles of zoom: `center 0,0` and `top-left 0,0`.

<img class="narrow" src="https://kinopio-blog.us-east-1.linodeobjects.com/zoom-center-origin.svg">

`Center` zooming allows cards to have negative coordinate positions and is fully unbounded and unlimited. The advantage of this system is that content can be put anywhere you want and the math is relatively straightforward.

One downside though is that you're more likely to lose your position and need a minimap to reorient yourself. But the biggest impact of losing the constraint of a traditional page is … losing that constraint. The boundaries of a page is familiar and reassuring – they shape how we organize information, and make it easier to create share-able spaces.

<img class="narrow" src="https://kinopio-blog.us-east-1.linodeobjects.com/zoom-left-origin.svg">

`Top-Left` zooming relies on the principles of regular webpage document. But having a viewport inside a page with an origin that changes based on where you zoomed from introduces brain twisting challenges…

<img class="narrow" src="https://kinopio-blog.us-east-1.linodeobjects.com/zoom-left-origin-zoomed.svg">
