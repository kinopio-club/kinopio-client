---
title: 'Color Swatch Cards'
date: 2023-01-04
category: New Stuff
image: 'https://kinopio-blog.us-east-1.linodeobjects.com/color-swatch-cards-2.png'
description: If a card is named as a color – like `pink` or `#5e978b` – then it'll become that color
---

If a card is named as a color – like `pink` or `#5e978b` – then it'll become that color.

This can be really helpful for moodboards, where sampled colors can be listed right next to image inspirations.

(Supports all color formats, including HEX, RGB, HSL, and CSS names)

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/color-swatch-cards.mp4">
</video>
</p>


# Implementation Notes

<!-- ![](https://kinopio-blog.us-east-1.linodeobjects.com/color-swatch-cards.png) -->

The idea for this feature came to me while making a moodboard for the upcoming dark theme, it felt natural to sample colors from image cards (using a [native app](https://colorsnapper.com/)), and then paste those colors right next to the original card.

Implementation-wise, I'm using the [colord](https://www.npmjs.com/package/colord) library to determine when a card name is a color.
