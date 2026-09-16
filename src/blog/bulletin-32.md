---
title: 'Bulletin № 32'
date: 2023-09-20
category: Bulletin
image: 'https://updates.kinopio.club/ambassador-space-thumb.png?a=1'
description: In the last bulletin, I promised that the next time I wrote you would be when the then-in-progress Kinopio for iOS was out. Well, now it is!
---


Hi friends,

A couple months ago, I promised that the next bulletin I'd write would be about Kinopio for iOS. Well, now it's out!

<img src="https://updates.kinopio.club/ios-app-iphone-photo.jpg" class="">

You can [download Kinopio for iOS on the App Store](https://apps.apple.com/us/app/kinopio/id6448743101). And – if you're so inclined – you can [read about how it was made](https://pketh.org/kinopio-ios.html) too.

Besides the new app, it's been a packed couple of months. There's a couple new features, a bunch of little performance and quality-of-life improvements, and a lot of boring-but-fundamental infrastructure improvements that'll keep Kinopio running fast and reliably for years to come.

## Also New

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/card-text-editor-keyboard-enter-shortcuts.mp4">
</video>
</p>

- The [Card Text Editor](https://kinopio.club/blog/card-text-editor) lets you edit your cards linearly as if they were paragraphs blocks.
- For those who work in dark mode (`t`), there are new [Dark Background variants](https://kinopio.club/blog/dark-backgrounds) for every built-in space background to keep things easy on the eyes.


<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/connection-highlighting.mp4">
</video>
</p>

- [Improved Connection Highlighting](https://kinopio.club/blog/connection-highlighting) helps guide your eye and visually untangle busy spaces.

## Improvements

- Uploaded files are now served from CDN urls, which means that your cards will load just as fast in Jakarta as they do in Brooklyn.
- Speaking of 🌍, the billing system was totally rewritten to work better internationally. You can also now update your billing details and payment method anytime (`User → Settings → Billing and Credits → Customer Portal`)
- 10x performance improvement of loading spaces which have a lot space and card links in them. (Like [this one](https://kinopio.club/-2023-humdrum-zxU5zQtON09eepqKhJrhG))
- The browser extension and iOS share sheet have a cleaner design that loads faster and takes up less space
- you can now change your email and password while signed in via `User → Settings → Account`
- When naming boxes, the input field now grows as your type to make it easier to write long box names (also fixes an issue where the 1Password browser extension would try and autofill the field like a password)
- Card links no longer display their space at the top of the card card for a more compact appearance.
- The `Pricing` button in the header is now always visible unless you upgrade (before it'd go away after Sign In, but enough people couldn't find it when they needed it)
- Free card limit progress is moved to `Pricing`
- A `back` button next to your current space in the header for jumping to your previously visited space in the current session. Handy for peeking into a space and going back to where you were, especially when using the native desktop and mobile apps.
- If you don't like the random cycling colors that appear above or outside your space when zoomed out, you can now set it to plain grey in `user → settings → controls`

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/ios-app-header.mp4">
</video>
</p>

## Fixes

- If you're an upgraded user and you invite other people to a space, they'll be able to upload any size file in it (just like how they can add unlimited cards for free).
- Fixed a bug where card widths would displayed very narrow when adding a URL to them
- The backend server infrastructure was completely cleaned, lubed and adjusted. Core parts like `node.js`, `bcrypt`, `sequelize` were upgraded to modern versions, and old libraries and other gunk was cleaned out. Shockingly, it seems to have gone quite smoothly.
- The browser back button now works reliability, especially for signed out users
- Align and Distribute commands now calculate positions correctly when zoomed out

## Works and Experiments in Progress

- Invite read-only viewers to private spaces
- Faster image uploads / HEIC file support
- Customizable card h1/h2 fonts
- Card tilting
- Lines: A totally new tool for organizing your spaces


## A Call for Friends of Kinopio

If you've read it this far then you must be quite special.

If you're interested in building an audience by blogging, video-ing, or podcast-ing about Kinopio – and getting an exclusive user badge and cool stickers – then maybe the _Friends-of-Kinopio_ Ambassador program is for you.

<img src="https://updates.kinopio.club/ambassador-space-cropped.png" class="">

There's only 5 spots left though, so [check out this space](https://kinopio.club/friends-of-kinopio-ambassadors-YNmS6C3fofN3R9mYgO1Bu) to learn more and join the club.
