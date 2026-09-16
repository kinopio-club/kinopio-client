---
title: 'Generated Backgrounds'
date: 2023-11-10
category: New Stuff
image: 'https://updates.kinopio.club/generated-background-thumb.jpeg'
description: Generated backgrounds make finding the right vibe a lot easier
---


If you're like me, one of the first things you do when creating a new space is picking *juuust* the right background. Generated backgrounds make getting started off right a lot easier.

They're also unique – no two are the same.

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/generated-backgrounds.mp4">
</video>
</p>

To take less attention from your content, UI buttons also now blend into the background.

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/translucent-ui-buttons.mp4">
</video>
</p>

However, if you prefer high contrast buttons without any translucency, you can toggle that in `User → Settings → Controls → Increase UI Contrast`

## Backstory

This was [first requested](https://club.kinopio.club/t/generated-backgrounds/806) about a year ago. But in the spirit of measuring twice and cutting once, it took me a while to figure out how best to build it.

My implementation was inspired by [Shelby Wilson's](https://shelby.cool/#/gradients) gradient technique where 6 different radial gradients are layered on top of each other with alternating opacities. I recommend checking out her other [web experiments](https://shelby.cool/#) too.

But actually drawing the gradients turned out to be the easy part. The Kinopio background system was originally built with two implicit assumptions:

1. a space `background` is an image URL.
2. if no background is set, the space should use the default background image. This is because originally, backgrounds weren't customizable.

Which was upended to:

1. spaces can have a `background` image url, but they can also have a `backgroundGradient` JSON object which describes the gradient layers. The space `backgroundIsGradient` boolean determines whether to draw the background with an image url or gradient. More info on these attributes is in the [API docs](https://kinopio.club/api/)
2. If no background is set, the space uses a blank background instead. I think this is a more intuitive behaviour for new users.
