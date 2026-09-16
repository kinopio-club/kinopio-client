---
title: 'Box Snapping'
date: 2023-01-11
category: New Stuff
image: 'https://kinopio-blog.us-east-1.linodeobjects.com/box-snapping-thumb2.jpeg'
description: Drag boxes close to each other to snap them together
---

Drag boxes close to each other to snap them together.

Helpful for building simple grids and tables that you can use for illustrating sequences and whatever else

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/box-snapping.mp4">
</video>
</p>

# Implementation Notes

This'll make more sense later but I built this as a prerequisite for an upcoming re-positioning/re-launch of Kinopio. To that end – inspired by this computer case [assembly guide](https://teenage.engineering/_img/6399cd15132d7e0af3c8620c_original.pdf) – I wanted the ability to build a grid for displaying sequences of step-by-step instructions.

As humans we intuitively know when two things are `close` to each other. But programming closeness presents many little problems, like:

- What does closeness *actually* mean? These two boxes have `x` values that are very similar, but the boxes are not what you'd perceive as close.

<img class="narrow" src="https://kinopio-blog.us-east-1.linodeobjects.com/box-snap-close-x.svg">


I'm using a combination of proximity (the distance between two matching side points, such as the center-left side of one box and the center-right side of another), as well as x or y axis distance. It ends up looking something like this:

<img class="narrow" src="https://kinopio-blog.us-east-1.linodeobjects.com/box-snap-snapping%20copy.svg">

- How should I indicate when boxes are close enough to snap together?

In typical design software, vertical or horizontal snapping guidelines are used to indicate when you can align things.

In the context of Kinopio though, encouraging content to be geometrically aligned or conform to the grid is not the goal. In the context of thinking, feeling like things have to be neat and orderly is oppressive friction.

After a couple public [iterations](https://twitter.com/pketh/status/1612907840586260481), I made the snapping sides of each box undulate together. It's a very simple ease-in-out animation but I like the impression of *yearning* that the boxes appear to have for each other – it's pretty cool/romantic.

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://kinopio-blog.us-east-1.linodeobjects.com/box-snapping-yearning.mp4">
</video>
</p>
