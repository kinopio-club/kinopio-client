---
title: 'Early May Bug Fixes and Enhancements'
metaDate: 'May 14, 2024'
date: 2024-05-14
category: New Stuff
image: 'https://updates.kinopio.club/pages/blog/posts/early-may-bug-fixes/ig-url-preview-card.webp'
---

A summary of all the bug fixes and little improvements from the last two weeks:

![Card linked to Dream Market Digital LA on Instagram](https://updates.kinopio.club/pages/blog/posts/early-may-bug-fixes/ig-url-preview-card.webp)


[Improved] Added a handy link in `About` to the Roadmap space

<img src="https://updates.kinopio.club/pages/blog/posts/early-may-bug-fixes/about-roadmap.webp" class="narrow">

[Fixed] Added unread badges to Explore, following, Everyone sections to better connect the unread count to the section(s) it's referring to

<img src="https://updates.kinopio.club/pages/blog/posts/early-may-bug-fixes/explore-unread.webp" class="narrow">

[Improved] `Paint Select` dialog redesigned to be less fiddly based on feedback

<img src="https://updates.kinopio.club/pages/blog/posts/early-may-bug-fixes/paint-select.webp" class="narrow">

[Fixed] Cards are correctly paint selectable even while zoomed out

[Fixed] When another user made any kind of edit to a card (like renaming, moving or resizing) the original card user is maintained

[Fixed] Redesigned card `TagPicker` dialog and fixed a bug causing the page to scroll too much when the picker was opened

[Improved] Database upgraded from postgres v10 to v16 for long-term maintainability

[Improved] display usernames and relative times added in Sidebar → Comments

<img src="https://updates.kinopio.club/pages/blog/posts/early-may-bug-fixes/sidebar-comments.webp" class="narrow">

[Improved] Card vote counter starts at 1 (instead of 0), to make it better to use as a +1/upvote on cards


[Fixed] When marking a space as a template, they now immediately show up in the `Templates` dialog

[Fixed] When toggling on/off card(s) checkbox(es), any connected connection line positions correctly update

[Improved] The `Themes` and `Accounts` panes in User Settings got some mild design improvements to make them a bit easier to visually skim. For developer convenienece, you can now copy your userId from `Accounts → Developer Info`

[Improved] All unsubscribe-able emails (notifications, weekly reviews, etc.) now include [unsubscribe headers](https://postmarkapp.com/blog/list-unsubscribe-header) to allow clients like gmail/yahoo to provide 1-click unsubscribe buttons

[Improved] Added support for copying and pasting images into cards, the same way you can for copied text

[Fixed] Changing the url in a card now correctly updates it's url preview

[fixed] Text in codeblocks correctly display in dark mode

[Improved] Instagram url preview images no longer stop working. Basically IG invalidates old image urls after a couple days, so now i'm saving all url preview images directly into kinopio. besides fixing this issue, this may also improve load times for all new url cards)
