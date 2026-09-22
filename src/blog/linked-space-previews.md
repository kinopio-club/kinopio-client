---
title: 'Linked Space Previews'
date: 2023-12-05
category: How It's Made
image: 'https://kinopio-blog.us-east-1.linodeobjects.com/linked-space-preview-thumbnail.webp'
description: Reposition connection labels to get them just right
---

When you link to a space (either with the `/` command, or by pasting in it's URL), you'll get a visual preview of the space

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/linked-space-previews.mp4">
</video>
</p>

## Power-User Tips

The need for space links that _felt_ like space links (akin to portals to another world) was originally requested on discord and in the [forums](https://club.kinopio.club/t/new-types-of-links-space-links-back-links/1200/12).

The previous design for space links was as inline badges inside the card name, but to make this design work, the design of these links was changed to be more like regular web links.  This comes with some implications that power-users who are already using space links should know about:

- The height of cards with a space link is now a little taller, so some tightly packed layouts are gonna need to be manually cleaned up.
- To avoid disrupting existing layouts as much as possible, your existing space link cards won’t have image previews. You’ll need to toggle them on inside the card.
- The linked space also needs to have a space preview image generated, which you can do by visiting the space at least once. Each time you visit the space the preview will be regenerated. That said, it might take up to 5 minutes before your shows you the latest generated version.
- Eventually the plan is to use these generated images in more places, like on an explore page and for URL unfurls in other apps.
- Previews are generated using light theme colors. If there's demand for dark mode previews let me know and I'll add that in the future.