---
title: 'Card Dragging Performance Up'
metaDate: 'Nov 22, 2023'
date: 2023-11-22
category: New Stuff
image: 'https://kinopio-blog.us-east-1.linodeobjects.com/please-wait.webp'
description: Significantly improved smoothness of card dragging
---

In a complex space, moving cards could skip frames and go out of sync with the connection lines. Today's release significantly improves the speed and smoothness of card dragging.

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/card-drag-perf.mp4">
</video>
</p>

## Technical Details

For those who asked how this was done:

You never know when ideas will come to you, so when they do I collect ideas for optimizations that come to me in [this space](https://kinopio.club/performance-improvement-ideas-7TppdPf1lcjTV89Kwyw4Y). This performance improvement was one of those.

As you may know, the [kinopio-client](https://pketh.org/how-kinopio-is-made.html) app that runs in your browser uses Vue.js to manage and update state.

The `x,y` position of cards in the currentSpace is tracked in state so that when card positions change, the computed methods in many other components that depend on the position of cards can automatically recompute themselves. (aka `data-binding`)

But the magic of data-binding becomes a liability when an item is updating it's state 60 times a second (`60fps`) – such as when you drag a card around the screen. And if 10 cards are being dragged together, that's 60 × 10 updates a second.

As you might imagine, all this dependency recomputing and repainting can overwhelm the browser causing frame rate hitches.

The way to get around this issue is to just not update state during these kinds of events. So while a card is being dragged, it's position is directly manipulated in the DOM in a very lo-fi way:

```
moveWhileDragging: (state, { cards }) => {
    cards.forEach(card => {
        const element = document.querySelector(`article[data-card-id="${card.id}"]`)
        element.style.left = card.x + 'px'
        element.style.top = card.y + 'px'
    })
},
```

And only after the drag is complete is the Vue state updated with the new card positions. Which means that all that expensive data-bound recomputing only needs to happen only once at the end.