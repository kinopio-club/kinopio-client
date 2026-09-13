---
title: 'The Journey to Bending Connections'
metaDate: 'Aug 31, 2026'
date: 2026-08-31
category: New Stuff

description: For a couple months now, on and off, I’ve been working on ways to solve the problem of connection lines always appearing as lines between top-right item connectors.

image: 'https://updates.kinopio.club/pages/blog/posts/bending-connections/gr.webp'

---

For a couple months now, on and off, I’ve been working on ways to solve the problem of connection lines always appearing as lines between top-right item connectors.

My first approach was to have the lines automatically adjust based on the closest points between items.

<p>
<video class="" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/pages/blog/posts/bending-connections/1.mp4">
</video>
</p>


Some people had a good impression of this first prototype, they wondered why it didn’t always work this way (a good sign!). But a lot more people said the line positions felt more unpredictable and that the shuffling movement felt unnerving, even spider-like.

So I took another pass on tuning it so that connection lines only draw between the top corners, with a bias for the top-right. More people seemed to like this but I also noticed and got feedback that it was distracting when the closest points changed causing the lines to jump around.

<p>
<video class="" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/pages/blog/posts/bending-connections/2.mp4">
</video>
</p>


I then tried to minimize the jumping effect, by minimizing distance between jump points. Instead of only snapping to the corners, lines could also snap to N E S W cardinal points. This also had the nice side effect of allowing more conventional/diagram-y shapes. But this was even more spider-like.

<p>
<video class="" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/pages/blog/posts/bending-connections/3.mp4">
</video>
</p>


Finally, I added a little snapping animation when the line endpoints change. There were a lot of weird edge cases to iron out, like having animation delays to reduce the jittery feel of  jumping lines, but I eventually got something workable.

<p>
<video class="" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/pages/blog/posts/bending-connections/4.mp4">
</video>
</p>

While still a hate/love reception, the majority of users thought this approach demoed well. This code was now reviewed, QA-ed, and totally ready to ship. But I kept using it on my own for a week or so just to make sure … and I realized that this approach was a mistake. Automatic snapping worked really well in some cases, but it would create awkward looking connections in other scenarios.

But the biggest problem I had with it was that it changed how I moved cards around. I started self-consciously moving cards in ways that I knew would create nice looking connections, it was no longer the breezy feeling I wanted to have in Kinopio.

So I scrapped it all.

I learned that snap points are better manually set instead – but also that conventional UI approaches for setting anchor/snap points on cards in other apps were too awkward or too technical.

The problem was in my head for weeks. I’d sketch out ideas, on and off, but nothing seemed satisfying enough for Kinopio.

Eventually, I came up with the idea of dragging any part of a connection line to control how it curves around other items. This was more elegant and easier to build than the previous ideas were. Thinking about it as manipulating lines directly, instead of setting connection points is a lot more engaging than thinking about snap points.

<p>
<video class="" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/pages/blog/posts/bending-connections/gr.mp4">
</video>
</p>

The response to this new direction was way more immediately positive, with people remarking that this now felt like how it should be.

So now you can drag lines to tidy things up, bunching lines together, and generally for making your spaces easier to follow.

(Desktop only because mobile touching isn’t precise enough)

A classic case where the most intuitive solution is only obvious in hindsight, and where the design process is anything but A → B.

<p>
<video class="" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/pages/blog/posts/bending-connections/final.mp4">
</video>
</p>
