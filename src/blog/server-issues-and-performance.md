---
title: 'Server Issues and Performance Upgrades'
date: 2024-04-04
category: How It's Made
video: 'https://kinopio-blog.us-east-1.linodeobjects.com/anime-tape-reels.mp4'
description: Overhauled the server and database to make them substantially faster and more reliable
---

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://kinopio-blog.us-east-1.linodeobjects.com/anime-tape-reels.mp4">
</video>
</p>


Last week, I [reported](https://twitter.com/KinopioClub/status/1771649010484285544) a Kinopio service outage:

> 🚑 Kinopio service will be unstable for the next few days as we work to diagnose some really tricky race-condition bugs that are crashing the server. I'm really sorry for the issue, and I'll write up a full retrospective of this issue in the next bulletin or blog post

Three days later, the problems were [fixed](https://twitter.com/KinopioClub/status/1772326592603136466), and since then [Lucas](https://lucas.love/) and I overhauled the server and database to make them substantially faster and more reliable.

For example, downloading a space used to take ~5s, and now takes ~100ms. And issues with cards and connections not correctly saving their positions were fixed, so no more errant connection lines.

# More Details

This whole affair was a big learning experience for me, especially in the low level details of how databases work. Including some painful lessons about the dangers of relying on Sequelize's automatic sync.

While I worked with Lucas to understand the problem, I captured all my notes in [this space](https://kinopio.club/db-debugging-and-tasks---mar-24---apr-rOi8bPSTBX6F5dlC3rYLe). But basically, two totally separate bugs worked together to take down the server:

## 1. A Client Sync Bug

In some conditions, the client app would send update operations in the wrong order (e.g. trying to create a connection, before the connectionType it belongs to being created), causing the database to throw errors.

These thrown errors weren't being properly `catch`ed and would crash the server. When the client found out that it's operation request failed, it would retry it, again causing the server to throw the same error and crash repeatedly.

The solution was to overhaul the logging and error handling systems.

## 2. And a Database Sync Bug

In prior jobs, I've had to use things like Rails' Active Record Migrations anytime I needed to make any change to the database. It was a manual and laborious process. So when I learned that Sequelize could automatically sync the state of the database to reflect it's model files it felt like a magical slam dunk. And it was, until now.

For better and worse, there is nothing magic about databases. Turns out that whenever Sequelize was doing those automatic syncs on boot it was adding new table indexes each time. When the server started crashing and restarting, more and more of these indexes kept getting generated. Eventually reading and writing to the database became so slow that Heroku would restart the app thinking it had crashed... which of course caused even more indexes to be created, until the app could no longer even start under it's accrued weight.

The solution was to clean out all those garbage indexes, and build the infrastructure to use safer but slower manual migrations for db updates going forward.

-----

The lessons I learned from this week won't soon be forgotten. We're monitoring the server and aggressively scrubbing out bits of gunk and cobwebs to prevent something like this from happening again.

But also, it feels good to know that everything in the machine is humming along nicely now, and that my server debugging skills have really levelled up.
