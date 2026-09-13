---
title: 'Raycast Extension'
metaDate: 'Jan 18, 2022'
date: 2023-01-18
category: New Stuff
image: 'https://kinopio-blog.us-east-1.linodeobjects.com/kinopio-inbox-1.png'
description: Quickly capture ideas to your inbox with the Kinopio extension for Raycast
---

Quickly capture ideas to your inbox with the Kinopio extension for [Raycast](https://www.raycast.com/) on macOS

You can install it from the [Raycast Store](https://www.raycast.com/pirijan/kinopio-inbox)

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/raycast-extension.mp4">
</video>
</p>

# Implementation Notes

Raycast Extensions are each little self contained `React/Typescript` web-apps which you build locally and then submit to a Github Repo as a new folder. There are automated review stages that ensure your `package.json` file has all the right info, among other things. And then there's a manual review where a staff member checks your app to see if it works.

It's all conceptually straightforward and would work well with a future Raycast for Windows and Linux.

That said, `React` is still as annoying as I remember (it's almost as if it was made by facebook to solve problems that mostly affect facebook), and as a first time `Typescript`-er I had trouble getting my code to stop throwing irrelevant type errors for basic things. It would've saved me a lot of time if I could've just wrote regular javascript instead :(
